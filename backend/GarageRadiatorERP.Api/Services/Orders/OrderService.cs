using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using GarageRadiatorERP.Api.Data;
using GarageRadiatorERP.Api.Models.Orders;
using GarageRadiatorERP.Api.DTOs.Orders;
using GarageRadiatorERP.Api.Models.Inventory;
using Microsoft.AspNetCore.SignalR;

namespace GarageRadiatorERP.Api.Services.Orders
{
    public interface IOrderService
    {
        Task<GarageRadiatorERP.Api.DTOs.System.PagedResponseDto<OrderDto>> GetOrdersAsync(int page = 1, int limit = 100, global::System.Threading.CancellationToken cancellationToken = default);
        Task<OrderDto> CreatePOSOrderAsync(CreatePOSOrderDto dto, global::System.Threading.CancellationToken cancellationToken = default);
        Task CancelOrderAsync(Guid orderId, string reason);
        Task ReturnOrderAsync(Guid orderId);
    }

    public class OrderService : IOrderService
    {
        private readonly AppDbContext _context;
        private readonly Microsoft.AspNetCore.SignalR.IHubContext<GarageRadiatorERP.Api.Hubs.ChatHub> _hubContext;
        private readonly GarageRadiatorERP.Api.Services.System.ITenantProvider _tenantProvider;
        private readonly Microsoft.Extensions.Configuration.IConfiguration _configuration;
        private readonly GarageRadiatorERP.Api.Services.System.ISystemConfigurationService _configService;

        private readonly AutoMapper.IMapper _mapper;
        private readonly Platforms.IPlatformService _platformService;

        public OrderService(
            AppDbContext context,
            Microsoft.AspNetCore.SignalR.IHubContext<GarageRadiatorERP.Api.Hubs.ChatHub> hubContext,
            GarageRadiatorERP.Api.Services.System.ITenantProvider tenantProvider,
            Microsoft.Extensions.Configuration.IConfiguration configuration,
            GarageRadiatorERP.Api.Services.System.ISystemConfigurationService configService,
            AutoMapper.IMapper mapper,
            Platforms.IPlatformService platformService)
        {
            _context = context;
            _hubContext = hubContext;
            _tenantProvider = tenantProvider;
            _configuration = configuration;
            _configService = configService;
            _mapper = mapper;
            _platformService = platformService;
        }


        public async Task<GarageRadiatorERP.Api.DTOs.System.PagedResponseDto<OrderDto>> GetOrdersAsync(int page = 1, int limit = 100, global::System.Threading.CancellationToken cancellationToken = default)
        {
            var query = _context.Orders
                .Include(o => o.Customer)
                .Include(o => o.OnlineDetails);
            int totalCount = await query.CountAsync(cancellationToken);

            var data = await query
                .OrderByDescending(o => o.OrderDate)
                .Skip((page - 1) * limit)
                .Take(limit)
                .ToListAsync(cancellationToken);

            var dtos = _mapper.Map<List<OrderDto>>(data);

            return new GarageRadiatorERP.Api.DTOs.System.PagedResponseDto<OrderDto>(dtos, totalCount, page, limit);
        }


        public async Task<OrderDto> CreatePOSOrderAsync(CreatePOSOrderDto dto, global::System.Threading.CancellationToken cancellationToken = default)
        {
            if (dto.CustomerId.HasValue)
            {
                bool customerExists = await _context.Customers.AnyAsync(c => c.Id == dto.CustomerId.Value, cancellationToken);
                if (!customerExists)
                {
                    throw new ArgumentException("Khách hàng không tồn tại."); // Fix Crash POS CustomerId (Lỗi 16/42)
                }
            }

            // Gộp danh sách truy vấn Batch để tránh N+1 Query (Lỗi 20) và lỗi Query Mù (Lỗi 13)
            var productIds = dto.Items.Select(i => i.ProductId).Distinct().ToList();

            var tenantId = _tenantProvider.GetTenantId();
            var platformStore = await _context.PlatformStores.FirstOrDefaultAsync(s => s.TenantId == tenantId, cancellationToken);
            string businessModel = platformStore?.BusinessModel ?? "Household";

            var taxRules = await _context.TaxConfigurations
                .Where(t => t.BusinessModel == businessModel)
                .ToListAsync(cancellationToken);

            var taxDict = taxRules.ToDictionary(t => t.ProductCategory, t => t);

            int minStockAlertConfig = await _configService.GetValueAsync<int>("Inventory.DefaultMinStockAlert");
            int syncLowStockVal = await _configService.GetValueAsync<int>("Inventory.LowStockSyncPlatformValue");
            if (minStockAlertConfig <= 0) minStockAlertConfig = 5;

            int maxRetries = 3;
            for (int retry = 0; retry < maxRetries; retry++)
            {
                // Dùng Database Transaction (Lỗi 11)
                using var transactionDbContext = await _context.Database.BeginTransactionAsync(cancellationToken);
                var notificationsToSend = new List<object>();

                // Lỗi 61: Memory State Mutation khi Retry
                // Di chuyển query vào trong vòng lặp để lấy Fresh State từ Database sau khi Rollback.
                var allBatches = await _context.InventoryBatches
                    .Where(b => productIds.Contains(b.ProductId) && b.RemainingQuantity > 0)
                    .OrderBy(b => b.ImportDate)
                    .ToListAsync(cancellationToken);

                // Nhóm cấu hình MinStockLevel (Lỗi 44)
                var products = await _context.Products
                    .Include(p => p.Category)
                    .Where(p => productIds.Contains(p.Id))
                    .ToDictionaryAsync(p => p.Id, cancellationToken);

                // Fix Lỗ hổng IDOR: Chặn nhân viên hack POST request truyền mã hàng của Gara khác.
                // Do Query Filter đã lọc products theo _tenantId, nếu số lượng trả về ít hơn số lượng IDs Client gửi lên,
                // chắc chắn có mã hàng bịa đặt hoặc thuộc Gara khác.
                if (products.Count != productIds.Count)
                {
                    throw new UnauthorizedAccessException("Phát hiện mã sản phẩm không hợp lệ hoặc không thuộc quyền sở hữu!");
                }

                // Bối cảnh 2: Lấy giá vốn gần nhất Lịch sử bất kể tồn kho (để đề phòng kho hết sạch hàng)
                var historicalCosts = await _context.InventoryBatches
                    .Where(b => productIds.Contains(b.ProductId))
                    .GroupBy(b => b.ProductId)
                    .Select(g => new
                    {
                        ProductId = g.Key,
                        LatestCost = g.OrderByDescending(x => x.ImportDate).Select(x => x.CostPrice).FirstOrDefault()
                    })
                    .ToDictionaryAsync(x => x.ProductId, x => x.LatestCost, cancellationToken);

                try
                {
                    var order = new Order
                    {
                        CustomerId = dto.CustomerId,
                        Source = OrderSource.POS.ToString(), // Fix Magic Strings (Lỗi 15)
                        Status = OrderStatus.Completed.ToString(),
                        PaymentStatus = Models.Orders.PaymentStatus.Paid.ToString(),
                        OrderDate = DateTime.UtcNow, // Lỗi 3: Chuẩn Enterprise dùng UTC lưu DB
                        Notes = dto.Notes
                    };

                    decimal totalAmount = 0;
                    decimal totalCost = 0;
                    decimal totalGoodsValue = 0;
                    decimal totalVatAmount = 0;
                    decimal totalPitAmount = 0;

                    foreach (var itemDto in dto.Items)
                    {
                        // Fix Hack số lượng âm (Lỗi 10)
                        if (itemDto.Quantity <= 0)
                            throw new ArgumentException($"Số lượng cho sản phẩm {itemDto.ProductId} phải lớn hơn 0.");

                        var batchesToDeduct = allBatches.Where(b => b.ProductId == itemDto.ProductId).ToList();

                        int qtyToFulfill = itemDto.Quantity;

                        // Bối cảnh 2 (Phần 2): Tránh gán giá vốn (Cost) = Giá bán (Price).
                        // Lấy giá trị fallback từ lịch sử lô nhập mới nhất (historicalCosts) trước tiên.
                        // Đây là query độc lập đã quét toàn bộ lịch sử không quan tâm tồn kho còn hay hết.
                        decimal fallbackCostPrice = historicalCosts.TryGetValue(itemDto.ProductId, out var hc) && hc > 0 ? hc : 0;

                        // Nếu sản phẩm này hoàn toàn chưa từng được nhập kho bao giờ (historical cost = 0)
                        // Lúc này fallback về StandardCost. Nếu StandardCost cũng bằng 0 thì throw error không cho bán.
                        var productObj = products.TryGetValue(itemDto.ProductId, out var p) ? p : null;

                        if (fallbackCostPrice == 0 && productObj != null)
                        {
                            if (productObj.StandardCost > 0)
                            {
                                fallbackCostPrice = productObj.StandardCost;
                            }
                            else
                            {
                                throw new InvalidOperationException($"Không thể tạo đơn: Chưa xác định được giá vốn cho SKU {productObj.SKU}. Vui lòng nhập kho hoặc cập nhật Giá vốn tiêu chuẩn cho sản phẩm");
                            }
                        }

                        decimal currentVatRate = 0;
                        decimal currentPitRate = 0;
                        if (productObj != null && productObj.Category != null && taxDict.TryGetValue(productObj.Category.Name, out var taxConfig))
                        {
                            currentVatRate = taxConfig.VatRate;
                            currentPitRate = taxConfig.PitRate;
                        }

                        foreach (var batch in batchesToDeduct)
                        {
                            if (qtyToFulfill <= 0) break;
                            if (batch.RemainingQuantity <= 0) continue; // Fix thuật toán trừ ngây thơ âm (Lỗi 12)

                            int qtyFromThisBatch = Math.Min(batch.RemainingQuantity, qtyToFulfill);

                            batch.RemainingQuantity -= qtyFromThisBatch;
                            qtyToFulfill -= qtyFromThisBatch;

                            decimal lineVat = (qtyFromThisBatch * itemDto.UnitPrice) * (currentVatRate / 100m);
                            decimal linePit = (qtyFromThisBatch * itemDto.UnitPrice) * (currentPitRate / 100m);

                            var orderItem = new OrderItem
                            {
                                Order = order,
                                ProductId = itemDto.ProductId,
                                InventoryBatch = batch,
                                Quantity = qtyFromThisBatch,
                                UnitPrice = itemDto.UnitPrice,
                                CostPrice = batch.CostPrice,
                                BackorderQuantity = 0,
                                TaxRate = currentVatRate,
                                TaxAmount = lineVat
                            };
                            order.Items.Add(orderItem);

                            // Fix tham chiếu khóa ngoại chắp vá (Lỗi 14): Gán trực tiếp Object thay vì ReferenceDocument string
                            var transaction = new InventoryTransaction
                            {
                                Order = order, // Entity Framework tự động mapping Khóa ngoại
                                ProductId = itemDto.ProductId,
                                Batch = batch,
                                Type = "sale",
                                QuantityChange = -qtyFromThisBatch,
                                ReferenceDocument = "POS Order", // Có thể lưu chuỗi mô tả
                                CreatedAt = DateTime.UtcNow // Lỗi 3
                            };
                            _context.InventoryTransactions.Add(transaction);

                            totalAmount += (qtyFromThisBatch * itemDto.UnitPrice) + lineVat;
                            totalCost += (qtyFromThisBatch * batch.CostPrice);
                            totalGoodsValue += (qtyFromThisBatch * itemDto.UnitPrice);
                            totalVatAmount += lineVat;
                            totalPitAmount += linePit;

                            // Fix Spam & Ngưỡng báo cáo tồn kho (Lỗi 42, Lỗi 44)
                            int currentTotalStock = allBatches.Where(b => b.ProductId == itemDto.ProductId).Sum(b => b.RemainingQuantity);
                            int minStockLevel = products.TryGetValue(itemDto.ProductId, out var prod) ? prod.MinStockLevel : minStockAlertConfig;

                            if (currentTotalStock < minStockLevel)
                            {
                                // Không gửi ngay lập tức để tránh Spam nếu Transaction rollback (Lỗi 43)
                                notificationsToSend.Add(new
                                {
                                    message = $"⚠️ Cảnh báo tồn kho: Mã sản phẩm {itemDto.ProductId} sắp hết. Tổng tồn kho hiện tại: {currentTotalStock}.",
                                    type = "warning",
                                    time = DateTime.UtcNow
                                });
                            }

                            // Gọi đẩy tồn kho sau khi đã trừ đi số lượng bán
                            await _platformService.SyncStockToPlatformAsync(itemDto.ProductId, currentTotalStock < minStockLevel ? syncLowStockVal : currentTotalStock);
                        }

                        if (qtyToFulfill > 0)
                        {
                            decimal lineVat = (qtyToFulfill * itemDto.UnitPrice) * (currentVatRate / 100m);
                            decimal linePit = (qtyToFulfill * itemDto.UnitPrice) * (currentPitRate / 100m);

                            // Fix bán âm gán giá vốn = 0 (Lỗi 9)
                            var backOrderItem = new OrderItem
                            {
                                Order = order,
                                ProductId = itemDto.ProductId,
                                Quantity = qtyToFulfill,
                                BackorderQuantity = qtyToFulfill,
                                UnitPrice = itemDto.UnitPrice,
                                CostPrice = fallbackCostPrice, // Giá vốn trung bình/lô cuối thay vì 0
                                TaxRate = currentVatRate,
                                TaxAmount = lineVat
                            };
                            order.Items.Add(backOrderItem);

                            // Bối cảnh 1 (Phần 2): Kế toán chửi vụ bán âm kho - Phải ghi nhận Transaction xuất âm
                            var negativeTransaction = new InventoryTransaction
                            {
                                Order = order, // Entity Framework tự động mapping Khóa ngoại
                                ProductId = itemDto.ProductId,
                                Batch = null, // Bán âm thì chưa có lô thực tế
                                Type = "backorder",
                                QuantityChange = -qtyToFulfill,
                                ReferenceDocument = "POS Order (Negative/Backorder)",
                                CreatedAt = DateTime.UtcNow
                            };
                            _context.InventoryTransactions.Add(negativeTransaction);

                            totalAmount += (qtyToFulfill * itemDto.UnitPrice) + lineVat;
                            totalCost += (qtyToFulfill * fallbackCostPrice);
                            totalGoodsValue += (qtyToFulfill * itemDto.UnitPrice);
                            totalVatAmount += lineVat;
                            totalPitAmount += linePit;
                        }
                    }

                    order.TotalAmount = totalAmount;
                    order.TotalCost = totalCost;
                    order.TotalGoodsValue = totalGoodsValue;
                    order.TotalVatAmount = totalVatAmount;
                    order.TotalPitAmount = totalPitAmount;
                    order.PlatformFee = 0;
                    order.ShippingFee = 0;
                    order.ActualReceived = totalAmount;
                    order.Profit = order.ActualReceived - totalCost;

                    _context.Orders.Add(order);
                    await _context.SaveChangesAsync(cancellationToken);
                    await transactionDbContext.CommitAsync(cancellationToken);

                    // Send Notifications after Commit (Lỗi 43)
                    var currentTenantId = _tenantProvider.GetTenantId();
                    var adminGroupName = currentTenantId.HasValue ? $"InventoryAdmins_{currentTenantId.Value}" : "InventoryAdmins";

                    foreach (var notif in notificationsToSend)
                    {
                        // Gửi đích danh cho Group InventoryAdmins của Tenant hiện tại thay vì Clients.All (Lỗi 42)
                        await _hubContext.Clients.Group(adminGroupName).SendAsync("ReceiveNotification", notif, cancellationToken: cancellationToken);
                    }

                    return new OrderDto
                    {
                        Id = order.Id,
                        Source = order.Source,
                        Status = order.Status,
                        TotalAmount = order.TotalAmount,
                        TotalCost = order.TotalCost,
                        ActualReceived = order.ActualReceived,
                        PlatformFee = order.PlatformFee,
                        ShippingFee = order.ShippingFee,
                        Profit = order.Profit
                    };
                }
                catch (DbUpdateConcurrencyException)
                {
                    await transactionDbContext.RollbackAsync(cancellationToken);
                    if (retry == maxRetries - 1)
                        throw new Exception("Quá nhiều giao dịch đồng thời, vui lòng thử lại sau (Concurrency Conflict).");

                    // Lỗi 56: Rác Tracker tạo đơn hàng nhân bản. Phải Clear vì nếu không các Entity Added (Order, Item) sẽ bị tạo lại nhiều lần.
                    // ReloadAsync không áp dụng được cho trạng thái Added!
                    _context.ChangeTracker.Clear();
                }
                catch (Exception)
                {
                    await transactionDbContext.RollbackAsync(cancellationToken);
                    throw;
                }
            }
            throw new Exception("Unexpected error during Order creation.");
        }

        public async Task CancelOrderAsync(Guid orderId, string reason)
        {
            var order = await _context.Orders
                .Include(o => o.Items)
                .ThenInclude(i => i.InventoryBatch)
                .Include(o => o.OnlineDetails)
                .FirstOrDefaultAsync(o => o.Id == orderId);

            if (order == null) throw new ArgumentException("Order not found");
            if (order.Status == "Cancelled" || order.Status == "Returned") throw new InvalidOperationException("Order is already cancelled or returned.");

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                order.Status = "Cancelled";
                order.Notes = (order.Notes + $"\nCancelled Reason: {reason}").Trim();

                foreach(var item in order.Items)
                {
                    if (item.InventoryBatchId.HasValue && item.InventoryBatch != null)
                    {
                        item.InventoryBatch.RemainingQuantity += item.Quantity; // Restore stock

                        var returnTransaction = new InventoryTransaction
                        {
                            ProductId = item.ProductId,
                            BatchId = item.InventoryBatchId,
                            OrderId = order.Id,
                            Type = "cancel_restore",
                            QuantityChange = item.Quantity,
                            ReferenceDocument = "Cancel Order",
                            CreatedAt = DateTime.UtcNow
                        };
                        _context.InventoryTransactions.Add(returnTransaction);
                    }

                    // Trigger Sync Stock
                    var totalStock = await _context.InventoryBatches
                        .Where(b => b.ProductId == item.ProductId && b.RemainingQuantity > 0)
                        .SumAsync(b => b.RemainingQuantity);
                    // Stock before save is old stock, we need to add the restored quantity for accurate sync before commit
                    await _platformService.SyncStockToPlatformAsync(item.ProductId, totalStock + item.Quantity);
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task ReturnOrderAsync(Guid orderId)
        {
            var order = await _context.Orders
                .Include(o => o.Items)
                .ThenInclude(i => i.InventoryBatch)
                .Include(o => o.OnlineDetails)
                .FirstOrDefaultAsync(o => o.Id == orderId);

            if (order == null) throw new ArgumentException("Order not found");
            if (order.Status != "Shipped" && order.Status != "Completed") throw new InvalidOperationException("Only shipped or completed orders can be returned.");

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                order.Status = "Returned";

                foreach(var item in order.Items)
                {
                    if (item.InventoryBatchId.HasValue && item.InventoryBatch != null)
                    {
                        item.InventoryBatch.RemainingQuantity += item.Quantity;

                        var returnTransaction = new InventoryTransaction
                        {
                            ProductId = item.ProductId,
                            BatchId = item.InventoryBatchId,
                            OrderId = order.Id,
                            Type = "return",
                            QuantityChange = item.Quantity,
                            ReferenceDocument = "Return Order",
                            CreatedAt = DateTime.UtcNow
                        };
                        _context.InventoryTransactions.Add(returnTransaction);
                    }

                    var totalStock = await _context.InventoryBatches
                        .Where(b => b.ProductId == item.ProductId && b.RemainingQuantity > 0)
                        .SumAsync(b => b.RemainingQuantity);

                    await _platformService.SyncStockToPlatformAsync(item.ProductId, totalStock + item.Quantity);
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }
    }
}

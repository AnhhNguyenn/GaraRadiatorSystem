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
        Task<GarageRadiatorERP.Api.DTOs.System.PagedResponseDto<OrderDto>> GetOrdersAsync(int page = 1, int limit = 100, System.Threading.CancellationToken cancellationToken = default);
        Task<OrderDto> CreatePOSOrderAsync(CreatePOSOrderDto dto);
    }

    public class OrderService : IOrderService
    {
        private readonly AppDbContext _context;
        private readonly Microsoft.AspNetCore.SignalR.IHubContext<GarageRadiatorERP.Api.Hubs.ChatHub> _hubContext;

        public OrderService(AppDbContext context, Microsoft.AspNetCore.SignalR.IHubContext<GarageRadiatorERP.Api.Hubs.ChatHub> hubContext)
        {
            _context = context;
            _hubContext = hubContext;
        }

        public async Task<GarageRadiatorERP.Api.DTOs.System.PagedResponseDto<OrderDto>> GetOrdersAsync(int page = 1, int limit = 100, System.Threading.CancellationToken cancellationToken = default)
        {
            var query = _context.Orders;
            int totalCount = await query.CountAsync(cancellationToken);

            var data = await query
                .OrderByDescending(o => o.OrderDate)
                .Skip((page - 1) * limit)
                .Take(limit)
                .Select(o => new OrderDto
                {
                    Id = o.Id,
                    Source = o.Source,
                    Status = o.Status,
                    TotalAmount = o.TotalAmount,
                    TotalCost = o.TotalCost,
                    Profit = o.Profit
                })
                .ToListAsync(cancellationToken);

            return new GarageRadiatorERP.Api.DTOs.System.PagedResponseDto<OrderDto>(data, totalCount, page, limit);
        }

        public async Task<OrderDto> CreatePOSOrderAsync(CreatePOSOrderDto dto)
        {
            if (dto.CustomerId.HasValue)
            {
                bool customerExists = await _context.Customers.AnyAsync(c => c.Id == dto.CustomerId.Value);
                if (!customerExists)
                {
                    throw new ArgumentException("Khách hàng không tồn tại."); // Fix Crash POS CustomerId (Lỗi 16/42)
                }
            }

            // Gộp danh sách truy vấn Batch để tránh N+1 Query (Lỗi 20) và lỗi Query Mù (Lỗi 13)
            var productIds = dto.Items.Select(i => i.ProductId).Distinct().ToList();
            var allBatches = await _context.InventoryBatches
                .Where(b => productIds.Contains(b.ProductId) && b.RemainingQuantity > 0)
                .OrderBy(b => b.ImportDate)
                .ToListAsync();

            // Nhóm cấu hình MinStockLevel (Lỗi 44) và AvgCost (Lỗi 9)
            var products = await _context.Products
                .Where(p => productIds.Contains(p.Id))
                .ToDictionaryAsync(p => p.Id);

            int maxRetries = 3;
            for (int retry = 0; retry < maxRetries; retry++)
            {
                // Dùng Database Transaction (Lỗi 11)
                using var transactionDbContext = await _context.Database.BeginTransactionAsync();
                var notificationsToSend = new List<object>();

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

                    foreach (var itemDto in dto.Items)
                    {
                        // Fix Hack số lượng âm (Lỗi 10)
                        if (itemDto.Quantity <= 0)
                            throw new ArgumentException($"Số lượng cho sản phẩm {itemDto.ProductId} phải lớn hơn 0.");

                        var batchesToDeduct = allBatches.Where(b => b.ProductId == itemDto.ProductId).ToList();

                        int qtyToFulfill = itemDto.Quantity;

                        // Lỗi 2: Tránh gán giá vốn (Cost) = Giá bán (Price).
                        // Nếu hết hàng hoàn toàn (không mò được CostPrice in-memory do allBatches rỗng),
                        // phải dùng fallback. Ở đây gán fallbackCostPrice = Price * 0.7 (Biên lợi nhuận gộp 30%)
                        // để kế toán không thấy Profit ảo do Cost = 0.
                        decimal fallbackCostPrice = products.TryGetValue(itemDto.ProductId, out var productObj) && productObj != null ? (productObj.Price * 0.7m) : 0;

                        // Thử lấy giá vốn từ lô cuối cùng in-memory nếu có (Lỗi 56 - Tránh N+1 Query lén lút)
                        var lastBatchCost = allBatches
                            .Where(b => b.ProductId == itemDto.ProductId)
                            .OrderByDescending(b => b.ImportDate)
                            .Select(b => b.CostPrice)
                            .FirstOrDefault();

                        if (lastBatchCost > 0)
                        {
                            fallbackCostPrice = lastBatchCost;
                        }

                        foreach (var batch in batchesToDeduct)
                        {
                            if (qtyToFulfill <= 0) break;
                            if (batch.RemainingQuantity <= 0) continue; // Fix thuật toán trừ ngây thơ âm (Lỗi 12)

                            int qtyFromThisBatch = Math.Min(batch.RemainingQuantity, qtyToFulfill);

                            batch.RemainingQuantity -= qtyFromThisBatch;
                            qtyToFulfill -= qtyFromThisBatch;

                            var orderItem = new OrderItem
                            {
                                Order = order,
                                ProductId = itemDto.ProductId,
                                InventoryBatch = batch,
                                Quantity = qtyFromThisBatch,
                                UnitPrice = itemDto.UnitPrice,
                                CostPrice = batch.CostPrice,
                                BackorderQuantity = 0
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

                            totalAmount += (qtyFromThisBatch * itemDto.UnitPrice);
                            totalCost += (qtyFromThisBatch * batch.CostPrice);

                            // Fix Spam & Ngưỡng báo cáo tồn kho (Lỗi 42, Lỗi 44)
                            int currentTotalStock = allBatches.Where(b => b.ProductId == itemDto.ProductId).Sum(b => b.RemainingQuantity);
                            int minStockLevel = products.TryGetValue(itemDto.ProductId, out var prod) ? prod.MinStockLevel : 3;

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
                        }

                        if (qtyToFulfill > 0)
                        {
                            // Fix bán âm gán giá vốn = 0 (Lỗi 9)
                            var backOrderItem = new OrderItem
                            {
                                Order = order,
                                ProductId = itemDto.ProductId,
                                Quantity = qtyToFulfill,
                                BackorderQuantity = qtyToFulfill,
                                UnitPrice = itemDto.UnitPrice,
                                CostPrice = fallbackCostPrice // Giá vốn trung bình/lô cuối thay vì 0
                            };
                            order.Items.Add(backOrderItem);
                            totalAmount += (qtyToFulfill * itemDto.UnitPrice);
                            totalCost += (qtyToFulfill * fallbackCostPrice);
                        }
                    }

                    order.TotalAmount = totalAmount;
                    order.TotalCost = totalCost;
                    order.Profit = totalAmount - totalCost;

                    _context.Orders.Add(order);
                    await _context.SaveChangesAsync();
                    await transactionDbContext.CommitAsync();

                    // Send Notifications after Commit (Lỗi 43)
                    foreach (var notif in notificationsToSend)
                    {
                        // Gửi đích danh cho Group InventoryAdmins thay vì Clients.All (Lỗi 42)
                        await _hubContext.Clients.Group("InventoryAdmins").SendAsync("ReceiveNotification", notif);
                    }

                    return new OrderDto
                    {
                        Id = order.Id,
                        Source = order.Source,
                        Status = order.Status,
                        TotalAmount = order.TotalAmount,
                        TotalCost = order.TotalCost,
                        Profit = order.Profit
                    };
                }
                catch (DbUpdateConcurrencyException)
                {
                    await transactionDbContext.RollbackAsync();
                    if (retry == maxRetries - 1)
                        throw new Exception("Quá nhiều giao dịch đồng thời, vui lòng thử lại sau (Concurrency Conflict).");

                    // Lỗi 56: Rác Tracker tạo đơn hàng nhân bản. Phải Clear vì nếu không các Entity Added (Order, Item) sẽ bị tạo lại nhiều lần.
                    // ReloadAsync không áp dụng được cho trạng thái Added!
                    _context.ChangeTracker.Clear();
                }
                catch (Exception)
                {
                    await transactionDbContext.RollbackAsync();
                    throw;
                }
            }
            throw new Exception("Unexpected error during Order creation.");
        }
    }
}

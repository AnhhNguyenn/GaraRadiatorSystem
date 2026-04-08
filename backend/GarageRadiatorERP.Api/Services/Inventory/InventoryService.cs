using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using GarageRadiatorERP.Api.Data;
using GarageRadiatorERP.Api.Models.Inventory;
using GarageRadiatorERP.Api.DTOs.Inventory;

namespace GarageRadiatorERP.Api.Services.Inventory
{
    public class InventoryService : IInventoryService
    {
        private readonly AppDbContext _context;
        private readonly AutoMapper.IMapper _mapper;
        private readonly GarageRadiatorERP.Api.Services.Platforms.IPlatformService _platformService;

        public InventoryService(AppDbContext context, AutoMapper.IMapper mapper, GarageRadiatorERP.Api.Services.Platforms.IPlatformService platformService)
        {
            _context = context;
            _mapper = mapper;
            _platformService = platformService;
        }

        public async Task<IEnumerable<InventoryBatchDto>> GetAllBatchesAsync()
        {
            var batches = await _context.InventoryBatches
                .Include(b => b.Product)
                .Include(b => b.BinLocation)
                .ToListAsync();

            return _mapper.Map<IEnumerable<InventoryBatchDto>>(batches);
        }

        public async Task<InventoryBatchDto> CreateBatchAsync(CreateInventoryBatchDto createDto)
        {
            var batch = new InventoryBatch
            {
                ProductId = createDto.ProductId,
                BinLocationId = createDto.BinLocationId,
                BatchNumber = createDto.BatchNumber,
                InitialQuantity = createDto.Quantity,
                RemainingQuantity = createDto.Quantity,
                CostPrice = createDto.CostPrice,
                ImportDate = DateTime.UtcNow
            };

            _context.InventoryBatches.Add(batch);

            // Record transaction
            var transaction = new InventoryTransaction
            {
                ProductId = createDto.ProductId,
                Batch = batch,
                Type = "import",
                QuantityChange = createDto.Quantity, // +
                CreatedAt = DateTime.UtcNow
            };
            _context.InventoryTransactions.Add(transaction);

            await _context.SaveChangesAsync();

            // Reload to get Product Name
            await _context.Entry(batch).Reference(b => b.Product).LoadAsync();

            return new InventoryBatchDto
            {
                Id = batch.Id,
                ProductId = batch.ProductId,
                ProductName = batch.Product.Name,
                InitialQuantity = batch.InitialQuantity,
                RemainingQuantity = batch.RemainingQuantity,
                CostPrice = batch.CostPrice,
                ImportDate = batch.ImportDate
            };
        }

        public async Task<PurchaseOrderDto> CreatePurchaseOrderAsync(CreatePurchaseOrderDto createDto)
        {
            var po = new PurchaseOrder
            {
                SupplierId = createDto.SupplierId,
                PurchaseDate = DateTime.UtcNow,
                Status = "Pending" // Ban đầu lưu dạng Pending, chờ nhập kho thực tế
            };

            decimal totalCost = 0;

            foreach (var item in createDto.Items)
            {
                var poItem = new PurchaseItem
                {
                    ProductId = item.ProductId,
                    Quantity = item.Quantity,
                    CostPrice = item.CostPrice
                };
                po.Items.Add(poItem);

                totalCost += (item.Quantity * item.CostPrice);
            }

            po.TotalCost = totalCost;
            _context.PurchaseOrders.Add(po);
            await _context.SaveChangesAsync();

            return new PurchaseOrderDto
            {
                Id = po.Id,
                SupplierId = po.SupplierId,
                PurchaseDate = po.PurchaseDate,
                TotalCost = po.TotalCost,
                Status = po.Status
            };
        }

        public async Task<PurchaseOrderDto> ReceivePurchaseOrderAsync(Guid poId)
        {
            var po = await _context.PurchaseOrders
                .Include(p => p.Items)
                .FirstOrDefaultAsync(p => p.Id == poId);

            if (po == null)
            {
                throw new ArgumentException("Purchase Order not found");
            }

            if (po.Status == "Completed")
            {
                throw new InvalidOperationException("Purchase Order is already received and completed.");
            }

            foreach (var item in po.Items)
            {
                var batch = new InventoryBatch
                {
                    ProductId = item.ProductId,
                    InitialQuantity = item.Quantity,
                    RemainingQuantity = item.Quantity,
                    CostPrice = item.CostPrice,
                    ImportDate = DateTime.UtcNow,
                    BatchNumber = "PO-" + DateTime.UtcNow.ToString("yyyyMM")
                };
                _context.InventoryBatches.Add(batch);

                item.InventoryBatch = batch; // Link batch to the item

                var transaction = new InventoryTransaction
                {
                    ProductId = item.ProductId,
                    Batch = batch,
                    Type = "import",
                    QuantityChange = item.Quantity,
                    ReferenceDocument = po.Id.ToString(),
                    CreatedAt = DateTime.UtcNow
                };
                _context.InventoryTransactions.Add(transaction);

                // Lấy tổng tồn kho hiện tại + số lượng mới nhập để đồng bộ Sàn TMĐT
                var currentTotalStock = await _context.InventoryBatches
                    .Where(b => b.ProductId == item.ProductId && b.RemainingQuantity > 0)
                    .SumAsync(b => b.RemainingQuantity);

                // Đồng bộ lên Sàn TMĐT
                await _platformService.SyncStockToPlatformAsync(item.ProductId, currentTotalStock + item.Quantity);
            }

            po.Status = "Completed";
            await _context.SaveChangesAsync();

            return new PurchaseOrderDto
            {
                Id = po.Id,
                SupplierId = po.SupplierId,
                PurchaseDate = po.PurchaseDate,
                TotalCost = po.TotalCost,
                Status = po.Status
            };
        }
    }
}

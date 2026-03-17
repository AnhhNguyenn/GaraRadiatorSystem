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
    public interface IInventoryService
    {
        Task<IEnumerable<InventoryBatchDto>> GetAllBatchesAsync();
        Task<InventoryBatchDto> CreateBatchAsync(CreateInventoryBatchDto createDto);
        Task<PurchaseOrderDto> CreatePurchaseOrderAsync(CreatePurchaseOrderDto createDto);
    }

    public class InventoryService : IInventoryService
    {
        private readonly AppDbContext _context;

        public InventoryService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<InventoryBatchDto>> GetAllBatchesAsync()
        {
            return await _context.InventoryBatches
                .Include(b => b.Product)
                .Include(b => b.BinLocation)
                .Select(b => new InventoryBatchDto
                {
                    Id = b.Id,
                    ProductId = b.ProductId,
                    ProductName = b.Product.Name,
                    BinLocation = b.BinLocation != null ? b.BinLocation.Barcode : "N/A",
                    InitialQuantity = b.InitialQuantity,
                    RemainingQuantity = b.RemainingQuantity,
                    CostPrice = b.CostPrice,
                    ImportDate = b.ImportDate
                })
                .ToListAsync();
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
                Status = "Completed" // Auto-receive for simplicity
            };

            decimal totalCost = 0;

            foreach (var item in createDto.Items)
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

                var poItem = new PurchaseItem
                {
                    ProductId = item.ProductId,
                    Quantity = item.Quantity,
                    CostPrice = item.CostPrice,
                    InventoryBatch = batch
                };
                po.Items.Add(poItem);

                var transaction = new InventoryTransaction
                {
                    ProductId = item.ProductId,
                    Batch = batch,
                    Type = "import",
                    QuantityChange = item.Quantity,
                    ReferenceDocument = "PO", // Will be updated later
                    CreatedAt = DateTime.UtcNow
                };
                _context.InventoryTransactions.Add(transaction);

                totalCost += (item.Quantity * item.CostPrice);
            }

            po.TotalCost = totalCost;
            _context.PurchaseOrders.Add(po);
            await _context.SaveChangesAsync();
            
            // update transaction ref
            var transactions = _context.ChangeTracker.Entries<InventoryTransaction>()
                .Where(e => e.Entity.ReferenceDocument == "PO")
                .Select(e => e.Entity);
            foreach (var t in transactions)
            {
                t.ReferenceDocument = po.Id.ToString();
            }
            if (transactions.Any()) await _context.SaveChangesAsync();

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

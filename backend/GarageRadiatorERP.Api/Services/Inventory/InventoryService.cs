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
    }
}

using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using GarageRadiatorERP.Api.DTOs.Inventory;

namespace GarageRadiatorERP.Api.Services.Inventory
{
    public interface IInventoryService
    {
        Task<IEnumerable<InventoryBatchDto>> GetAllBatchesAsync();
        Task<InventoryBatchDto> CreateBatchAsync(CreateInventoryBatchDto createDto);
        Task<PurchaseOrderDto> CreatePurchaseOrderAsync(CreatePurchaseOrderDto createDto);
        Task<PurchaseOrderDto> ReceivePurchaseOrderAsync(Guid poId);
    }
}

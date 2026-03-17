using Microsoft.AspNetCore.Mvc;
using GarageRadiatorERP.Api.Services.Inventory;
using GarageRadiatorERP.Api.DTOs.Inventory;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace GarageRadiatorERP.Api.Controllers.Inventory
{
    [ApiController]
    [Route("api/[controller]")]
    public class InventoryController : ControllerBase
    {
        private readonly IInventoryService _inventoryService;

        public InventoryController(IInventoryService inventoryService)
        {
            _inventoryService = inventoryService;
        }

        [HttpGet("batches")]
        public async Task<ActionResult<IEnumerable<InventoryBatchDto>>> GetBatches()
        {
            var batches = await _inventoryService.GetAllBatchesAsync();
            return Ok(batches);
        }

        [HttpPost("batches")]
        public async Task<ActionResult<InventoryBatchDto>> CreateBatch(CreateInventoryBatchDto createDto)
        {
            var batch = await _inventoryService.CreateBatchAsync(createDto);
            return Ok(batch);
        }
    }
}

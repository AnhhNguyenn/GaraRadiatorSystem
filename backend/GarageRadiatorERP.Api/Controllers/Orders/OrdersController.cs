using Microsoft.AspNetCore.Mvc;
using GarageRadiatorERP.Api.Services.Orders;
using GarageRadiatorERP.Api.DTOs.Orders;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace GarageRadiatorERP.Api.Controllers.Orders
{
    [ApiController]
    [Route("api/v1/[controller]")] // Versioning
    public class OrdersController : ControllerBase
    {
        private readonly IOrderService _orderService;

        public OrdersController(IOrderService orderService)
        {
            _orderService = orderService;
        }

        [HttpGet]
        public async Task<ActionResult<GarageRadiatorERP.Api.DTOs.System.PagedResponseDto<OrderDto>>> GetOrders([FromQuery] int page = 1, [FromQuery] int limit = 100, System.Threading.CancellationToken cancellationToken = default)
        {
            var result = await _orderService.GetOrdersAsync(page, limit, cancellationToken);
            return Ok(result);
        }

        [HttpPost("pos")]
        public async Task<ActionResult<OrderDto>> CreatePOSOrder([FromBody] CreatePOSOrderDto createDto, System.Threading.CancellationToken cancellationToken)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var order = await _orderService.CreatePOSOrderAsync(createDto, cancellationToken);
                return Ok(order);
            }
            catch (System.Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}

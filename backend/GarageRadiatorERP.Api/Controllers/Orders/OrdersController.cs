using Microsoft.AspNetCore.Mvc;
using GarageRadiatorERP.Api.Services.Orders;
using GarageRadiatorERP.Api.DTOs.Orders;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace GarageRadiatorERP.Api.Controllers.Orders
{
    [ApiController]
    [Route("api/v1/[controller]")]
    public class OrdersController : ControllerBase
    {
        private readonly IOrderService _orderService;

        public OrdersController(IOrderService orderService)
        {
            _orderService = orderService;
        }

        [HttpGet]
        public async Task<ActionResult<GarageRadiatorERP.Api.DTOs.System.PagedResponseDto<OrderDto>>> GetOrders([FromQuery] int page = 1, [FromQuery] int limit = 100, global::System.Threading.CancellationToken cancellationToken = default)
        {
            var result = await _orderService.GetOrdersAsync(page, limit, cancellationToken);
            return Ok(result);
        }

        [HttpPost("pos")]
        public async Task<ActionResult<OrderDto>> CreatePOSOrder([FromBody] CreatePOSOrderDto createDto, global::System.Threading.CancellationToken cancellationToken)
        {
            try
            {
                var order = await _orderService.CreatePOSOrderAsync(createDto, cancellationToken);
                return Ok(order);
            }
            catch (global::System.Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("{id}/cancel")]
        public async Task<IActionResult> CancelOrder(global::System.Guid id, [FromBody] string reason)
        {
            try
            {
                await _orderService.CancelOrderAsync(id, reason);
                return Ok(new { message = "Order cancelled successfully." });
            }
            catch (global::System.Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("{id}/return")]
        public async Task<IActionResult> ReturnOrder(global::System.Guid id)
        {
            try
            {
                await _orderService.ReturnOrderAsync(id);
                return Ok(new { message = "Order returned successfully." });
            }
            catch (global::System.Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("{id}/confirm")]
        public async Task<IActionResult> ConfirmOrder(global::System.Guid id, [FromServices] GarageRadiatorERP.Api.Services.Platforms.IPlatformService platformService, [FromBody] string shippingMethod)
        {
            try
            {
                await platformService.ConfirmOrderOnPlatformAsync(id, shippingMethod);
                return Ok(new { message = "Order confirmed successfully." });
            }
            catch (global::System.Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}

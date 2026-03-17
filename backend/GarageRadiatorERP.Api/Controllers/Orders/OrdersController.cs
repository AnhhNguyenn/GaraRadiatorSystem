using Microsoft.AspNetCore.Mvc;
using GarageRadiatorERP.Api.Services.Orders;
using GarageRadiatorERP.Api.DTOs.Orders;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace GarageRadiatorERP.Api.Controllers.Orders
{
    [ApiController]
    [Route("api/[controller]")]
    public class OrdersController : ControllerBase
    {
        private readonly IOrderService _orderService;

        public OrdersController(IOrderService orderService)
        {
            _orderService = orderService;
        }

        [HttpPost("pos")]
        public async Task<ActionResult<OrderDto>> CreatePOSOrder(CreatePOSOrderDto createDto)
        {
            try
            {
                var order = await _orderService.CreatePOSOrderAsync(createDto);
                return Ok(order);
            }
            catch (System.Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}

using Microsoft.AspNetCore.Mvc;
using GarageRadiatorERP.Api.Services.Platforms;
using System.IO;
using System.Text;
using System.Threading.Tasks;

namespace GarageRadiatorERP.Api.Controllers.Platforms
{
    [ApiController]
    [Route("api/[controller]")]
    public class WebhooksController : ControllerBase
    {
        private readonly IPlatformService _platformService;

        public WebhooksController(IPlatformService platformService)
        {
            _platformService = platformService;
        }

        [HttpPost("shopee")]
        public async Task<IActionResult> ShopeeWebhook()
        {
            using var reader = new StreamReader(Request.Body, Encoding.UTF8);
            var payloadJson = await reader.ReadToEndAsync();
            
            await _platformService.ProcessShopeeWebhookAsync(payloadJson);
            
            return Ok();
        }

        [HttpPost("tiktok")]
        public async Task<IActionResult> TikTokWebhook()
        {
            using var reader = new StreamReader(Request.Body, Encoding.UTF8);
            var payloadJson = await reader.ReadToEndAsync();

            await _platformService.ProcessTikTokWebhookAsync(payloadJson);

            return Ok();
        }
    }
}

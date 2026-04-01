using Microsoft.AspNetCore.Mvc;
using GarageRadiatorERP.Api.Services.Platforms;
using System.IO;
using System.Text;
using System.Threading.Tasks;

namespace GarageRadiatorERP.Api.Controllers.Platforms
{
    [ApiController]
    [Route("api/v1/[controller]")]
    public class WebhooksController : ControllerBase
    {
        private readonly IWebhookQueueService _webhookQueueService;

        public WebhooksController(IWebhookQueueService webhookQueueService)
        {
            _webhookQueueService = webhookQueueService;
        }

        [HttpPost("shopee")]
        public async Task<IActionResult> ShopeeWebhook()
        {
            using var reader = new StreamReader(Request.Body, Encoding.UTF8);
            var payloadJson = await reader.ReadToEndAsync();

            // Đã fix lỗi 2 phần 5: Không gọi đồng bộ. Phải đẩy vào DB Queue
            await _webhookQueueService.QueueWebhookAsync("Shopee", payloadJson);

            return Ok(new { success = true });
        }

        [HttpPost("tiktok")]
        public async Task<IActionResult> TikTokWebhook()
        {
            using var reader = new StreamReader(Request.Body, Encoding.UTF8);
            var payloadJson = await reader.ReadToEndAsync();

            // Đã fix lỗi 2 phần 5
            await _webhookQueueService.QueueWebhookAsync("TikTok", payloadJson);

            return Ok(new { success = true });
        }
    }
}

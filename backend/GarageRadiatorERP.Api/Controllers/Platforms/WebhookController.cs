using Microsoft.AspNetCore.Mvc;
using System.Security.Cryptography;
using System.Text;
using GarageRadiatorERP.Api.Services.Platforms;

namespace GarageRadiatorERP.Api.Controllers.Platforms
{
    [ApiController]
    [Route("api/webhooks")]
    public class WebhookController : ControllerBase
    {
        private readonly IWebhookQueueService _queueService;
        private readonly IConfiguration _config;
        private readonly ILogger<WebhookController> _logger;

        public WebhookController(IWebhookQueueService queueService, IConfiguration config, ILogger<WebhookController> logger)
        {
            _queueService = queueService;
            _config = config;
            _logger = logger;
        }

        [HttpPost("shopee/orders")]
        public async Task<IActionResult> HandleShopeeWebhook()
        {
            using var reader = new StreamReader(Request.Body);
            var reqBody = await reader.ReadToEndAsync();
            var signature = Request.Headers["Authorization"].ToString();
            
            var secret = _config["Shopee:AppSecret"] ?? "test_secret";
            
            // Xây dựng HMAC SHA256 theo chuẩn Webhook Shopee: Url|Payload
            var url = $"{Request.Scheme}://{Request.Host}{Request.Path}";
            var baseString = $"{url}|{reqBody}";
            
            using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
            var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(baseString));
            var expectedSignature = BitConverter.ToString(hash).Replace("-", "").ToLower();

            if (signature != expectedSignature && secret != "test_secret")
            {
                _logger.LogWarning("❌ Lỗi xác thực Webhook Shopee: Chữ ký không hợp lệ!");
                return Unauthorized(new { error = "Invalid Signature" });
            }

            _logger.LogInformation("✅ Nhận Webhook Đơn hàng Shopee thành công! Payload: {reqBody}", reqBody);
            await _queueService.QueueWebhookAsync("Shopee", reqBody);

            return Ok(new { message = "success" });
        }

        [HttpPost("tiktok/orders")]
        public async Task<IActionResult> HandleTikTokWebhook()
        {
            using var reader = new StreamReader(Request.Body);
            var reqBody = await reader.ReadToEndAsync();
            var signature = Request.Headers["X-TTP-Signature"].ToString();
            
            var secret = _config["TikTok:AppSecret"] ?? "test_secret";
            
            // TikTok ký trực tiếp trên payload body
            using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
            var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(reqBody));
            var expectedSignature = BitConverter.ToString(hash).Replace("-", "").ToLower();

            if (signature != expectedSignature && secret != "test_secret")
            {
                _logger.LogWarning("❌ Lỗi xác thực Webhook TikTok: Chữ ký không hợp lệ!");
                return Unauthorized(new { error = "Invalid TikTok Signature" });
            }

            _logger.LogInformation("✅ Nhận Webhook Đơn hàng TikTok thành công! Payload: {reqBody}", reqBody);
            await _queueService.QueueWebhookAsync("TikTok", reqBody);

            return Ok(new { message = "success" });
        }
    }
}

using Microsoft.AspNetCore.Mvc;
using System.Security.Cryptography;
using System.Text;
using GarageRadiatorERP.Api.Services.Platforms;
using Microsoft.EntityFrameworkCore;

namespace GarageRadiatorERP.Api.Controllers.Platforms
{
    [ApiController]
    [Route("api/webhooks")]
    public class WebhookController : ControllerBase
    {
        private readonly GarageRadiatorERP.Api.Data.AppDbContext _context;
        private readonly IConfiguration _config;
        private readonly ILogger<WebhookController> _logger;

        public WebhookController(GarageRadiatorERP.Api.Data.AppDbContext context, IConfiguration config, ILogger<WebhookController> logger)
        {
            _context = context;
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

            // Trích xuất ShopId để gán đúng TenantId tránh mất đơn hàng
            string? shopId = ExtractShopId(reqBody, "Shopee");
            Guid tenantId = await GetTenantIdByShopIdAsync("Shopee", shopId);

            _context.PlatformPayloads.Add(new Models.Platforms.PlatformPayload
            {
                Platform = "Shopee",
                PayloadJson = reqBody,
                Status = "Pending",
                TenantId = tenantId
            });
            await _context.SaveChangesAsync();

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

            // Trích xuất ShopId để gán đúng TenantId tránh mất đơn hàng
            string? shopId = ExtractShopId(reqBody, "TikTok");
            Guid tenantId = await GetTenantIdByShopIdAsync("TikTok", shopId);

            _context.PlatformPayloads.Add(new Models.Platforms.PlatformPayload
            {
                Platform = "TikTok",
                PayloadJson = reqBody,
                Status = "Pending",
                TenantId = tenantId
            });
            await _context.SaveChangesAsync();

            return Ok(new { message = "success" });
        }

        private string? ExtractShopId(string payloadJson, string platform)
        {
            try
            {
                var doc = System.Text.Json.JsonDocument.Parse(payloadJson);
                if (platform == "Shopee" && doc.RootElement.TryGetProperty("shop_id", out var shopeeShopId))
                {
                    return shopeeShopId.ToString();
                }
                if (platform == "TikTok" && doc.RootElement.TryGetProperty("shop_id", out var tiktokShopId))
                {
                    return tiktokShopId.ToString();
                }
            }
            catch { }
            return null;
        }

        private async Task<Guid> GetTenantIdByShopIdAsync(string platform, string? shopId)
        {
            if (string.IsNullOrEmpty(shopId)) return Guid.Empty;

            var store = await _context.PlatformStores
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(s => s.PlatformName == platform && s.ShopId == shopId);

            return store?.TenantId ?? Guid.Empty;
        }
    }
}

using Microsoft.AspNetCore.Mvc;
using System.Security.Cryptography;
using global::System.Text;
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

            var secret = _config["Shopee:AppSecret"];
            if (string.IsNullOrEmpty(secret))
            {
                throw new InvalidOperationException("CRITICAL: Missing Shopee AppSecret configuration. Webhook halted to prevent security bypass.");
            }

            // Xây dựng HMAC SHA256 theo chuẩn Webhook Shopee: Url|Payload
            var url = $"{Request.Scheme}://{Request.Host}{Request.Path}";
            var baseString = $"{url}|{reqBody}";

            using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
            var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(baseString));
            var expectedSignature = BitConverter.ToString(hash).Replace("-", "").ToLower();

            if (signature != expectedSignature)
            {
                _logger.LogWarning("❌ Lỗi xác thực Webhook Shopee: Chữ ký không hợp lệ!");
                return Unauthorized(new { error = "Invalid Signature" });
            }

            _logger.LogInformation("✅ Nhận Webhook Đơn hàng Shopee thành công! Payload: {reqBody}", reqBody);

            // Trích xuất ShopId để gán đúng TenantId tránh mất đơn hàng
            string? shopId = ExtractShopId(reqBody, "Shopee");
            Guid tenantId = await GetTenantIdByShopIdAsync("Shopee", shopId);

            if (tenantId == Guid.Empty)
            {
                _logger.LogWarning("❌ Webhook rác: Không tìm thấy Tenant tương ứng với Shopee ShopId {shopId}. Bỏ qua lưu trữ.", shopId);
                return Ok(new { message = "Ignored (Orphan)" }); // Return OK to tell platform to stop retrying
            }

            // Chống Replay Attack
            string eventId = ExtractEventId(reqBody, "Shopee") ?? Guid.NewGuid().ToString();
            bool eventExists = await _context.PlatformPayloads.IgnoreQueryFilters().AnyAsync(p => p.PlatformEventId == eventId && p.Platform == "Shopee");
            if (eventExists)
            {
                _logger.LogWarning("⚠️ Webhook trùng lặp (Shopee EventId {eventId}) đã được xử lý. Bỏ qua.", eventId);
                return Ok(new { message = "Ignored (Duplicate)" });
            }

            _context.PlatformPayloads.Add(new Models.Platforms.PlatformPayload
            {
                Platform = "Shopee",
                PayloadJson = reqBody,
                PlatformEventId = eventId,
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

            var secret = _config["TikTok:AppSecret"];
            if (string.IsNullOrEmpty(secret))
            {
                throw new InvalidOperationException("CRITICAL: Missing TikTok AppSecret configuration. Webhook halted to prevent security bypass.");
            }

            // TikTok ký trực tiếp trên payload body
            using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
            var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(reqBody));
            var expectedSignature = BitConverter.ToString(hash).Replace("-", "").ToLower();

            if (signature != expectedSignature)
            {
                _logger.LogWarning("❌ Lỗi xác thực Webhook TikTok: Chữ ký không hợp lệ!");
                return Unauthorized(new { error = "Invalid TikTok Signature" });
            }

            _logger.LogInformation("✅ Nhận Webhook Đơn hàng TikTok thành công! Payload: {reqBody}", reqBody);

            // Trích xuất ShopId để gán đúng TenantId tránh mất đơn hàng
            string? shopId = ExtractShopId(reqBody, "TikTok");
            Guid tenantId = await GetTenantIdByShopIdAsync("TikTok", shopId);

            if (tenantId == Guid.Empty)
            {
                _logger.LogWarning("❌ Webhook rác: Không tìm thấy Tenant tương ứng với TikTok ShopId {shopId}. Bỏ qua lưu trữ.", shopId);
                return Ok(new { message = "Ignored (Orphan)" }); // Return OK to tell platform to stop retrying
            }

            // Chống Replay Attack
            string eventId = ExtractEventId(reqBody, "TikTok") ?? Guid.NewGuid().ToString();
            bool eventExists = await _context.PlatformPayloads.IgnoreQueryFilters().AnyAsync(p => p.PlatformEventId == eventId && p.Platform == "TikTok");
            if (eventExists)
            {
                _logger.LogWarning("⚠️ Webhook trùng lặp (TikTok EventId {eventId}) đã được xử lý. Bỏ qua.", eventId);
                return Ok(new { message = "Ignored (Duplicate)" });
            }

            _context.PlatformPayloads.Add(new Models.Platforms.PlatformPayload
            {
                Platform = "TikTok",
                PayloadJson = reqBody,
                PlatformEventId = eventId,
                Status = "Pending",
                TenantId = tenantId
            });
            await _context.SaveChangesAsync();

            return Ok(new { message = "success" });
        }

        private string? ExtractEventId(string payloadJson, string platform)
        {
            try
            {
                var doc = global::System.Text.Json.JsonDocument.Parse(payloadJson);
                if (platform == "Shopee" && doc.RootElement.TryGetProperty("message_id", out var eventId1))
                {
                    return eventId1.ToString();
                }
                if (platform == "TikTok" && doc.RootElement.TryGetProperty("event_id", out var eventId2))
                {
                    return eventId2.ToString();
                }
                // Fallback using hash if explicit ID doesn't exist
                using var sha256 = SHA256.Create();
                var hash = sha256.ComputeHash(Encoding.UTF8.GetBytes(payloadJson));
                return BitConverter.ToString(hash).Replace("-", "");
            }
            catch { return null; }
        }

        private string? ExtractShopId(string payloadJson, string platform)
        {
            try
            {
                var doc = global::System.Text.Json.JsonDocument.Parse(payloadJson);
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

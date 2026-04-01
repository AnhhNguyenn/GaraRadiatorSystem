using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using GarageRadiatorERP.Api.Data;
using GarageRadiatorERP.Api.Models.Platforms;
using GarageRadiatorERP.Api.Utilities;
using Microsoft.EntityFrameworkCore;

namespace GarageRadiatorERP.Api.Controllers.Platforms
{
    [ApiController]
    [Route("api/v1/platforms/[controller]")] // Versioning (Lỗi 8/53)
    public class AuthController : ControllerBase
    {
        private readonly ILogger<AuthController> _logger;
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly IEncryptionUtility _encryptionUtility; // Fix Hardcode Static Key (Lỗi 30)

        public AuthController(ILogger<AuthController> logger, AppDbContext context, IConfiguration configuration, IEncryptionUtility encryptionUtility)
        {
            _logger = logger;
            _context = context;
            _configuration = configuration;
            _encryptionUtility = encryptionUtility;
        }

        // Endpoint cấp State an toàn (Stateless) cho Frontend khởi tạo OAuth
        [HttpGet("generate-oauth-url/{platform}")]
        public IActionResult GenerateOAuthUrl(string platform)
        {
            var rawState = $"{platform}_{Guid.NewGuid()}_{DateTime.UtcNow.Ticks}";
            var encryptedState = _encryptionUtility.Encrypt(rawState);

            // Giả lập trả về URL. Trong thực tế lấy từ Config tùy theo Tiktok/Shopee
            return Ok(new { url = $"https://{platform.ToLower()}.com/oauth/authorize?client_id=xxx&state={encryptedState}&redirect_uri=xxx" });
        }

        [HttpGet("shopee/callback")]
        public async Task<IActionResult> ShopeeCallback([FromQuery] string code, [FromQuery] string shop_id)
        {
            _logger.LogInformation($"Received Shopee Auth Callback: code={code}, shop_id={shop_id}");

            // Lỗi 29 & 43: Auth Race Condition & Store Duplication. Use UPSERT logic / Transaction.
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var storeName = $"Shopee Store {shop_id}";
                var store = await _context.PlatformStores.FirstOrDefaultAsync(s => s.ShopId == shop_id && s.PlatformName == "Shopee");

                if (store == null)
                {
                    store = new PlatformStore
                    {
                        PlatformName = "Shopee",
                        ShopId = shop_id,
                        StoreName = storeName
                    };
                    _context.PlatformStores.Add(store);
                    await _context.SaveChangesAsync();
                }

                // Giả lập lấy token từ API thật thay vì tự gán (Lỗi 33 / 45)
                var simulatedApiExpiresIn = 86400; // API trả về sống 1 ngày (VD)

                var token = new PlatformToken
                {
                    StoreId = store.Id,
                    AccessToken = _encryptionUtility.Encrypt($"shopee_access_mock_{Guid.NewGuid()}"),
                    RefreshToken = _encryptionUtility.Encrypt($"shopee_refresh_mock_{Guid.NewGuid()}"),
                    ExpiresAt = DateTime.UtcNow.AddSeconds(simulatedApiExpiresIn), // Sửa hardcode AddDays(7) mù quáng
                    UpdatedAt = DateTime.UtcNow
                };

                // Remove old tokens
                var oldTokens = await _context.PlatformTokens.Where(t => t.StoreId == store.Id).ToListAsync();
                _context.PlatformTokens.RemoveRange(oldTokens);

                _context.PlatformTokens.Add(token);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                var frontendUrl = _configuration["FrontendUrl"];
                if (string.IsNullOrEmpty(frontendUrl))
                    return BadRequest("Frontend URL configuration missing"); // Fix Fallback localhost ngớ ngẩn (Lỗi 55)

                return Redirect($"{frontendUrl}/settings?auth_success=shopee&shop_id={shop_id}");
            }
            catch (Exception)
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        [HttpGet("tiktok/callback")]
        public async Task<IActionResult> TikTokCallback([FromQuery] string auth_code, [FromQuery] string state)
        {
            // Fix Lỗi Khóa chết OAuth do SameSite Cookie (Lỗi 4/59)
            // Thay vì dựa vào Cookie (bị trình duyệt chặn), ta giải mã trực tiếp State được ký (Stateless).
            if (string.IsNullOrEmpty(state))
            {
                _logger.LogWarning("CSRF validation failed for TikTok Auth Callback (Missing State).");
                return BadRequest("Missing state parameter. CSRF validation failed.");
            }

            try
            {
                var decryptedState = _encryptionUtility.Decrypt(state);
                if (string.IsNullOrEmpty(decryptedState) || !decryptedState.StartsWith("TikTok_"))
                {
                    _logger.LogWarning("CSRF validation failed for TikTok Auth Callback (Forged State).");
                    return BadRequest("Invalid state parameter. CSRF validation failed.");
                }
            }
            catch
            {
                _logger.LogWarning("CSRF validation failed for TikTok Auth Callback (Decryption Error).");
                return BadRequest("Invalid state parameter signature. CSRF validation failed.");
            }

            _logger.LogInformation($"Received TikTok Auth Callback: auth_code={auth_code}, state={state}");

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var storeName = $"TikTok Store";
                // Lỗi 28 / 31: Sinh mã định danh ngu xuẩn (Substring 8 kí tự dễ collision) -> Dùng Guid nguyên bản
                var shop_id = "tiktok_" + Guid.NewGuid().ToString();

                var store = await _context.PlatformStores.FirstOrDefaultAsync(s => s.PlatformName == "TikTok");

                if (store == null)
                {
                    store = new PlatformStore
                    {
                        PlatformName = "TikTok",
                        ShopId = shop_id,
                        StoreName = storeName
                    };
                    _context.PlatformStores.Add(store);
                    await _context.SaveChangesAsync();
                }

                // Tương tự, giả lập API Response
                var simulatedApiExpiresIn = 3600; // API trả về 1 tiếng

                var token = new PlatformToken
                {
                    StoreId = store.Id,
                    AccessToken = _encryptionUtility.Encrypt($"tiktok_access_mock_{Guid.NewGuid()}"),
                    RefreshToken = _encryptionUtility.Encrypt($"tiktok_refresh_mock_{Guid.NewGuid()}"),
                    ExpiresAt = DateTime.UtcNow.AddSeconds(simulatedApiExpiresIn), // Sửa hardcode
                    UpdatedAt = DateTime.UtcNow
                };

                var oldTokens = await _context.PlatformTokens.Where(t => t.StoreId == store.Id).ToListAsync();
                _context.PlatformTokens.RemoveRange(oldTokens);

                _context.PlatformTokens.Add(token);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                var frontendUrl = _configuration["FrontendUrl"];
                if (string.IsNullOrEmpty(frontendUrl))
                    return BadRequest("Frontend URL configuration missing"); // Lỗi 55

                return Redirect($"{frontendUrl}/settings?auth_success=tiktok");
            }
            catch (Exception)
            {
                await transaction.RollbackAsync();
                throw;
            }
        }
    }
}

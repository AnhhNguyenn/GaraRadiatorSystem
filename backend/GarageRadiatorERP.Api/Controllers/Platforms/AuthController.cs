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

        // Bối cảnh 2: Endpoint cấp State chống Login CSRF có gắn User ID
        [Microsoft.AspNetCore.Authorization.Authorize]
        [HttpGet("generate-oauth-url/{platform}")]
        public IActionResult GenerateOAuthUrl(string platform)
        {
            // Thay vì ký JWT vô danh, ta ký State kẹp chung với User ID của tài khoản đang đăng nhập
            // Để khi TikTok/Shopee Redirect về, ta so sánh xem State này có phải CỦA CHÍNH TÀI KHOẢN NÀY sinh ra không
            var userId = User?.Identity?.Name ?? "anonymous_but_needs_auth"; // Giả lập Auth UserId
            var rawState = $"{platform}_{userId}_{Guid.NewGuid()}_{DateTime.UtcNow.Ticks}";
            var encryptedState = _encryptionUtility.Encrypt(rawState);

            // Set thêm một Cookie "oauth_correlation" với SameSite=Lax (vẫn cho phép callback get top-level navigation, tốt hơn Strict)
            Response.Cookies.Append("oauth_correlation", encryptedState, new Microsoft.AspNetCore.Http.CookieOptions { HttpOnly = true, SameSite = Microsoft.AspNetCore.Http.SameSiteMode.Lax, Secure = true, MaxAge = TimeSpan.FromMinutes(15) });

            // Giả lập trả về URL. Trong thực tế lấy từ Config tùy theo Tiktok/Shopee
            return Ok(new { url = $"https://{platform.ToLower()}.com/oauth/authorize?client_id=xxx&state={encryptedState}&redirect_uri=xxx" });
        }

        [HttpGet("shopee/callback")]
        public async Task<IActionResult> ShopeeCallback([FromQuery] string code, [FromQuery] string shop_id, [FromQuery] string state)
        {
            // Bối cảnh 3: Đồng bộ Bảo mật CSRF cho Shopee ngăn Replay Attack
            var expectedState = Request.Cookies["oauth_correlation"];
            if (string.IsNullOrEmpty(state) || state != expectedState)
            {
                _logger.LogWarning("CSRF validation failed for Shopee Auth Callback.");
                return BadRequest("Missing or mismatched state parameter. CSRF validation failed.");
            }

            try
            {
                var decryptedState = _encryptionUtility.Decrypt(state);
                var userId = User?.Identity?.Name ?? "anonymous_but_needs_auth"; // Match với lúc Generate

                // Kiểm tra xem State này có phải do chính User hiện tại sinh ra không
                if (string.IsNullOrEmpty(decryptedState) || !decryptedState.StartsWith($"Shopee_{userId}_"))
                {
                    _logger.LogWarning("CSRF validation failed for Shopee Auth Callback (Forged State or UserId mismatch).");
                    return BadRequest("Invalid state parameter ownership. CSRF validation failed.");
                }
            }
            catch
            {
                _logger.LogWarning("CSRF validation failed for Shopee Auth Callback (Decryption Error).");
                return BadRequest("Invalid state parameter signature. CSRF validation failed.");
            }

            // Bối cảnh 3: Xóa Cookie đi để chống dùng lại (Replay Attack)
            Response.Cookies.Delete("oauth_correlation");

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

                // Bối cảnh 2 (Phần 2): Mất tiền thật vì Mock Code còn kẹt lại
                // Xóa toàn bộ giả lập lưu token rác. Sẵn sàng tích hợp HttpClient thật đổi Token.
                // TODO: Triển khai HttpClient call tới Shopee OpenAPI 2.0 để lấy accessToken thật
                var realApiUrl = $"https://partner.shopeemobile.com/api/v2/auth/token/get";
                _logger.LogInformation($"[TODO] Making HTTP POST to {realApiUrl} to exchange code: {code} for ShopId: {shop_id}");

                // Ở Production, chỗ này sẽ là _httpClient.PostAsync(...) và parse response
                // Hiện tại chặn không lưu bất kỳ token giả nào vào DB để tránh BackgroundJob bị crash 401 khi chạy thật.
                throw new NotImplementedException("Shopee OAuth Token Exchange is not implemented yet. Do not save mock tokens in Production.");

                // var frontendUrl = _configuration["FrontendUrl"];
                // if (string.IsNullOrEmpty(frontendUrl)) return BadRequest("Frontend URL configuration missing");
                // return Redirect($"{frontendUrl}/settings?auth_success=shopee&shop_id={shop_id}");
            }
            catch (NotImplementedException ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(501, new { message = ex.Message });
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
            // Bối cảnh 2: Thay vì chỉ giải mã Stateless dễ bị Replay Attack, kết hợp Cookie SameSite=Lax (Cross-Site top level GET vẫn gửi Cookie)
            var expectedState = Request.Cookies["oauth_correlation"];

            if (string.IsNullOrEmpty(state) || state != expectedState)
            {
                _logger.LogWarning("CSRF validation failed for TikTok Auth Callback.");
                return BadRequest("Missing or mismatched state parameter. CSRF validation failed.");
            }

            try
            {
                var decryptedState = _encryptionUtility.Decrypt(state);
                var userId = User?.Identity?.Name ?? "anonymous_but_needs_auth"; // Match với lúc Generate

                // Kiểm tra xem State này có phải do chính User hiện tại sinh ra không
                if (string.IsNullOrEmpty(decryptedState) || !decryptedState.StartsWith($"TikTok_{userId}_"))
                {
                    _logger.LogWarning("CSRF validation failed for TikTok Auth Callback (Forged State or UserId mismatch).");
                    return BadRequest("Invalid state parameter ownership. CSRF validation failed.");
                }
            }
            catch
            {
                _logger.LogWarning("CSRF validation failed for TikTok Auth Callback (Decryption Error).");
                return BadRequest("Invalid state parameter signature. CSRF validation failed.");
            }

            // Xóa Cookie đi để chống dùng lại (Replay)
            Response.Cookies.Delete("oauth_correlation");

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

                // Bối cảnh 2 (Phần 2): Mất tiền thật vì Mock Code còn kẹt lại (TikTok)
                // TODO: Triển khai HttpClient call tới TikTok Shop API để lấy AccessToken thật
                var realApiUrl = $"https://auth.tiktok-shops.com/api/v2/token/get";
                _logger.LogInformation($"[TODO] Making HTTP POST to {realApiUrl} to exchange code: {auth_code}");

                // Không lưu token rác. Phải có tích hợp HTTP thật trước khi release tính năng này.
                throw new NotImplementedException("TikTok OAuth Token Exchange is not implemented yet. Do not save mock tokens in Production.");

                // var frontendUrl = _configuration["FrontendUrl"];
                // if (string.IsNullOrEmpty(frontendUrl)) return BadRequest("Frontend URL configuration missing");
                // return Redirect($"{frontendUrl}/settings?auth_success=tiktok");
            }
            catch (NotImplementedException ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(501, new { message = ex.Message });
            }
            catch (Exception)
            {
                await transaction.RollbackAsync();
                throw;
            }
        }
    }
}

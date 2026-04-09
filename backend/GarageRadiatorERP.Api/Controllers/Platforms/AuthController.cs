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
        private readonly global::System.Net.Http.IHttpClientFactory _httpClientFactory;

        public AuthController(ILogger<AuthController> logger, AppDbContext context, IConfiguration configuration, IEncryptionUtility encryptionUtility, global::System.Net.Http.IHttpClientFactory httpClientFactory)
        {
            _logger = logger;
            _context = context;
            _configuration = configuration;
            _encryptionUtility = encryptionUtility;
            _httpClientFactory = httpClientFactory;
        }

        // Bối cảnh 2: Endpoint cấp State chống Login CSRF có gắn User ID

        // (Trong môi trường thật, Endpoint này cần [Authorize])

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
            var tenantClaim = User?.FindFirst("TenantId")?.Value;
            if (string.IsNullOrEmpty(tenantClaim) || !Guid.TryParse(tenantClaim, out var currentTenantId))
            {
                return Unauthorized("Missing TenantId in current session.");
            }

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
                        TenantId = currentTenantId,
                        PlatformName = "Shopee",
                        ShopId = shop_id,
                        StoreName = storeName
                    };
                    _context.PlatformStores.Add(store);
                    await _context.SaveChangesAsync();
                }
                else if (store.TenantId != currentTenantId)
                {
                    await transaction.RollbackAsync();
                    return StatusCode(403, "Store is already connected to another Garage.");
                }

                // Bối cảnh 2 (Phần 2): Triển khai HttpClient call tới Shopee OpenAPI 2.0 để lấy accessToken thật
                var realApiUrl = $"https://partner.shopeemobile.com/api/v2/auth/token/get";
                _logger.LogInformation($"Making HTTP POST to {realApiUrl} to exchange code: {code} for ShopId: {shop_id}");

                var client = _httpClientFactory.CreateClient();

                var requestBody = new
                {
                    code = code,
                    shop_id = int.Parse(shop_id),
                    partner_id = int.Parse(_configuration["Shopee:PartnerId"] ?? "0")
                };

                var response = await client.PostAsJsonAsync(realApiUrl, requestBody);

                if (response.IsSuccessStatusCode)
                {
                    var jsonResponse = await response.Content.ReadAsStringAsync();
                    using var doc = global::System.Text.Json.JsonDocument.Parse(jsonResponse);
                    var root = doc.RootElement;

                    if (root.TryGetProperty("access_token", out var accessTokenProp) && root.TryGetProperty("refresh_token", out var refreshTokenProp))
                    {
                        var accessToken = accessTokenProp.GetString() ?? "";
                        var refreshToken = refreshTokenProp.GetString() ?? "";
                        var expireIn = root.TryGetProperty("expire_in", out var expireProp) ? expireProp.GetInt32() : 14400; // Mặc định 4 tiếng nếu không có

                        var existingToken = await _context.PlatformTokens.FirstOrDefaultAsync(t => t.StoreId == store.Id);
                        if (existingToken == null)
                        {
                            var token = new PlatformToken
                            {
                                Store = store,
                                AccessToken = _encryptionUtility.Encrypt(accessToken), // Mã hóa Token trước khi lưu DB
                                RefreshToken = _encryptionUtility.Encrypt(refreshToken),
                                ExpiresAt = DateTime.UtcNow.AddSeconds((double)expireIn),
                                UpdatedAt = DateTime.UtcNow
                            };
                            _context.PlatformTokens.Add(token);
                        }
                        else
                        {
                            existingToken.AccessToken = _encryptionUtility.Encrypt(accessToken);
                            existingToken.RefreshToken = _encryptionUtility.Encrypt(refreshToken);
                            existingToken.ExpiresAt = DateTime.UtcNow.AddSeconds((double)expireIn);
                            existingToken.UpdatedAt = DateTime.UtcNow;
                        }

                        await _context.SaveChangesAsync();
                        await transaction.CommitAsync();

                        var frontendUrl = _configuration["FrontendUrl"];
                        if (string.IsNullOrEmpty(frontendUrl)) return Ok(new { message = "Shopee Auth Success" });
                        return Redirect($"{frontendUrl}/settings?auth_success=shopee&shop_id={shop_id}");
                    }
                    else
                    {
                        _logger.LogError($"Shopee Auth failed parsing response: {jsonResponse}");
                        await transaction.RollbackAsync();
                        return BadRequest("Shopee Auth failed. Invalid response structure.");
                    }
                }
                else
                {
                    var errorResponse = await response.Content.ReadAsStringAsync();
                    _logger.LogError($"Shopee Auth failed API call: {errorResponse}");
                    await transaction.RollbackAsync();
                    return BadRequest("Shopee Auth API error.");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Shopee Auth Callback Exception");
                await transaction.RollbackAsync();
                throw;
            }
        }

        [HttpGet("tiktok/callback")]
        public async Task<IActionResult> TikTokCallback([FromQuery] string auth_code, [FromQuery] string state)
        {
            var tenantClaim = User?.FindFirst("TenantId")?.Value;
            if (string.IsNullOrEmpty(tenantClaim) || !Guid.TryParse(tenantClaim, out var currentTenantId))
            {
                return Unauthorized("Missing TenantId in current session.");
            }

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

            var client = _httpClientFactory.CreateClient();

            // 1. Lấy Access Token từ code
            var tokenApiUrl = $"https://auth.tiktok-shops.com/api/v2/token/get";
            var tokenRequestBody = new
            {
                app_key = _configuration["TikTok:AppKey"],
                app_secret = _configuration["TikTok:AppSecret"],
                auth_code = auth_code,
                grant_type = "authorized_code"
            };

            var tokenResponse = await client.PostAsJsonAsync(tokenApiUrl, tokenRequestBody);
            if (!tokenResponse.IsSuccessStatusCode)
            {
                var errorResponse = await tokenResponse.Content.ReadAsStringAsync();
                _logger.LogError($"TikTok Auth failed Token Exchange API call: {errorResponse}");
                return BadRequest("TikTok Auth API error during token exchange.");
            }

            var tokenJsonResponse = await tokenResponse.Content.ReadAsStringAsync();
            using var tokenDoc = global::System.Text.Json.JsonDocument.Parse(tokenJsonResponse);
            var tokenRoot = tokenDoc.RootElement;
            var tokenDataNode = tokenRoot.TryGetProperty("data", out var d) ? d : tokenRoot;

            if (!tokenDataNode.TryGetProperty("access_token", out var accessTokenProp) || !tokenDataNode.TryGetProperty("refresh_token", out var refreshTokenProp))
            {
                _logger.LogError($"TikTok Auth failed parsing token response: {tokenJsonResponse}");
                return BadRequest("TikTok Auth failed. Invalid token response structure.");
            }

            var accessToken = accessTokenProp.GetString() ?? "";
            var refreshToken = refreshTokenProp.GetString() ?? "";
            var expireIn = tokenDataNode.TryGetProperty("access_token_expire_in", out var expireProp) ? expireProp.GetInt32() : 2592000;

            // 2. Gọi API lấy danh sách các Authorized Shops
            var getShopsUrl = $"https://open-api.tiktokglobalshop.com/api/v2/shop/get_authorized_shop?app_key={_configuration["TikTok:AppKey"]}";

            var requestMessage = new global::System.Net.Http.HttpRequestMessage(global::System.Net.Http.HttpMethod.Get, getShopsUrl);
            requestMessage.Headers.Add("x-tts-access-token", accessToken);

            var shopsResponse = await client.SendAsync(requestMessage);
            if (!shopsResponse.IsSuccessStatusCode)
            {
                var errorResponse = await shopsResponse.Content.ReadAsStringAsync();
                _logger.LogError($"TikTok Auth failed Get Shops API call: {errorResponse}");
                return BadRequest("TikTok Auth API error during get shops.");
            }

            var shopsJsonResponse = await shopsResponse.Content.ReadAsStringAsync();
            using var shopsDoc = global::System.Text.Json.JsonDocument.Parse(shopsJsonResponse);
            var shopsRoot = shopsDoc.RootElement;
            var shopsDataNode = shopsRoot.TryGetProperty("data", out var sd) ? sd : shopsRoot;

            if (!shopsDataNode.TryGetProperty("shop_list", out var shopListElement) || shopListElement.ValueKind != global::System.Text.Json.JsonValueKind.Array)
            {
                _logger.LogError($"TikTok Auth failed parsing shops response: {shopsJsonResponse}");
                return BadRequest("TikTok Auth failed. Invalid shops response structure.");
            }

            // 3. Upsert cho TẤT CẢ các shop lấy được bằng Transaction chung
            var frontendUrl = _configuration["FrontendUrl"];
            string firstShopId = "";

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                foreach (var shopElement in shopListElement.EnumerateArray())
                {
                    if (!shopElement.TryGetProperty("shop_id", out var shopIdProp)) continue;
                    var shop_id = shopIdProp.GetString();
                    if (string.IsNullOrEmpty(shop_id)) continue;

                    if (string.IsNullOrEmpty(firstShopId)) firstShopId = shop_id;

                    var storeName = shopElement.TryGetProperty("shop_name", out var shopNameProp) ? shopNameProp.GetString() : $"TikTok Store {shop_id}";

                    var store = await _context.PlatformStores.FirstOrDefaultAsync(s => s.ShopId == shop_id && s.PlatformName == "TikTok");
                    if (store == null)
                    {
                        store = new PlatformStore
                        {
                            TenantId = currentTenantId,
                            PlatformName = "TikTok",
                            ShopId = shop_id,
                            StoreName = storeName
                        };
                        _context.PlatformStores.Add(store);
                    }
                    else if (store.TenantId != currentTenantId)
                    {
                        // Nếu shop đã thuộc về Gara khác thì không add token vào, bỏ qua luôn
                        _logger.LogWarning($"TikTok Auth: Shop {shop_id} already belongs to another Tenant. Skipping.");
                        continue;
                    }
                    else
                    {
                        store.StoreName = storeName;
                    }
                    await _context.SaveChangesAsync(); // Cần save để lấy Id gắn cho Token

                    var existingToken = await _context.PlatformTokens.FirstOrDefaultAsync(t => t.StoreId == store.Id);
                    if (existingToken == null)
                    {
                        var token = new PlatformToken
                        {
                            Store = store,
                            AccessToken = _encryptionUtility.Encrypt(accessToken),
                            RefreshToken = _encryptionUtility.Encrypt(refreshToken),
                            ExpiresAt = DateTime.UtcNow.AddSeconds((double)expireIn),
                            UpdatedAt = DateTime.UtcNow
                        };
                        _context.PlatformTokens.Add(token);
                    }
                    else
                    {
                        existingToken.AccessToken = _encryptionUtility.Encrypt(accessToken);
                        existingToken.RefreshToken = _encryptionUtility.Encrypt(refreshToken);
                        existingToken.ExpiresAt = DateTime.UtcNow.AddSeconds((double)expireIn);
                        existingToken.UpdatedAt = DateTime.UtcNow;
                    }
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                if (string.IsNullOrEmpty(frontendUrl)) return Ok(new { message = "TikTok Auth Success", shopsSynced = shopListElement.GetArrayLength() });
                return Redirect($"{frontendUrl}/settings?auth_success=tiktok&shop_id={firstShopId}");
            }
            catch (DbUpdateException ex)
            {
                // Bắt Race Condition ở mức Database (Do cấu hình UniqueIndex s => new { s.PlatformName, s.ShopId })
                _logger.LogWarning(ex, "TikTok Auth concurrent insert detected. Returning success safely.");
                await transaction.RollbackAsync();

                if (string.IsNullOrEmpty(frontendUrl)) return Ok(new { message = "TikTok Auth Success (Concurrent)" });
                return Redirect($"{frontendUrl}/settings?auth_success=tiktok_concurrent");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "TikTok Auth Callback Exception");
                await transaction.RollbackAsync();
                throw;
            }
        }
    }
}

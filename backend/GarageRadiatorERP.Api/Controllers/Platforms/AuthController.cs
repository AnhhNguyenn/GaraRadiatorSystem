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
    [Route("api/platforms/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly ILogger<AuthController> _logger;
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;

        public AuthController(ILogger<AuthController> logger, AppDbContext context, IConfiguration configuration)
        {
            _logger = logger;
            _context = context;
            _configuration = configuration;
        }

        [HttpGet("shopee/callback")]
        public async Task<IActionResult> ShopeeCallback([FromQuery] string code, [FromQuery] string shop_id)
        {
            _logger.LogInformation($"Received Shopee Auth Callback: code={code}, shop_id={shop_id}");

            // TODO: In a real app, you would make an HTTP POST to Shopee API to exchange the 'code' for an 'access_token'
            // For now, we simulate this exchange and save the token directly.
            
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

            var token = new PlatformToken
            {
                StoreId = store.Id,
                AccessToken = EncryptionUtility.Encrypt($"shopee_access_mock_{Guid.NewGuid()}"),
                RefreshToken = EncryptionUtility.Encrypt($"shopee_refresh_mock_{Guid.NewGuid()}"),
                ExpiresAt = DateTime.UtcNow.AddDays(7), // Shopee token validity
                UpdatedAt = DateTime.UtcNow
            };

            // Remove old tokens
            var oldTokens = await _context.PlatformTokens.Where(t => t.StoreId == store.Id).ToListAsync();
            _context.PlatformTokens.RemoveRange(oldTokens);

            _context.PlatformTokens.Add(token);
            await _context.SaveChangesAsync();

            // Redirect back to frontend
            var frontendUrl = _configuration["FrontendUrl"] ?? "http://localhost:3000";
            return Redirect($"{frontendUrl}/settings?auth_success=shopee&shop_id={shop_id}");
        }

        [HttpGet("tiktok/callback")]
        public async Task<IActionResult> TikTokCallback([FromQuery] string auth_code, [FromQuery] string state)
        {
            _logger.LogInformation($"Received TikTok Auth Callback: auth_code={auth_code}, state={state}");

            // TODO: Exchange auth_code for access_token with TikTok API.
            
            var storeName = $"TikTok Store";
            var store = await _context.PlatformStores.FirstOrDefaultAsync(s => s.PlatformName == "TikTok");

            if (store == null)
            {
                store = new PlatformStore
                {
                    PlatformName = "TikTok",
                    ShopId = "tiktok_" + Guid.NewGuid().ToString().Substring(0, 8),
                    StoreName = storeName
                };
                _context.PlatformStores.Add(store);
                await _context.SaveChangesAsync();
            }

            var token = new PlatformToken
            {
                StoreId = store.Id,
                AccessToken = EncryptionUtility.Encrypt($"tiktok_access_mock_{Guid.NewGuid()}"),
                RefreshToken = EncryptionUtility.Encrypt($"tiktok_refresh_mock_{Guid.NewGuid()}"),
                ExpiresAt = DateTime.UtcNow.AddDays(7), // TikTok token validity
                UpdatedAt = DateTime.UtcNow
            };

            var oldTokens = await _context.PlatformTokens.Where(t => t.StoreId == store.Id).ToListAsync();
            _context.PlatformTokens.RemoveRange(oldTokens);

            _context.PlatformTokens.Add(token);
            await _context.SaveChangesAsync();

            var frontendUrl = _configuration["FrontendUrl"] ?? "http://localhost:3000";
            return Redirect($"{frontendUrl}/settings?auth_success=tiktok");
        }
    }
}

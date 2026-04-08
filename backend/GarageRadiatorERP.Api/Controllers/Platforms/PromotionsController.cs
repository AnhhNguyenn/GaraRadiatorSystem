using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using System.Net.Http;

namespace GarageRadiatorERP.Api.Controllers.Platforms
{
    [ApiController]
    [Route("api/v1/[controller]")]
    public class PromotionsController : ControllerBase
    {
        private readonly ILogger<PromotionsController> _logger;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly Data.AppDbContext _context;

        public PromotionsController(ILogger<PromotionsController> logger, IHttpClientFactory httpClientFactory, Data.AppDbContext context)
        {
            _logger = logger;
            _httpClientFactory = httpClientFactory;
            _context = context;
        }

        public class CreateVoucherRequest
        {
            public string Code { get; set; } = string.Empty;
            public decimal DiscountAmount { get; set; }
            public DateTime StartDate { get; set; }
            public DateTime EndDate { get; set; }
            public string Platform { get; set; } = string.Empty; // Shopee or TikTok
            public string ShopId { get; set; } = string.Empty;
        }

        [HttpPost("voucher")]
        public async Task<IActionResult> CreateVoucher([FromBody] CreateVoucherRequest request)
        {
            var client = _httpClientFactory.CreateClient();
            _logger.LogInformation($"Tạo Voucher {request.Code} (Giảm {request.DiscountAmount}) trên nền tảng {request.Platform}");

            if (request.Platform == "Shopee")
            {
                var apiUrl = "https://partner.shopeemobile.com/api/v2/voucher/add_voucher";
                try
                {
                    var token = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.FirstOrDefaultAsync(_context.PlatformTokens, t => t.Store.ShopId == request.ShopId);
                    if (token != null) client.DefaultRequestHeaders.Add("Authorization", $"Bearer {token.AccessToken}");

                    var response = await client.PostAsJsonAsync(apiUrl, new { voucher_name = request.Code, discount_amount = request.DiscountAmount });
                    response.EnsureSuccessStatusCode();
                    _logger.LogInformation($"Đã gọi API Shopee {apiUrl} thành công.");
                }
                catch (Exception ex) { _logger.LogError(ex.Message); throw; }
            }
            else if (request.Platform == "TikTok")
            {
                var apiUrl = "https://open-api.tiktokglobalshop.com/api/promotion/activity/create";
                try
                {
                    var token = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.FirstOrDefaultAsync(_context.PlatformTokens, t => t.Store.PlatformName == "TikTok");
                    if (token != null) client.DefaultRequestHeaders.Add("Authorization", $"Bearer {token.AccessToken}");

                    var response = await client.PostAsJsonAsync(apiUrl, new { activity_type = 1, title = request.Code });
                    response.EnsureSuccessStatusCode();
                    _logger.LogInformation($"Đã gọi API TikTok {apiUrl} thành công.");
                }
                catch (Exception ex) { _logger.LogError(ex.Message); throw; }
            }

            return Ok(new { message = $"Tạo mã giảm giá {request.Code} thành công trên {request.Platform}" });
        }

        public class CreateFlashSaleRequest
        {
            public string Title { get; set; } = string.Empty;
            public DateTime StartDate { get; set; }
            public DateTime EndDate { get; set; }
            public string Platform { get; set; } = string.Empty;
        }

        [HttpPost("flash-sale")]
        public async Task<IActionResult> CreateFlashSale([FromBody] CreateFlashSaleRequest request)
        {
            var client = _httpClientFactory.CreateClient();
            _logger.LogInformation($"Tạo Flash Sale {request.Title} trên {request.Platform}");

            if (request.Platform == "Shopee")
            {
                var apiUrl = "https://partner.shopeemobile.com/api/v2/flash_sale/add_item";
                try
                {
                    var response = await client.PostAsJsonAsync(apiUrl, new { title = request.Title, start_time = request.StartDate, end_time = request.EndDate });
                    response.EnsureSuccessStatusCode();
                }
                catch (Exception ex) { _logger.LogError(ex.Message); }
            }
            else if (request.Platform == "TikTok")
            {
                var apiUrl = "https://open-api.tiktokglobalshop.com/api/promotion/flash_sale/create";
                try
                {
                    var response = await client.PostAsJsonAsync(apiUrl, new { title = request.Title });
                    response.EnsureSuccessStatusCode();
                }
                catch (Exception ex) { _logger.LogError(ex.Message); }
            }

            return Ok(new { message = "Đã lên lịch Flash Sale thành công" });
        }
    }
}

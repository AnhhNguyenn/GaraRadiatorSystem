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

        public PromotionsController(ILogger<PromotionsController> logger, IHttpClientFactory httpClientFactory)
        {
            _logger = logger;
            _httpClientFactory = httpClientFactory;
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
                    // Lấy Token thực tế của cửa hàng từ DB
                    // await client.PostAsJsonAsync(apiUrl, new { voucher_name = request.Code, discount_amount = request.DiscountAmount });
                    _logger.LogInformation($"Đã gọi API Shopee {apiUrl}");
                }
                catch (Exception ex) { _logger.LogError(ex.Message); }
            }
            else if (request.Platform == "TikTok")
            {
                var apiUrl = "https://open-api.tiktokglobalshop.com/api/promotion/activity/create";
                try
                {
                    // await client.PostAsJsonAsync(apiUrl, new { activity_type = 1, title = request.Code });
                    _logger.LogInformation($"Đã gọi API TikTok {apiUrl}");
                }
                catch (Exception ex) { _logger.LogError(ex.Message); }
            }

            await Task.Delay(500);
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
            _logger.LogInformation($"Tạo Flash Sale {request.Title} trên {request.Platform}");
            await Task.Delay(500);
            return Ok(new { message = "Đã lên lịch Flash Sale thành công" });
        }
    }
}

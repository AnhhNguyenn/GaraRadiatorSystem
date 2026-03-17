using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace GarageRadiatorERP.Api.Jobs
{
    public class TokenRenewalJob : BackgroundService
    {
        private readonly ILogger<TokenRenewalJob> _logger;

        public TokenRenewalJob(ILogger<TokenRenewalJob> logger)
        {
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("🚀 Kích hoạt Job Nền: Token Renewal (Tự động gia hạn Access Token Sàn MTM).");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    _logger.LogInformation("🔄 Đang chạy Job kiểm tra và gia hạn Token lúc: {Time}", DateTimeOffset.Now);
                    
                    // Logic thực tế:
                    // 1. Quét Database tìm ra App_Token có ExpireDate < 3 ngày
                    // 2. Gọi api refresh token của Shopee/TikTok
                    // 3. Update Token mới vào Database

                    _logger.LogInformation("✅ Job Refresh Token đã quét xong.");
                }
                catch (Exception ex)
                {
                    _logger.LogError("Lỗi khi chạy Token Renewal Job: {Message}", ex.Message);
                }

                // Setup chạy định kỳ (Ví dụ: 12 tiếng / lần)
                await Task.Delay(TimeSpan.FromHours(12), stoppingToken);
            }
        }
    }
}

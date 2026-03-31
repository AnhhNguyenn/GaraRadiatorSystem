using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;
using GarageRadiatorERP.Api.Data;
using GarageRadiatorERP.Api.Utilities;

namespace GarageRadiatorERP.Api.Jobs
{
    public class TokenRenewalJob : BackgroundService
    {
        private readonly ILogger<TokenRenewalJob> _logger;
        private readonly IServiceScopeFactory _scopeFactory;

        public TokenRenewalJob(ILogger<TokenRenewalJob> logger, IServiceScopeFactory scopeFactory)
        {
            _logger = logger;
            _scopeFactory = scopeFactory;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("🚀 Kích hoạt Job Nền: Token Renewal (Tự động gia hạn Access Token).");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    _logger.LogInformation("🔄 Đang chạy Job kiểm tra và gia hạn Token lúc: {Time}", DateTimeOffset.Now);
                    
                    using (var scope = _scopeFactory.CreateScope())
                    {
                        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                        var encryptionUtility = scope.ServiceProvider.GetRequiredService<IEncryptionUtility>();

                        // Find tokens expiring within 3 days
                        var threshold = DateTime.UtcNow.AddDays(3);
                        var expTokens = await context.PlatformTokens
                            .Where(t => t.ExpiresAt <= threshold)
                            .Include(t => t.Store)
                            .ToListAsync(stoppingToken);

                        foreach (var token in expTokens)
                        {
                            _logger.LogInformation($"Renewing token for store {token.Store.StoreName} ({token.Store.PlatformName})");
                            
                            // Mocking API call to Shopee/TikTok to get new token
                            // In a real scenario, you decrypt the old token first, make the request, and encrypt the new one.
                            token.AccessToken = encryptionUtility.Encrypt($"{token.Store.PlatformName.ToLower()}_access_renew_{Guid.NewGuid()}");
                            token.RefreshToken = encryptionUtility.Encrypt($"{token.Store.PlatformName.ToLower()}_refresh_renew_{Guid.NewGuid()}");
                            token.ExpiresAt = DateTime.UtcNow.AddDays(7);
                            token.UpdatedAt = DateTime.UtcNow;
                        }

                        if (expTokens.Any())
                        {
                            await context.SaveChangesAsync(stoppingToken);
                            _logger.LogInformation($"✅ Đã gia hạn thành công {expTokens.Count} tokens.");
                        }
                    }

                    _logger.LogInformation("✅ Job Refresh Token đã quét xong.");
                }
                catch (Exception ex)
                {
                    _logger.LogError("Lỗi khi chạy Token Renewal Job: {Message}", ex.Message);
                }

                await Task.Delay(TimeSpan.FromHours(12), stoppingToken);
            }
        }
    }
}

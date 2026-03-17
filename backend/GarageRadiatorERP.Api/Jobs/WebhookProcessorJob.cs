using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using GarageRadiatorERP.Api.Services.Platforms;

namespace GarageRadiatorERP.Api.Jobs
{
    public class WebhookProcessorJob : BackgroundService
    {
        private readonly ILogger<WebhookProcessorJob> _logger;
        private readonly IWebhookQueueService _queue;
        private readonly IServiceScopeFactory _scopeFactory;

        public WebhookProcessorJob(ILogger<WebhookProcessorJob> logger, IWebhookQueueService queue, IServiceScopeFactory scopeFactory)
        {
            _logger = logger;
            _queue = queue;
            _scopeFactory = scopeFactory;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("🚀 Kích hoạt Job Nền: Webhook Processor đang chờ tin nhắn...");

            await foreach (var message in _queue.DequeueAsync(stoppingToken))
            {
                try
                {
                    using (var scope = _scopeFactory.CreateScope())
                    {
                        var platformService = scope.ServiceProvider.GetRequiredService<IPlatformService>();

                        if (message.Platform == "Shopee")
                        {
                            await platformService.ProcessShopeeWebhookAsync(message.Payload);
                        }
                        else if (message.Platform == "TikTok")
                        {
                            await platformService.ProcessTikTokWebhookAsync(message.Payload);
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Lỗi khi xử lý hàng đợi Webhook từ {Platform}", message.Platform);
                }
            }
        }
    }
}

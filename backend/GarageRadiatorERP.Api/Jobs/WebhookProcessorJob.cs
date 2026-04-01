using System;
using System.Threading;
using System.Threading.Tasks;
using System.Linq;
using Microsoft.EntityFrameworkCore;
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
            _logger.LogInformation("🚀 Kích hoạt Job Nền: Database Webhook Processor Worker.");

            var semaphore = new SemaphoreSlim(20); // Scale concurrent worker an toàn

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using var scope = _scopeFactory.CreateScope();
                    var dbContext = scope.ServiceProvider.GetRequiredService<GarageRadiatorERP.Api.Data.AppDbContext>();

                    // Bối cảnh 3 (Phần 2): Kéo Pending từ bảng PlatformPayloads để xử lý thay vì Channel RAM
                    var pendingWebhooks = await dbContext.PlatformPayloads
                        .Where(p => p.Status == "Pending")
                        .OrderBy(p => p.CreatedAt)
                        .Take(100)
                        .ToListAsync(stoppingToken);

                    if (pendingWebhooks.Count == 0)
                    {
                        await Task.Delay(5000, stoppingToken); // Chờ 5s nếu không có webhook mới
                        continue;
                    }

                    var tasks = new System.Collections.Generic.List<Task>();

                    foreach (var evt in pendingWebhooks)
                    {
                        await semaphore.WaitAsync(stoppingToken);
                        evt.Status = "Processing"; // Lock row
                        await dbContext.SaveChangesAsync(stoppingToken);

                        tasks.Add(Task.Run(async () =>
                        {
                            using var innerScope = _scopeFactory.CreateScope();
                            var innerDb = innerScope.ServiceProvider.GetRequiredService<GarageRadiatorERP.Api.Data.AppDbContext>();
                            var platformService = innerScope.ServiceProvider.GetRequiredService<IPlatformService>();

                            var webhookToProcess = await innerDb.PlatformPayloads.FindAsync(new object[] { evt.Id }, stoppingToken);
                            if (webhookToProcess == null) return;

                            try
                            {
                                if (webhookToProcess.Platform == "Shopee")
                                {
                                    await platformService.ProcessShopeeWebhookAsync(webhookToProcess.PayloadJson);
                                }
                                else if (webhookToProcess.Platform == "TikTok")
                                {
                                    await platformService.ProcessTikTokWebhookAsync(webhookToProcess.PayloadJson);
                                }

                                webhookToProcess.Status = "Completed";
                            }
                            catch (Exception ex)
                            {
                                webhookToProcess.Status = "Failed";
                                webhookToProcess.ErrorMessage = ex.Message;
                                _logger.LogError(ex, "Lỗi khi xử lý hàng đợi Webhook từ {Platform}. Id: {Id}", webhookToProcess.Platform, webhookToProcess.Id);
                            }
                            finally
                            {
                                await innerDb.SaveChangesAsync(stoppingToken);
                                semaphore.Release();
                            }
                        }, stoppingToken));
                    }

                    await Task.WhenAll(tasks);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Fatal Error in WebhookProcessorJob Worker loop");
                    await Task.Delay(5000, stoppingToken);
                }
            }
        }
    }
}

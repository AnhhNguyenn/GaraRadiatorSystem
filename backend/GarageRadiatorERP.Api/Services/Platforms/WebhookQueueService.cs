using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using GarageRadiatorERP.Api.Data;
using GarageRadiatorERP.Api.Models.Platforms;
using Microsoft.Extensions.DependencyInjection;

namespace GarageRadiatorERP.Api.Services.Platforms
{
    public interface IWebhookQueueService
    {
        Task QueueWebhookAsync(string platform, string payload);
    }

    public class WebhookQueueService : IWebhookQueueService
    {
        private readonly IServiceScopeFactory _scopeFactory;

        public WebhookQueueService(IServiceScopeFactory scopeFactory)
        {
            _scopeFactory = scopeFactory;
        }

        public async Task QueueWebhookAsync(string platform, string payload)
        {
            // Bối cảnh 3 (Phần 2): Bỏ In-Memory Channel, Insert Payload thô thẳng xuống DB
            // Điều này phòng ngừa mất đơn hàng Webhook khi App Pool Recycle hoặc Restart Docker.
            using var scope = _scopeFactory.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            var evt = new PlatformPayload
            {
                Platform = platform,
                PayloadJson = payload,
                Status = "Pending",
                CreatedAt = DateTime.UtcNow
            };

            context.PlatformPayloads.Add(evt);
            await context.SaveChangesAsync();
        }
    }
}

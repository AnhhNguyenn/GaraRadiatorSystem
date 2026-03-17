using System;
using System.Threading.Tasks;
using GarageRadiatorERP.Api.Data;
using GarageRadiatorERP.Api.Models.Platforms;

namespace GarageRadiatorERP.Api.Services.Platforms
{
    public interface IPlatformService
    {
        Task SavePayloadAsync(string platform, string payloadJson);
        Task ProcessShopeeWebhookAsync(string payloadJson);
        Task ProcessTikTokWebhookAsync(string payloadJson);
    }

    public class PlatformService : IPlatformService
    {
        private readonly AppDbContext _context;

        public PlatformService(AppDbContext context)
        {
            _context = context;
        }

        public async Task SavePayloadAsync(string platform, string payloadJson)
        {
            var payload = new PlatformPayload
            {
                Platform = platform,
                PayloadJson = payloadJson,
                CreatedAt = DateTime.UtcNow
            };

            _context.PlatformPayloads.Add(payload);
            await _context.SaveChangesAsync();
        }

        public async Task ProcessShopeeWebhookAsync(string payloadJson)
        {
            // First save raw payload
            await SavePayloadAsync("Shopee", payloadJson);

            // Logic to parse payload and create/update order
            // This would involve mapping platform order status to internal order status
        }

        public async Task ProcessTikTokWebhookAsync(string payloadJson)
        {
            // First save raw payload
            await SavePayloadAsync("TikTok", payloadJson);

            // Logic to parse payload and create/update order
        }
    }
}

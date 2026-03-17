using System.Collections.Generic;
using System.Threading;
using System.Threading.Channels;
using System.Threading.Tasks;

namespace GarageRadiatorERP.Api.Services.Platforms
{
    public interface IWebhookQueueService
    {
        ValueTask QueueWebhookAsync(string platform, string payload);
        IAsyncEnumerable<WebhookMessage> DequeueAsync(CancellationToken cancellationToken);
    }
    
    public record WebhookMessage(string Platform, string Payload);

    public class WebhookQueueService : IWebhookQueueService
    {
        private readonly Channel<WebhookMessage> _queue;

        public WebhookQueueService()
        {
            var options = new BoundedChannelOptions(10000)
            {
                FullMode = BoundedChannelFullMode.DropOldest
            };
            _queue = Channel.CreateBounded<WebhookMessage>(options);
        }

        public async ValueTask QueueWebhookAsync(string platform, string payload)
        {
            await _queue.Writer.WriteAsync(new WebhookMessage(platform, payload));
        }

        public IAsyncEnumerable<WebhookMessage> DequeueAsync(CancellationToken cancellationToken)
        {
            return _queue.Reader.ReadAllAsync(cancellationToken);
        }
    }
}

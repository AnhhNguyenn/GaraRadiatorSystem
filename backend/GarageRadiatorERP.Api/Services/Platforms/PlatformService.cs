using System;
using System.Threading.Tasks;
using GarageRadiatorERP.Api.Data;
using GarageRadiatorERP.Api.Models.Platforms;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace GarageRadiatorERP.Api.Services.Platforms
{
    public interface IPlatformService
    {
        Task SavePayloadAsync(string platform, string payloadJson);
        Task ProcessShopeeWebhookAsync(string payloadJson);
        Task ProcessTikTokWebhookAsync(string payloadJson);
        Task FetchLogisticsDataAsync(Guid orderId);
    }

    public class PlatformService : IPlatformService
    {
        private readonly AppDbContext _context;
        private readonly Microsoft.AspNetCore.SignalR.IHubContext<GarageRadiatorERP.Api.Hubs.ChatHub> _hubContext;
        private readonly Microsoft.Extensions.DependencyInjection.IServiceScopeFactory _scopeFactory;

        public PlatformService(AppDbContext context, Microsoft.AspNetCore.SignalR.IHubContext<GarageRadiatorERP.Api.Hubs.ChatHub> hubContext, Microsoft.Extensions.DependencyInjection.IServiceScopeFactory scopeFactory)
        {
            _context = context;
            _hubContext = hubContext;
            _scopeFactory = scopeFactory;
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

            try
            {
                using var doc = global::System.Text.Json.JsonDocument.Parse(payloadJson);
                var root = doc.RootElement;

                // Assuming standard Shopee push: {"data": {"ordersn": "123", "status": "READY_TO_SHIP"}} // Or Chat: {"buyer_id": "123", "message": "Hi"}
                if (root.TryGetProperty("data", out var data) && data.TryGetProperty("ordersn", out var orderSnProp))
                {
                    var orderSn = orderSnProp.GetString();
                    var status = data.TryGetProperty("status", out var statusProp) ? statusProp.GetString() : "Pending";

                    if (!string.IsNullOrEmpty(orderSn))
                    {
                        await UpsertOnlineOrderAsync("Shopee", orderSn, status ?? "Pending");
                    }
                }
                else if (root.TryGetProperty("message", out var msgProp) && root.TryGetProperty("buyer_id", out var buyerIdProp))
                {
                    await UpsertChatMessageAsync("Shopee", buyerIdProp.GetString() ?? "Unknown", msgProp.GetString() ?? "");
                }
            }
            catch (global::System.Text.Json.JsonException) { /* Ignored if invalid json/structure */ }
        }

        public async Task ProcessTikTokWebhookAsync(string payloadJson)
        {
            // First save raw payload
            await SavePayloadAsync("TikTok", payloadJson);

            try
            {
                using var doc = global::System.Text.Json.JsonDocument.Parse(payloadJson);
                var root = doc.RootElement;

                // Assuming TikTok push: {"data": {"order_id": "123", "order_status": "AWAITING_SHIPMENT"}}
                if (root.TryGetProperty("data", out var data) && data.TryGetProperty("order_id", out var orderIdProp))
                {
                    var orderId = orderIdProp.GetString();
                    var status = data.TryGetProperty("order_status", out var statusProp) ? statusProp.GetString() : "Pending";

                    if (!string.IsNullOrEmpty(orderId))
                    {
                        await UpsertOnlineOrderAsync("TikTok", orderId, status ?? "Pending");
                    }
                }
                else if (root.TryGetProperty("message", out var msgProp) && root.TryGetProperty("buyer_id", out var buyerIdProp))
                {
                    await UpsertChatMessageAsync("TikTok", buyerIdProp.GetString() ?? "Unknown", msgProp.GetString() ?? "");
                }
            }
            catch (global::System.Text.Json.JsonException) { }
        }

        private async Task UpsertOnlineOrderAsync(string platform, string orderId, string status)
        {
            var existingDetail = await _context.OnlineOrderDetails
                .Include(d => d.Order)
                .FirstOrDefaultAsync(d => d.PlatformOrderId == orderId && d.Platform == platform);

            Guid currentOrderId;

            if (existingDetail != null)
            {
                // Update status
                existingDetail.Order.Status = status;
                currentOrderId = existingDetail.OrderId;
                await _context.SaveChangesAsync();
            }
            else
            {
                // Create new basic order stub for the external order
                var newOrder = new Models.Orders.Order
                {
                    CustomerId = null,
                    Source = platform,
                    Status = status,
                    PaymentStatus = "Pending",
                    OrderDate = DateTime.UtcNow
                };

                newOrder.OnlineDetails = new Models.Orders.OnlineOrderDetails
                {
                    Platform = platform,
                    PlatformOrderId = orderId,
                    ShippingCode = "",
                    CourierName = ""
                };

                _context.Orders.Add(newOrder);
                await _context.SaveChangesAsync();
                currentOrderId = newOrder.Id;

                // Broadcast Realtime Notification
                await _hubContext.Clients.All.SendAsync("ReceiveNotification", new
                {
                    message = $"Có đơn hàng mới từ {platform}! Mã đơn: {orderId}",
                    type = "success",
                    time = DateTime.UtcNow
                });
            }

            // Gọi hàm Background để lấy chi tiết vận đơn. Thực tế nên đẩy qua Background Queue (VD: Hangfire).
            // Do MVP, ta sẽ trigger Fire-and-forget lấy Logistics data.
            _ = Task.Run(() => FetchLogisticsDataAsync(currentOrderId));
        }

        public async Task FetchLogisticsDataAsync(Guid orderId)
        {
            // Giả lập delay 5s như yêu cầu lấy mã vận đơn
            await Task.Delay(TimeSpan.FromSeconds(5));

            using var scope = _scopeFactory.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            var orderDetail = await dbContext.OnlineOrderDetails.FirstOrDefaultAsync(o => o.OrderId == orderId);
            if (orderDetail == null) return;

            if (orderDetail.Platform == "Shopee")
            {
                // Giả lập gọi Open API: v2.order.get_order_detail và v2.logistics.download_shipping_document
                // Cập nhật thông tin thực tế từ JSON response
                orderDetail.CourierName = "SPX Express";
                orderDetail.ShippingCode = "SPX" + new Random().Next(100000, 999999).ToString();
                orderDetail.LabelUrl = $"https://seller.shopee.vn/api/v3/logistics/download_shipping_document?order_id={orderDetail.PlatformOrderId}";
            }
            else if (orderDetail.Platform == "TikTok")
            {
                // Giả lập gọi Open API: Get Eligible Shipping Service -> Create Packages -> Get Shipping Document
                orderDetail.CourierName = "J&T Express";
                orderDetail.ShippingCode = "JT" + new Random().Next(100000, 999999).ToString();
                orderDetail.LabelUrl = $"https://seller-vn.tiktok.com/api/v1/orders/document?order_id={orderDetail.PlatformOrderId}";
            }

            dbContext.OnlineOrderDetails.Update(orderDetail);
            await dbContext.SaveChangesAsync();
        }

        private async Task UpsertChatMessageAsync(string platform, string buyerId, string messageText)
        {
            var conversation = await _context.PlatformConversations
                .FirstOrDefaultAsync(c => c.Platform == platform && c.BuyerId == buyerId);

            if (conversation == null)
            {
                conversation = new PlatformConversation
                {
                    Platform = platform,
                    BuyerId = buyerId,
                    BuyerName = $"Guest {buyerId}",
                    LastMessage = messageText,
                    UpdatedAt = DateTime.UtcNow
                };
                _context.PlatformConversations.Add(conversation);
                await _context.SaveChangesAsync();
            }

            var message = new PlatformMessage
            {
                ConversationId = conversation.Id,
                Sender = "Buyer",
                Message = messageText,
                CreatedAt = DateTime.UtcNow,
                IsRead = false
            };

            _context.PlatformMessages.Add(message);

            conversation.LastMessage = messageText;
            conversation.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Broadcast real-time to UI
            await _hubContext.Clients.All.SendAsync("ReceiveNewMessage", new
            {
                conversationId = conversation.Id,
                platform = platform,
                buyerId = buyerId,
                message = messageText,
                time = DateTime.UtcNow
            });

            await _hubContext.Clients.All.SendAsync("ReceiveNotification", new
            {
                message = $"💬 Tin nhắn mới từ {platform} ({buyerId}): {messageText}",
                type = "info",
                time = DateTime.UtcNow
            });
        }
    }
}

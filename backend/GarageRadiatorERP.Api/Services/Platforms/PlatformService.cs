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
        Task ConfirmOrderOnPlatformAsync(Guid orderId, string shippingMethod);
        Task SyncStockToPlatformAsync(Guid productId, int newQuantity);
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

                // Assuming standard Shopee push: {"data": {"ordersn": "123", "status": "READY_TO_SHIP", "items": [{"item_id": 1, "model_id": 2, "quantity": 1}]}}
                if (root.TryGetProperty("data", out var data) && data.TryGetProperty("ordersn", out var orderSnProp))
                {
                    var orderSn = orderSnProp.GetString();
                    var status = data.TryGetProperty("status", out var statusProp) ? statusProp.GetString() : "Pending";

                    var items = new List<(string platformSku, int quantity, decimal price)>();
                    if (data.TryGetProperty("items", out var itemsNode) && itemsNode.ValueKind == global::System.Text.Json.JsonValueKind.Array)
                    {
                        foreach(var item in itemsNode.EnumerateArray())
                        {
                            var modelId = item.TryGetProperty("model_id", out var mProp) ? mProp.GetInt64().ToString() : "";
                            var qty = item.TryGetProperty("quantity", out var qProp) ? qProp.GetInt32() : 1;
                            items.Add((modelId, qty, 0));
                        }
                    }

                    if (!string.IsNullOrEmpty(orderSn))
                    {
                        await UpsertOnlineOrderAsync("Shopee", orderSn, status ?? "Pending", items);
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

                // Assuming TikTok push: {"data": {"order_id": "123", "order_status": "AWAITING_SHIPMENT", "sku_list": [{"sku_id": "T123", "quantity": 1}]}}
                if (root.TryGetProperty("data", out var data) && data.TryGetProperty("order_id", out var orderIdProp))
                {
                    var orderId = orderIdProp.GetString();
                    var status = data.TryGetProperty("order_status", out var statusProp) ? statusProp.GetString() : "Pending";

                    var items = new List<(string platformSku, int quantity, decimal price)>();
                    if (data.TryGetProperty("sku_list", out var itemsNode) && itemsNode.ValueKind == global::System.Text.Json.JsonValueKind.Array)
                    {
                        foreach(var item in itemsNode.EnumerateArray())
                        {
                            var skuId = item.TryGetProperty("sku_id", out var mProp) ? mProp.GetString() ?? "" : "";
                            var qty = item.TryGetProperty("quantity", out var qProp) ? qProp.GetInt32() : 1;
                            items.Add((skuId, qty, 0));
                        }
                    }

                    if (!string.IsNullOrEmpty(orderId))
                    {
                        await UpsertOnlineOrderAsync("TikTok", orderId, status ?? "Pending", items);
                    }
                }
                else if (root.TryGetProperty("message", out var msgProp) && root.TryGetProperty("buyer_id", out var buyerIdProp))
                {
                    await UpsertChatMessageAsync("TikTok", buyerIdProp.GetString() ?? "Unknown", msgProp.GetString() ?? "");
                }
            }
            catch (global::System.Text.Json.JsonException) { }
        }

        private async Task UpsertOnlineOrderAsync(string platform, string orderId, string status, List<(string platformSku, int quantity, decimal price)> items)
        {
            var existingDetail = await _context.OnlineOrderDetails
                .Include(d => d.Order)
                .FirstOrDefaultAsync(d => d.PlatformOrderId == orderId && d.Platform == platform);

            if (existingDetail != null)
            {
                // Update status
                existingDetail.Order.Status = status;
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

                // Lấy danh sách mapping để thêm các Items vào Order (SKU Mapping Logic)
                var platformSkuList = items.Select(i => i.platformSku).ToList();
                var mappings = await _context.ProductMappings
                    .Where(m => m.Platform == platform && platformSkuList.Contains(m.PlatformSkuId ?? ""))
                    .ToDictionaryAsync(m => m.PlatformSkuId ?? "", m => m.ProductId);

                foreach(var item in items)
                {
                    if (mappings.TryGetValue(item.platformSku, out var productId))
                    {
                        newOrder.Items.Add(new Models.Orders.OrderItem
                        {
                            ProductId = productId,
                            Quantity = item.quantity,
                            UnitPrice = item.price,
                            CostPrice = 0 // Tạm thời để 0, logic OrderService RTS sẽ tính sau
                        });
                    }
                }

                _context.Orders.Add(newOrder);
                await _context.SaveChangesAsync();

                // Broadcast Realtime Notification
                await _hubContext.Clients.All.SendAsync("ReceiveNotification", new
                {
                    message = $"Có đơn hàng mới từ {platform}! Mã đơn: {orderId}",
                    type = "success",
                    time = DateTime.UtcNow
                });
            }
        }

        public async Task ConfirmOrderOnPlatformAsync(Guid orderId, string shippingMethod)
        {
            var orderDetail = await _context.OnlineOrderDetails.Include(o => o.Order).FirstOrDefaultAsync(o => o.OrderId == orderId);
            if (orderDetail == null || orderDetail.Order == null) throw new ArgumentException("Order not found.");

            if (orderDetail.Platform == "Shopee")
            {
                // Giả lập gọi Open API: v2.logistics.ship_order
                orderDetail.CourierName = "SPX Express";
                orderDetail.ShippingCode = "SPX" + new Random().Next(100000, 999999).ToString();
                orderDetail.LabelUrl = $"https://seller.shopee.vn/api/v3/logistics/download_shipping_document?order_id={orderDetail.PlatformOrderId}";
                // orderDetail.ShippingMethod = shippingMethod // Nếu model có
            }
            else if (orderDetail.Platform == "TikTok")
            {
                // Giả lập gọi Open API: /api/logistics/ship/detail
                orderDetail.CourierName = "J&T Express";
                orderDetail.ShippingCode = "JT" + new Random().Next(100000, 999999).ToString();
                orderDetail.LabelUrl = $"https://seller-vn.tiktok.com/api/v1/orders/document?order_id={orderDetail.PlatformOrderId}";
                // orderDetail.ShippingMethod = shippingMethod // Nếu model có
            }

            orderDetail.Order.Status = "Shipped";

            _context.OnlineOrderDetails.Update(orderDetail);
            await _context.SaveChangesAsync();
        }

        public async Task SyncStockToPlatformAsync(Guid productId, int newQuantity)
        {
            var mappings = await _context.ProductMappings
                .Where(m => m.ProductId == productId)
                .ToListAsync();

            if (!mappings.Any()) return;

            // Trong môi trường thật, ở đây sẽ có HttpClient gọi API của Shopee / TikTok để Push Stock
            foreach(var mapping in mappings)
            {
                if (mapping.Platform == "Shopee")
                {
                    // var client = _httpClientFactory.CreateClient();
                    // await client.PostAsJsonAsync("v2.product.update_stock", new { item_id = mapping.PlatformProductId, model_id = mapping.PlatformSkuId, stock_list = new[] { new { model_id = mapping.PlatformSkuId, normal_stock = newQuantity } } });
                    Console.WriteLine($"[SyncStockToPlatform] Đã đẩy tồn kho: {newQuantity} cho Shopee SkuId: {mapping.PlatformSkuId}");
                }
                else if (mapping.Platform == "TikTok")
                {
                    // var client = _httpClientFactory.CreateClient();
                    // await client.PostAsJsonAsync("/api/products/stock", new { product_id = mapping.PlatformProductId, skus = new[] { new { id = mapping.PlatformSkuId, stock_quantity = newQuantity } } });
                    Console.WriteLine($"[SyncStockToPlatform] Đã đẩy tồn kho: {newQuantity} cho TikTok SkuId: {mapping.PlatformSkuId}");
                }
            }
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

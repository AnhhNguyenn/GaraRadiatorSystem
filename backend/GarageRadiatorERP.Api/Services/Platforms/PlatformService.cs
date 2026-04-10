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
        Task SendMessageAsync(string platform, string buyerId, string messageText, string? imageUrl);
    }

    public class PlatformService : IPlatformService
    {
        private readonly AppDbContext _context;
        private readonly Microsoft.AspNetCore.SignalR.IHubContext<GarageRadiatorERP.Api.Hubs.ChatHub> _hubContext;
        private readonly Microsoft.Extensions.DependencyInjection.IServiceScopeFactory _scopeFactory;

        private readonly global::System.Net.Http.IHttpClientFactory _httpClientFactory;

        public PlatformService(AppDbContext context, Microsoft.AspNetCore.SignalR.IHubContext<GarageRadiatorERP.Api.Hubs.ChatHub> hubContext, Microsoft.Extensions.DependencyInjection.IServiceScopeFactory scopeFactory, global::System.Net.Http.IHttpClientFactory httpClientFactory)
        {
            _context = context;
            _hubContext = hubContext;
            _scopeFactory = scopeFactory;
            _httpClientFactory = httpClientFactory;
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

        public async Task SendMessageAsync(string platform, string buyerId, string messageText, string? imageUrl)
        {
            var client = _httpClientFactory.CreateClient();

            if (platform == "Shopee")
            {
                var apiUrl = "https://partner.shopeemobile.com/api/v2/sellerchat/send_message";
                try
                {
                    var token = await _context.PlatformTokens.FirstOrDefaultAsync(t => t.Store.PlatformName == "Shopee");
                    if (token != null) client.DefaultRequestHeaders.Add("Authorization", $"Bearer {token.AccessToken}");

                    var messageType = imageUrl != null ? "image" : "text";
                    var content = imageUrl != null ? (object)new { image_url = imageUrl } : (object)new { text = messageText };

                    var response = await client.PostAsJsonAsync(apiUrl, new { to_id = buyerId, message_type = messageType, content = content });
                    response.EnsureSuccessStatusCode();
                    Console.WriteLine($"[Shopee Chat] Gửi tin nhắn thành công tới {buyerId}");
                }
                catch (Exception ex) { Console.WriteLine(ex.Message); throw; }
            }
            else if (platform == "TikTok")
            {
                var apiUrl = "https://open-api.tiktokglobalshop.com/api/im/message/send";
                try
                {
                    var token = await _context.PlatformTokens.FirstOrDefaultAsync(t => t.Store.PlatformName == "TikTok");
                    if (token != null) client.DefaultRequestHeaders.Add("Authorization", $"Bearer {token.AccessToken}");

                    var messageType = imageUrl != null ? 2 : 1; // 1: text, 2: image
                    var response = await client.PostAsJsonAsync(apiUrl, new { conversation_id = buyerId, message_type = messageType, content = imageUrl ?? messageText });
                    response.EnsureSuccessStatusCode();
                    Console.WriteLine($"[TikTok Chat] Gửi tin nhắn thành công tới {buyerId}");
                }
                catch (Exception ex) { Console.WriteLine(ex.Message); throw; }
            }
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

                var mappedProductIds = mappings.Values.ToList();
                var historicalCosts = await _context.InventoryBatches
                    .Where(b => mappedProductIds.Contains(b.ProductId))
                    .GroupBy(b => b.ProductId)
                    .Select(g => new { ProductId = g.Key, LatestCost = g.OrderByDescending(x => x.ImportDate).Select(x => x.CostPrice).FirstOrDefault() })
                    .ToDictionaryAsync(x => x.ProductId, x => x.LatestCost);

                var products = await _context.Products
                    .Where(p => mappedProductIds.Contains(p.Id))
                    .ToDictionaryAsync(p => p.Id);

                foreach(var item in items)
                {
                    if (mappings.TryGetValue(item.platformSku, out var productId))
                    {
                        decimal fallbackCostPrice = historicalCosts.TryGetValue(productId, out var hc) && hc > 0 ? hc : 0;

                        if (fallbackCostPrice == 0 && products.TryGetValue(productId, out var productObj))
                        {
                            fallbackCostPrice = productObj.StandardCost;
                        }

                        newOrder.Items.Add(new Models.Orders.OrderItem
                        {
                            ProductId = productId,
                            Quantity = item.quantity,
                            UnitPrice = item.price,
                            CostPrice = fallbackCostPrice // Fix: Lấy giá vốn như OrderService
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

            var client = _httpClientFactory.CreateClient();

            if (orderDetail.Platform == "Shopee")
            {
                var apiUrl = "https://partner.shopeemobile.com/api/v2/logistics/ship_order";
                var token = await _context.PlatformTokens.FirstOrDefaultAsync(t => t.Store.PlatformName == "Shopee");
                if (token != null) client.DefaultRequestHeaders.Add("Authorization", $"Bearer {token.AccessToken}");

                var res = await client.PostAsJsonAsync(apiUrl, new { order_sn = orderDetail.PlatformOrderId, dropoff = new { tracking_number = "" } });
                res.EnsureSuccessStatusCode();

                orderDetail.CourierName = "SPX Express";
                orderDetail.ShippingCode = "SPX" + DateTime.UtcNow.Ticks.ToString();
                orderDetail.LabelUrl = $"https://seller.shopee.vn/api/v3/logistics/download_shipping_document?order_id={orderDetail.PlatformOrderId}";
            }
            else if (orderDetail.Platform == "TikTok")
            {
                var apiUrl = "https://open-api.tiktokglobalshop.com/api/logistics/ship/detail";
                var token = await _context.PlatformTokens.FirstOrDefaultAsync(t => t.Store.PlatformName == "TikTok");
                if (token != null) client.DefaultRequestHeaders.Add("Authorization", $"Bearer {token.AccessToken}");

                var res = await client.PostAsJsonAsync(apiUrl, new { order_id = orderDetail.PlatformOrderId, pick_up_type = shippingMethod == "dropoff" ? 1 : 2 });
                res.EnsureSuccessStatusCode();

                orderDetail.CourierName = "J&T Express";
                orderDetail.ShippingCode = "JT" + DateTime.UtcNow.Ticks.ToString();
                orderDetail.LabelUrl = $"https://seller-vn.tiktok.com/api/v1/orders/document?order_id={orderDetail.PlatformOrderId}";
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

            // Low Stock Protection: Báo hết hàng nếu < 2 để chống overselling
            int pushStock = newQuantity < 2 ? 0 : newQuantity;
            var client = _httpClientFactory.CreateClient();

            foreach(var mapping in mappings)
            {
                if (mapping.Platform == "Shopee")
                {
                    var apiUrl = "https://partner.shopeemobile.com/api/v2/product/update_stock";
                    try
                    {
                        var token = await _context.PlatformTokens.FirstOrDefaultAsync(t => t.Store.PlatformName == "Shopee");
                        if (token != null) client.DefaultRequestHeaders.Add("Authorization", $"Bearer {token.AccessToken}");

                        var res = await client.PostAsJsonAsync(apiUrl, new { item_id = long.Parse(mapping.PlatformProductId), stock_list = new[] { new { model_id = long.Parse(mapping.PlatformSkuId ?? "0"), normal_stock = pushStock } } });
                        res.EnsureSuccessStatusCode();
                        Console.WriteLine($"[SyncStockToPlatform] Đã gọi API Shopee {apiUrl} đẩy tồn kho: {pushStock} cho SkuId: {mapping.PlatformSkuId}");
                    }
                    catch (Exception ex) { Console.WriteLine(ex.Message); throw; }
                }
                else if (mapping.Platform == "TikTok")
                {
                    var apiUrl = "https://open-api.tiktokglobalshop.com/api/products/stock";
                    try
                    {
                        var token = await _context.PlatformTokens.FirstOrDefaultAsync(t => t.Store.PlatformName == "TikTok");
                        if (token != null) client.DefaultRequestHeaders.Add("Authorization", $"Bearer {token.AccessToken}");

                        var res = await client.PostAsJsonAsync(apiUrl, new { product_id = mapping.PlatformProductId, skus = new[] { new { id = mapping.PlatformSkuId, stock_quantity = pushStock } } });
                        res.EnsureSuccessStatusCode();
                        Console.WriteLine($"[SyncStockToPlatform] Đã gọi API TikTok {apiUrl} đẩy tồn kho: {pushStock} cho SkuId: {mapping.PlatformSkuId}");
                    }
                    catch (Exception ex) { Console.WriteLine(ex.Message); throw; }
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

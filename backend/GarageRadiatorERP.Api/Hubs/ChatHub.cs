using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;

namespace GarageRadiatorERP.Api.Hubs
{
    public class ChatHub : Hub
    {
        private readonly ILogger<ChatHub> _logger;

        public ChatHub(ILogger<ChatHub> logger)
        {
            _logger = logger;
        }

        public override async Task OnConnectedAsync()
        {
            _logger.LogInformation("🚀 [Socket] New Omnichannel Client Connected: {ConnectionId}", Context.ConnectionId);

            // Tự động Add user vào Group theo Claim (Giả lập đơn giản)
            // Lỗi 42: Phải gửi thông báo tới đích danh Group.
            if (Context.User?.IsInRole("Admin") == true || Context.User?.IsInRole("Manager") == true)
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, "InventoryAdmins");
            }

            await Clients.Caller.SendAsync("SystemMessage", "Đã kết nối thành công đến ERP ChatHub!");
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            _logger.LogInformation("🔴 [Socket] Client Disconnected: {ConnectionId}", Context.ConnectionId);
            await base.OnDisconnectedAsync(exception);
        }

        // Send msg from ERP UI to Shopee API (Mocked real-time forwarding)
        public async Task ReplyToCustomer(string platform, string customerId, string message)
        {
            _logger.LogInformation("📨 Sending message to {Platform} user {Customer}: {Message}", platform, customerId, message);
            
            // Logic calling Shopee OpenAPI / TikTok API to send message here
            
            // Echo back to client to confirm
            await Clients.Caller.SendAsync("MessageSentStatus", new { platform, customerId, success = true });
        }

        // Broadcast a system-wide notification to all connected clients (e.g., POS screens)
        public async Task BroadcastNotification(string message, string type = "info")
        {
            // Tránh Spam Clients.All (Lỗi 42)
            await Clients.Group("InventoryAdmins").SendAsync("ReceiveNotification", new { message, type, time = DateTimeOffset.UtcNow.UtcDateTime });
        }
    }
}

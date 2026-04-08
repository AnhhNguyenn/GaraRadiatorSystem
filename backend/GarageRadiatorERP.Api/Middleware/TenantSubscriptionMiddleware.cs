using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using GarageRadiatorERP.Api.Data;
using GarageRadiatorERP.Api.Services.System;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Security.Claims;

namespace GarageRadiatorERP.Api.Middleware
{
    public class TenantSubscriptionMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<TenantSubscriptionMiddleware> _logger;

        public TenantSubscriptionMiddleware(RequestDelegate next, ILogger<TenantSubscriptionMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context, AppDbContext dbContext, ITenantProvider tenantProvider)
        {
            // Bỏ qua nếu endpoint hiện tại không yêu cầu xác thực hoặc là API đăng nhập
            if (context.Request.Path.StartsWithSegments("/api/v1/auth") || context.Request.Path.StartsWithSegments("/api/webhooks"))
            {
                await _next(context);
                return;
            }

            var tenantId = tenantProvider.GetTenantId();
            if (tenantId.HasValue && tenantId.Value != System.Guid.Empty)
            {
                // Cho phép SuperAdmin bypass qua Subscription Check
                var isSuperAdmin = context.User?.IsInRole("SuperAdmin") ?? false;
                if (!isSuperAdmin)
                {
                    var subscription = await dbContext.TenantSubscriptions
                        .IgnoreQueryFilters()
                        .FirstOrDefaultAsync(s => s.TenantId == tenantId.Value);

                    if (subscription == null)
                    {
                        // Chưa có plan
                        context.Response.StatusCode = StatusCodes.Status403Forbidden;
                        await context.Response.WriteAsJsonAsync(new { message = "Gara của bạn chưa đăng ký gói cước dịch vụ." });
                        return;
                    }

                    if (!subscription.IsActive)
                    {
                        // Bị khóa (Khóa chủ động)
                        context.Response.StatusCode = StatusCodes.Status403Forbidden;
                        await context.Response.WriteAsJsonAsync(new { message = "Tài khoản Gara đã bị khóa. Vui lòng liên hệ hỗ trợ." });
                        return;
                    }

                    if (System.DateTime.UtcNow > subscription.EndDate)
                    {
                        // Hết hạn (Khóa bị động)
                        context.Response.StatusCode = StatusCodes.Status402PaymentRequired;
                        await context.Response.WriteAsJsonAsync(new { message = "Gói cước đã hết hạn. Vui lòng gia hạn để tiếp tục sử dụng." });
                        return;
                    }
                }
            }

            await _next(context);
        }
    }
}

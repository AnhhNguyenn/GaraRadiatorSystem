using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;

namespace GarageRadiatorERP.Api.Middleware
{
    public class SecurityHeadersMiddleware
    {
        private readonly RequestDelegate _next;

        public SecurityHeadersMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            // X-Frame-Options: Prevent Clickjacking
            context.Response.Headers["X-Frame-Options"] = "DENY";
            
            // X-XSS-Protection: Cross-site scripting (XSS) filter
            context.Response.Headers["X-XSS-Protection"] = "1; mode=block";
            
            // X-Content-Type-Options: Prevent MIME-sniffing
            context.Response.Headers["X-Content-Type-Options"] = "nosniff";

            // Strict-Transport-Security (HSTS): Forced HTTPS
            // Lỗi 10: Xóa append HSTS bị đụng độ ở Program.cs. Dùng index an toàn.
            if (context.Request.IsHttps)
            {
                context.Response.Headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload";
            }

            // Remove highly exposing headers (Server removed via Kestrel options instead)
            context.Response.Headers.Remove("X-Powered-By");

            await _next(context);
        }
    }
}

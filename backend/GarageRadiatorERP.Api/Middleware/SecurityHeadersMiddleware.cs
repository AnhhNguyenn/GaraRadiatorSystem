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
            context.Response.Headers.Append("X-Frame-Options", "DENY");
            
            // X-XSS-Protection: Cross-site scripting (XSS) filter
            context.Response.Headers.Append("X-XSS-Protection", "1; mode=block");
            
            // X-Content-Type-Options: Prevent MIME-sniffing
            context.Response.Headers.Append("X-Content-Type-Options", "nosniff");
            
            // Content-Security-Policy (CSP): Restrict sources of content
            context.Response.Headers.Append("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' http://localhost:3000 wss://localhost:5248 ws://localhost:5248;");

            // Strict-Transport-Security (HSTS): Forced HTTPS
            if (context.Request.IsHttps)
            {
                context.Response.Headers.Append("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
            }

            // Remove highly exposing headers
            context.Response.Headers.Remove("X-Powered-By");
            context.Response.Headers.Remove("Server");

            await _next(context);
        }
    }
}

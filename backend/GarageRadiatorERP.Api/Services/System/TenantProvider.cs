using System;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace GarageRadiatorERP.Api.Services.System
{
    public interface ITenantProvider
    {
        Guid? GetTenantId();
    }

    public class TenantProvider : ITenantProvider
    {
        private readonly IHttpContextAccessor _httpContextAccessor;

        public TenantProvider(IHttpContextAccessor httpContextAccessor)
        {
            _httpContextAccessor = httpContextAccessor;
        }

        public Guid? GetTenantId()
        {
            var user = _httpContextAccessor.HttpContext?.User;
            if (user == null || !user.Identity.IsAuthenticated)
                return null; // For Background Jobs, needs separate context

            // Lấy từ JWT Claims
            var tenantClaim = user.FindFirst("TenantId")?.Value;
            if (tenantClaim != null && Guid.TryParse(tenantClaim, out Guid tenantId))
            {
                return tenantId;
            }

            return null;
        }
    }
}

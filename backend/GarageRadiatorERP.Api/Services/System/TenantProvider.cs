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

        private Guid? _backgroundJobTenantId;

        public void SetTenantId(Guid tenantId)
        {
            _backgroundJobTenantId = tenantId;
        }

        public Guid? GetTenantId()
        {
            if (_backgroundJobTenantId.HasValue) return _backgroundJobTenantId.Value;

            var user = _httpContextAccessor.HttpContext?.User;
            if (user == null || !user.Identity.IsAuthenticated)
                return null; // For Background Jobs without setter, needs separate context

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

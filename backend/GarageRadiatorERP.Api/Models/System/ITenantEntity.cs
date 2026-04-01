using System;

namespace GarageRadiatorERP.Api.Models.System
{
    public interface ITenantEntity
    {
        Guid TenantId { get; set; }
    }
}

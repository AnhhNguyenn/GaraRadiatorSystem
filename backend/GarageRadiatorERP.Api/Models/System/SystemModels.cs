using System;
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Identity;

namespace GarageRadiatorERP.Api.Models.System
{
    public class ApplicationUser : IdentityUser<Guid>
    {
        [StringLength(100)]
        public string? FullName { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Multi-Tenant Isolation
        public Guid? TenantId { get; set; }

        // Navigation property to PlatformStore (acting as Tenant)
        public GarageRadiatorERP.Api.Models.Platforms.PlatformStore? Tenant { get; set; }

        // Security: Force Password Change Flag
        public bool MustChangePassword { get; set; } = false;
    }

    public class TenantSubscription
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        public Guid TenantId { get; set; }

        public GarageRadiatorERP.Api.Models.Platforms.PlatformStore Tenant { get; set; } = null!;

        [Required]
        [StringLength(100)]
        public string PlanName { get; set; } = string.Empty; // e.g., "Basic", "Pro", "Enterprise"

        public DateTime StartDate { get; set; }

        public DateTime EndDate { get; set; }

        public bool IsActive { get; set; } = true; // Công tắc sống còn của Gara

        public int MaxUsers { get; set; } = 5; // Giới hạn số lượng nhân viên
    }

    public class TenantRole
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        public Guid TenantId { get; set; }

        public GarageRadiatorERP.Api.Models.Platforms.PlatformStore Tenant { get; set; } = null!;

        [Required]
        [StringLength(100)]
        public string RoleName { get; set; } = string.Empty; // e.g., "Nhân viên Kho"

        public string Permissions { get; set; } = "[]"; // Chuỗi JSON chứa permissions ["pos.create", "inventory.view"]
    }

    public class ApplicationRole : IdentityRole<Guid>
    {
        public string? Description { get; set; }
    }

    public class AuditLog
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        public Guid? UserId { get; set; }

        [Required]
        [StringLength(100)]
        public string Action { get; set; } = string.Empty;

        [Required]
        [StringLength(100)]
        public string TableName { get; set; } = string.Empty;

        public string? OldData { get; set; }
        public string? NewData { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public class SystemSetting
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        [StringLength(200)]
        public string SettingKey { get; set; } = string.Empty;

        public string SettingValue { get; set; } = string.Empty;

        [StringLength(500)]
        public string Description { get; set; } = string.Empty;
    }
}

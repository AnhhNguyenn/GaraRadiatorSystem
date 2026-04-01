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
}

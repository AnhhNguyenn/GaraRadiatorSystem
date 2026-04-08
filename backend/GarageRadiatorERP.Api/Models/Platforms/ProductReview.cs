using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GarageRadiatorERP.Api.Models.Platforms
{
    public class ProductReview : GarageRadiatorERP.Api.Models.System.ITenantEntity
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        public Guid TenantId { get; set; }

        public Guid? ProductId { get; set; }
        public GarageRadiatorERP.Api.Models.Products.Product? Product { get; set; }

        [Required]
        [StringLength(50)]
        public string Platform { get; set; } = string.Empty;

        [Required]
        [StringLength(100)]
        public string PlatformOrderId { get; set; } = string.Empty;

        [StringLength(200)]
        public string? BuyerName { get; set; }

        [Range(1, 5)]
        public int Rating { get; set; }

        [StringLength(2000)]
        public string? Comment { get; set; }

        [StringLength(2000)]
        public string? Reply { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? RepliedAt { get; set; }
    }
}

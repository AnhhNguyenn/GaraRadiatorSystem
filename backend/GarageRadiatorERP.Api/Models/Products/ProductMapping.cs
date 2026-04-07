using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GarageRadiatorERP.Api.Models.Products
{
    public class ProductMapping : GarageRadiatorERP.Api.Models.System.ITenantEntity
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        public Guid TenantId { get; set; }

        public Guid ProductId { get; set; }
        public Product Product { get; set; } = null!;

        [Required]
        [StringLength(50)]
        public string Platform { get; set; } = string.Empty; // Shopee, TikTok

        [Required]
        [StringLength(100)]
        public string PlatformProductId { get; set; } = string.Empty; // item_id của sàn

        [StringLength(100)]
        public string? PlatformSkuId { get; set; } // model_id hoặc sku_id của sàn (nếu sản phẩm có phân loại)

        [StringLength(100)]
        public string? PlatformSku { get; set; } // Mã SKU trên sàn (VD: SHP-99)

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}

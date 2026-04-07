using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GarageRadiatorERP.Api.Models.Products
{
    public class Product : GarageRadiatorERP.Api.Models.System.ITenantEntity
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        public Guid TenantId { get; set; }

        [Required]
        [StringLength(255)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [StringLength(50)]
        public string SKU { get; set; } = string.Empty;

        [StringLength(50)]
        public string? Barcode { get; set; }

        public Guid? CategoryId { get; set; }
        public ProductCategory? Category { get; set; }

        [StringLength(100)]
        public string? Brand { get; set; }

        [Column(TypeName = "decimal(10,2)")]
        public decimal? NetWeight { get; set; } // Trọng lượng tịnh

        [Column(TypeName = "decimal(10,2)")]
        public decimal? GrossWeight { get; set; } // Trọn lượng gồm bao bì đóng gói

        [StringLength(20)]
        public string UnitOfMeasure { get; set; } = "Piece"; // Cái, Sợi, Lít

        public bool IsBulky { get; set; } = false; // Cảnh báo hàng cồng kềnh

        public int MinStockLevel { get; set; } = 3; // Ngưỡng tồn kho tối thiểu

        [Column(TypeName = "decimal(18,4)")]
        public decimal Price { get; set; } // Giá vốn trung bình / Giá tham khảo

        [Column(TypeName = "decimal(18,4)")]
        public decimal StandardCost { get; set; } // Giá vốn tiêu chuẩn

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public ProductSpecs? Specs { get; set; }
        public ProductHoseSpecs? HoseSpecs { get; set; }
        public ICollection<ProductImage> Images { get; set; } = new List<ProductImage>();
        public ICollection<Vehicles.ProductVehicleMap> VehicleMaps { get; set; } = new List<Vehicles.ProductVehicleMap>();
        public ICollection<Inventory.InventoryBatch> InventoryBatches { get; set; } = new List<Inventory.InventoryBatch>();
        public ICollection<OEMReference> OEMReferences { get; set; } = new List<OEMReference>();
    }

    public class ProductCategory : GarageRadiatorERP.Api.Models.System.ITenantEntity
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        public Guid TenantId { get; set; }

        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;

        public ICollection<Product> Products { get; set; } = new List<Product>();
    }

    // Thông số kĩ thuật két nước
    public class ProductSpecs
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        public Guid ProductId { get; set; }
        public Product Product { get; set; } = null!;

        [Column(TypeName = "decimal(10,2)")]
        public decimal? CoreWidth { get; set; }
        [Column(TypeName = "decimal(10,2)")]
        public decimal? CoreHeight { get; set; }
        [Column(TypeName = "decimal(10,2)")]
        public decimal? CoreThickness { get; set; }
        public int? Rows { get; set; }

        [StringLength(50)]
        public string? TransmissionType { get; set; } // AT hoặc MT

        [StringLength(100)]
        public string? Material { get; set; } // VD: Nhôm / Đồng

        [StringLength(100)]
        public string? TankType { get; set; } // VD: Vai nhựa hàn nhiệt
    }

    // Thông số kĩ thuật ống nước
    public class ProductHoseSpecs
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        public Guid ProductId { get; set; }
        public Product Product { get; set; } = null!;

        [Column(TypeName = "decimal(10,2)")]
        public decimal? InnerDiameter { get; set; }
        [Column(TypeName = "decimal(10,2)")]
        public decimal? OuterDiameter { get; set; }
        [Column(TypeName = "decimal(10,2)")]
        public decimal? Length { get; set; } // Chiều dài cong

        [StringLength(100)]
        public string? Shape { get; set; }

        [StringLength(100)]
        public string? Material { get; set; } // VD: Cao su đúc lõi thép
    }

    // Mã dùng chung OE / Aftermarket
    public class OEMReference
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        public Guid ProductId { get; set; }
        public Product Product { get; set; } = null!;

        [Required]
        [StringLength(100)]
        public string OEMCode { get; set; } = string.Empty;

        [StringLength(100)]
        public string? Manufacturer { get; set; } // VD: Toyota, Honda, Denso
    }

    public class ProductImage
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        public Guid ProductId { get; set; }
        public Product Product { get; set; } = null!;

        [Required]
        public string Url { get; set; } = string.Empty;

        public bool IsMain { get; set; } = false;
    }
}

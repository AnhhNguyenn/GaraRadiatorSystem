using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GarageRadiatorERP.Api.Models.Inventory
{
    public class Warehouse
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        [StringLength(200)]
        public string Name { get; set; } = string.Empty; // VD: Tổng Kho, Kho Tầng 1

        [StringLength(500)]
        public string? Address { get; set; }

        public ICollection<Zone> Zones { get; set; } = new List<Zone>();
    }

    // Khu vực dể phân loại mặt hàng trong Kho (VD: Khu đồ Nhôm, Khu Cao Su)
    public class Zone
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        public Guid WarehouseId { get; set; }
        public Warehouse Warehouse { get; set; } = null!;

        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;

        public ICollection<BinLocation> BinLocations { get; set; } = new List<BinLocation>();
    }

    // Vị trí chính xác để cất hàng (VD: Dãy A1 - Kệ 02 - Tầng 03 -> A1-02-03)
    public class BinLocation
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        public Guid ZoneId { get; set; }
        public Zone Zone { get; set; } = null!;

        [Required]
        [StringLength(50)]
        public string Barcode { get; set; } = string.Empty; // Mã vạch dán tại kệ (A1-02-03)

        [StringLength(50)]
        public string? Rack { get; set; } // Dãy/Kệ

        [StringLength(50)]
        public string? Shelf { get; set; } // Tầng

        public ICollection<InventoryBatch> InventoryBatches { get; set; } = new List<InventoryBatch>();
    }

    // Lô Tồn Kho - Yếu tố xương sống của hệ thống kế toán tính giá vốn FIFO
    public class InventoryBatch
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        public Guid ProductId { get; set; }
        public Products.Product Product { get; set; } = null!;

        public Guid? BinLocationId { get; set; }
        public BinLocation? BinLocation { get; set; }

        [StringLength(100)]
        public string? BatchNumber { get; set; } // Ký hiệu lô nhập từ Cảng/NCC mảng Container

        public int InitialQuantity { get; set; } // Số lượng ban đầu lúc nhập
        public int RemainingQuantity { get; set; } // Tồn hiện tại của cái lô này

        [Column(TypeName = "decimal(18,2)")]
        public decimal CostPrice { get; set; } // Giá vốn để vô sổ kế toán

        public DateTime ImportDate { get; set; } = DateTime.UtcNow;

        [Timestamp]
        public byte[] RowVersion { get; set; } = null!; // Concurrency token để chống Pessimistic Lock khi trừ tồn kho

        public ICollection<InventoryTransaction> Transactions { get; set; } = new List<InventoryTransaction>();
    }

    public class InventoryTransaction
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        public Guid ProductId { get; set; }
        public Products.Product Product { get; set; } = null!;

        public Guid? BatchId { get; set; }
        public InventoryBatch? Batch { get; set; }

        [Required]
        [StringLength(50)]
        public string Type { get; set; } = string.Empty; // import, sale, adjustment, return, damage

        public int QuantityChange { get; set; } // Dấu + là nhập, dấu - là xuất
        
        [StringLength(255)]
        public string? ReferenceDocument { get; set; } // VD: ID đơn hàng Shopee, ID Phiếu trả hàng

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public class Supplier
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        [StringLength(200)]
        public string Name { get; set; } = string.Empty;

        [StringLength(20)]
        public string? Phone { get; set; }

        [StringLength(100)]
        public string? Country { get; set; }

        public ICollection<PurchaseOrder> PurchaseOrders { get; set; } = new List<PurchaseOrder>();
    }

    public class PurchaseOrder
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        public Guid SupplierId { get; set; }
        public Supplier Supplier { get; set; } = null!;

        public DateTime PurchaseDate { get; set; } = DateTime.UtcNow;
        
        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalCost { get; set; }

        [StringLength(50)]
        public string Status { get; set; } = "Pending"; // Pending, Received, Cancelled

        public ICollection<PurchaseItem> Items { get; set; } = new List<PurchaseItem>();
    }

    public class PurchaseItem
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        public Guid PurchaseOrderId { get; set; }
        public PurchaseOrder PurchaseOrder { get; set; } = null!;

        public Guid ProductId { get; set; }
        public Products.Product Product { get; set; } = null!;

        // Liên kết BatchId nào được sinh ra từ cái Item này của phiếu nhập
        public Guid? InventoryBatchId { get; set; }
        public InventoryBatch? InventoryBatch { get; set; }

        public int Quantity { get; set; }
        
        [Column(TypeName = "decimal(18,2)")]
        public decimal CostPrice { get; set; }
    }
}

using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GarageRadiatorERP.Api.Models.Orders
{
    public class Customer : GarageRadiatorERP.Api.Models.System.ITenantEntity
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        public Guid TenantId { get; set; }

        [Required]
        [StringLength(200)]
        public string Name { get; set; } = string.Empty;

        [StringLength(20)]
        public string? Phone { get; set; }

        [StringLength(500)]
        public string? Address { get; set; }

        [Required]
        [StringLength(50)]
        public string Type { get; set; } = "Retail"; // Retail (Lẻ), Garage (Thợ), Wholesale (Đại lý)

        [StringLength(50)]
        public string? PricingTier { get; set; } // Bậc giá: VIP1, VIP2, Normal

        [Column(TypeName = "decimal(18,2)")]
        public decimal CreditLimit { get; set; } // Hạn mức công nợ cho phép Gara nợ

        [Column(TypeName = "decimal(18,2)")]
        public decimal CurrentBalance { get; set; } // Dư nợ hiẹn tại

        public ICollection<Order> Orders { get; set; } = new List<Order>();
    }

    public class Order : GarageRadiatorERP.Api.Models.System.ISoftDeletable, GarageRadiatorERP.Api.Models.System.ITenantEntity
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        public Guid TenantId { get; set; }

        public Guid? CustomerId { get; set; }
        public Customer? Customer { get; set; }

        [Required]
        [StringLength(50)]
        public string Source { get; set; } = OrderSource.POS.ToString();

        [Required]
        [StringLength(50)]
        public string Status { get; set; } = OrderStatus.Pending.ToString();

        [StringLength(50)]
        public string PaymentStatus { get; set; } = GarageRadiatorERP.Api.Models.Orders.PaymentStatus.Unpaid.ToString();

        public DateTime OrderDate { get; set; } = DateTime.UtcNow;

        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalAmount { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalCost { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal Discount { get; set; } // Chiết khấu tổng đơn cho khách sỉ

        [Column(TypeName = "decimal(18,2)")]
        public decimal Profit { get; set; } // Tiền lời = Amount - Cost - Discount

        [StringLength(1000)]
        public string? Notes { get; set; } // Ghi chú đơn

        public ICollection<OrderItem> Items { get; set; } = new List<OrderItem>();
        public OnlineOrderDetails? OnlineDetails { get; set; }

        public bool IsDeleted { get; set; } = false;
    }

    public class OrderItem
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        public Guid OrderId { get; set; }
        public Order Order { get; set; } = null!;

        public Guid ProductId { get; set; }
        public Products.Product Product { get; set; } = null!;

        // Trả lời câu hỏi: Bán ra từ cái Lô nhập nào để tính FIFO?
        public Guid? InventoryBatchId { get; set; }
        public Inventory.InventoryBatch? InventoryBatch { get; set; }

        public int Quantity { get; set; }

        // Bán thiếu hàng/giao sau (Ví dụ mua 10 có 6, đang nợ 4 cái)
        public int BackorderQuantity { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal UnitPrice { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal CostPrice { get; set; } // Kế thừa từ CostPrice của Batch xuất ra
    }

    public class OnlineOrderDetails
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        public Guid OrderId { get; set; }
        public Order Order { get; set; } = null!;

        [Required]
        [StringLength(50)]
        public string Platform { get; set; } = string.Empty; // Shopee, TikTok

        [Required]
        [StringLength(100)]
        public string PlatformOrderId { get; set; } = string.Empty;

        [StringLength(200)]
        public string? BuyerName { get; set; }

        [StringLength(500)]
        public string? ShippingAddress { get; set; }

        [StringLength(100)]
        public string? CourierName { get; set; } // Tên nhà vận chuyển JS, NinjaVan, SPX

        [StringLength(100)]
        public string? ShippingCode { get; set; }

        public string? LabelUrl { get; set; } // Đường dẫn tem in 100x150

        public DateTime? WebhookReceivedAt { get; set; }
    }
}

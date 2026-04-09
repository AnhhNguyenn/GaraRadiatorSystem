using System;
using System.ComponentModel.DataAnnotations;

namespace GarageRadiatorERP.Api.Models.Finance
{
    public class Expense : GarageRadiatorERP.Api.Models.System.ISoftDeletable, GarageRadiatorERP.Api.Models.System.ITenantEntity
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        public Guid TenantId { get; set; }

        [Required]
        [StringLength(100)]
        public string Category { get; set; } = string.Empty;

        public decimal Amount { get; set; }
        public DateTime Date { get; set; } = DateTime.UtcNow;

        [StringLength(500)]
        public string? Note { get; set; }

        public bool IsDeleted { get; set; } = false;
    }

    public class ProfitReport : GarageRadiatorERP.Api.Models.System.ITenantEntity
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        public Guid TenantId { get; set; }

        public DateTime Date { get; set; }
        public decimal Revenue { get; set; }
        public decimal Cost { get; set; }
        public decimal Expense { get; set; }
        public decimal Profit { get; set; }
    }

    public class TaxProfile
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        [StringLength(50)]
        public string Type { get; set; } = "Household"; // Household, Company

        [StringLength(50)]
        public string? TaxCode { get; set; }
    }

    public class TaxRecord
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        [StringLength(50)]
        public string Period { get; set; } = string.Empty;

        public decimal VAT { get; set; }
        public decimal IncomeTax { get; set; }
        public decimal TotalTax { get; set; }
    }

    public class TaxConfiguration : GarageRadiatorERP.Api.Models.System.ITenantEntity
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        public Guid TenantId { get; set; }

        [Required]
        [StringLength(50)]
        public string BusinessModel { get; set; } = "Household";

        [Required]
        [StringLength(100)]
        public string ProductCategory { get; set; } = string.Empty;

        public decimal VatRate { get; set; } // %

        public decimal PitRate { get; set; } // %

        public decimal CitRate { get; set; } // %
    }
}

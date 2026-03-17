using System;
using System.ComponentModel.DataAnnotations;

namespace GarageRadiatorERP.Api.Models.Finance
{
    public class Expense
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        [StringLength(100)]
        public string Category { get; set; } = string.Empty;

        public decimal Amount { get; set; }
        public DateTime Date { get; set; } = DateTime.UtcNow;

        [StringLength(500)]
        public string? Note { get; set; }
    }

    public class ProfitReport
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

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
}

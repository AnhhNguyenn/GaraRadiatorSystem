using System;

namespace GarageRadiatorERP.Api.DTOs.Finance
{
    public class ExpenseDto
    {
        public Guid Id { get; set; }
        public string Category { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public DateTime Date { get; set; }
        public string? Note { get; set; }
    }

    public class CreateExpenseDto
    {
        [global::System.ComponentModel.DataAnnotations.Required]
        [global::System.ComponentModel.DataAnnotations.MaxLength(100)]
        public string Category { get; set; } = string.Empty;

        [global::System.ComponentModel.DataAnnotations.Range(0.01, double.MaxValue, ErrorMessage = "Amount must be greater than 0")]
        public decimal Amount { get; set; }

        [global::System.ComponentModel.DataAnnotations.MaxLength(2000)]
        public string? Note { get; set; }

        public DateTime? ExpenseDate { get; set; }
    }

    public class ProfitReportDto
    {
        public decimal TotalRevenue { get; set; }
        public decimal TotalCost { get; set; }
        public decimal TotalExpense { get; set; }
        public decimal NetProfit { get; set; }
    }
}

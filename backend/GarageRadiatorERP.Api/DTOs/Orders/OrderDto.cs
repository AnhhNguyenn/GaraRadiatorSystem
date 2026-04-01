using System;
using System.Collections.Generic;

namespace GarageRadiatorERP.Api.DTOs.Orders
{
    public class OrderDto
    {
        public Guid Id { get; set; }
        public string Source { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public decimal TotalAmount { get; set; }
        public decimal TotalCost { get; set; }
        public decimal Profit { get; set; }
    }

    public class CreatePOSOrderDto
    {
        public Guid? CustomerId { get; set; }

        [global::System.ComponentModel.DataAnnotations.MaxLength(2000)]
        public string? Notes { get; set; }

        [global::System.ComponentModel.DataAnnotations.Required]
        [global::System.ComponentModel.DataAnnotations.MinLength(1)]
        public List<CreateOrderItemDto> Items { get; set; } = new List<CreateOrderItemDto>();
    }

    public class CreateOrderItemDto
    {
        public Guid ProductId { get; set; }

        [global::System.ComponentModel.DataAnnotations.Range(1, 100000, ErrorMessage = "Quantity must be greater than 0")]
        public int Quantity { get; set; }

        [global::System.ComponentModel.DataAnnotations.Range(0, double.MaxValue)]
        public decimal UnitPrice { get; set; }
    }
}

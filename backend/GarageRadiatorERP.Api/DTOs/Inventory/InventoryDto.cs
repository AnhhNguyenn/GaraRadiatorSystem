using System;

namespace GarageRadiatorERP.Api.DTOs.Inventory
{
    public class WarehouseDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Address { get; set; }
    }

    public class InventoryBatchDto
    {
        public Guid Id { get; set; }
        public Guid ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public string? BinLocation { get; set; }
        public int InitialQuantity { get; set; }
        public int RemainingQuantity { get; set; }
        public decimal CostPrice { get; set; }
        public DateTime ImportDate { get; set; }
    }

    public class CreateInventoryBatchDto
    {
        public Guid ProductId { get; set; }
        public Guid? BinLocationId { get; set; }
        public string? BatchNumber { get; set; }
        public int Quantity { get; set; }
        public decimal CostPrice { get; set; }
    }
}

using System;

namespace GarageRadiatorERP.Api.DTOs.Products
{
    public class ProductDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string SKU { get; set; } = string.Empty;
        public string? Barcode { get; set; }
        public string? CategoryName { get; set; }
        public string? Brand { get; set; }
        public decimal? NetWeight { get; set; }
        public decimal? GrossWeight { get; set; }
        public string UnitOfMeasure { get; set; } = "Piece";
        public DateTime CreatedAt { get; set; }
    }

    public class CreateProductDto
    {
        public string Name { get; set; } = string.Empty;
        public string SKU { get; set; } = string.Empty;
        public string? Barcode { get; set; }
        public Guid? CategoryId { get; set; }
        public string? Brand { get; set; }
        public decimal? NetWeight { get; set; }
        public decimal? GrossWeight { get; set; }
    }
}

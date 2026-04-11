using System;

namespace GarageRadiatorERP.Api.DTOs.Products
{
    public class ProductCategoryDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
    }

    public class CreateProductCategoryDto
    {
        public string Name { get; set; } = string.Empty;
    }
}

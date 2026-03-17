using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using GarageRadiatorERP.Api.Data;
using GarageRadiatorERP.Api.Models.Products;
using GarageRadiatorERP.Api.DTOs.Products;

namespace GarageRadiatorERP.Api.Services.Products
{
    public interface IProductService
    {
        Task<IEnumerable<ProductDto>> GetAllProductsAsync();
        Task<ProductDto?> GetProductByIdAsync(Guid id);
        Task<ProductDto> CreateProductAsync(CreateProductDto createDto);
    }

    public class ProductService : IProductService
    {
        private readonly AppDbContext _context;

        public ProductService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<ProductDto>> GetAllProductsAsync()
        {
            return await _context.Products
                .Include(p => p.Category)
                .Select(p => new ProductDto
                {
                    Id = p.Id,
                    Name = p.Name,
                    SKU = p.SKU,
                    Barcode = p.Barcode,
                    CategoryName = p.Category != null ? p.Category.Name : null,
                    Brand = p.Brand,
                    NetWeight = p.NetWeight,
                    GrossWeight = p.GrossWeight,
                    UnitOfMeasure = p.UnitOfMeasure,
                    CreatedAt = p.CreatedAt
                })
                .ToListAsync();
        }

        public async Task<ProductDto?> GetProductByIdAsync(Guid id)
        {
            var p = await _context.Products
                .Include(p => p.Category)
                .FirstOrDefaultAsync(x => x.Id == id);

            if (p == null) return null;

            return new ProductDto
            {
                Id = p.Id,
                Name = p.Name,
                SKU = p.SKU,
                Barcode = p.Barcode,
                CategoryName = p.Category != null ? p.Category.Name : null,
                Brand = p.Brand,
                NetWeight = p.NetWeight,
                GrossWeight = p.GrossWeight,
                UnitOfMeasure = p.UnitOfMeasure,
                CreatedAt = p.CreatedAt
            };
        }

        public async Task<ProductDto> CreateProductAsync(CreateProductDto createDto)
        {
            var product = new Product
            {
                Name = createDto.Name,
                SKU = createDto.SKU,
                Barcode = createDto.Barcode,
                CategoryId = createDto.CategoryId,
                Brand = createDto.Brand,
                NetWeight = createDto.NetWeight,
                GrossWeight = createDto.GrossWeight,
                UnitOfMeasure = "Piece"
            };

            _context.Products.Add(product);
            await _context.SaveChangesAsync();

            return new ProductDto
            {
                Id = product.Id,
                Name = product.Name,
                SKU = product.SKU,
                Barcode = product.Barcode,
                Brand = product.Brand,
                NetWeight = product.NetWeight,
                GrossWeight = product.GrossWeight,
                UnitOfMeasure = product.UnitOfMeasure,
                CreatedAt = product.CreatedAt
            };
        }
    }
}

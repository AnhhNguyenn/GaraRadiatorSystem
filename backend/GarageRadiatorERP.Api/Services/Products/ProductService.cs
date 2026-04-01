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
        Task<GarageRadiatorERP.Api.DTOs.System.PagedResponseDto<ProductDto>> GetAllProductsAsync(int page = 1, int limit = 100, global::System.Threading.CancellationToken cancellationToken = default);
        Task<ProductDto?> GetProductByIdAsync(Guid id, global::System.Threading.CancellationToken cancellationToken = default);
        Task<ProductDto> CreateProductAsync(CreateProductDto createDto, global::System.Threading.CancellationToken cancellationToken = default);
    }

    public class ProductService : IProductService
    {
        private readonly AppDbContext _context;

        public ProductService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<GarageRadiatorERP.Api.DTOs.System.PagedResponseDto<ProductDto>> GetAllProductsAsync(int page = 1, int limit = 100, global::System.Threading.CancellationToken cancellationToken = default)
        {
            var query = _context.Products.Include(p => p.Category);

            int totalCount = await query.CountAsync(cancellationToken);

            var data = await query
                .OrderByDescending(p => p.CreatedAt) // Pagination needs OrderBy
                .Skip((page - 1) * limit)
                .Take(limit)
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
                .ToListAsync(cancellationToken);

            return new GarageRadiatorERP.Api.DTOs.System.PagedResponseDto<ProductDto>(data, totalCount, page, limit);
        }

        public async Task<ProductDto?> GetProductByIdAsync(Guid id, global::System.Threading.CancellationToken cancellationToken = default)
        {
            var p = await _context.Products
                .Include(p => p.Category)
                .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

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

        public async Task<ProductDto> CreateProductAsync(CreateProductDto createDto, global::System.Threading.CancellationToken cancellationToken = default)
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
            await _context.SaveChangesAsync(cancellationToken);

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

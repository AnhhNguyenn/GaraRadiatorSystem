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
    public class ProductService : IProductService
    {
        private readonly AppDbContext _context;
        private readonly AutoMapper.IMapper _mapper;

        public ProductService(AppDbContext context, AutoMapper.IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<GarageRadiatorERP.Api.DTOs.System.PagedResponseDto<ProductDto>> GetAllProductsAsync(int page = 1, int limit = 100, global::System.Threading.CancellationToken cancellationToken = default)
        {
            var query = _context.Products.Include(p => p.Category);
            int totalCount = await query.CountAsync(cancellationToken);

            var data = await query
                .OrderByDescending(p => p.CreatedAt) // Pagination needs OrderBy
                .Skip((page - 1) * limit)
                .Take(limit)
                .ToListAsync(cancellationToken);

            var dtos = _mapper.Map<List<ProductDto>>(data);

            return new GarageRadiatorERP.Api.DTOs.System.PagedResponseDto<ProductDto>(dtos, totalCount, page, limit);
        }

        public async Task<ProductDto?> GetProductByIdAsync(Guid id, global::System.Threading.CancellationToken cancellationToken = default)
        {
            var p = await _context.Products
                .Include(p => p.Category)
                .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

            if (p == null) return null;

            return _mapper.Map<ProductDto>(p);
        }

        public async Task<ProductDto> CreateProductAsync(CreateProductDto createDto, global::System.Threading.CancellationToken cancellationToken = default)
        {
            bool exists = await _context.Products.AnyAsync(p => p.SKU == createDto.SKU, cancellationToken);
            if (exists)
            {
                throw new ArgumentException($"Sản phẩm với SKU {createDto.SKU} đã tồn tại.");
            }

            var product = _mapper.Map<Product>(createDto);
            if (string.IsNullOrEmpty(product.UnitOfMeasure))
            {
                product.UnitOfMeasure = "Piece";
            }

            _context.Products.Add(product);
            await _context.SaveChangesAsync(cancellationToken);

            return _mapper.Map<ProductDto>(product);
        }
    }
}

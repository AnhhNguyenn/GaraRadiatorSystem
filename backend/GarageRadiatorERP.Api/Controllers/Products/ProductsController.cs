using Microsoft.AspNetCore.Mvc;
using GarageRadiatorERP.Api.Services.Products;
using GarageRadiatorERP.Api.DTOs.Products;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace GarageRadiatorERP.Api.Controllers.Products
{
    [ApiController]
    [Route("api/v1/[controller]")] // Fix API Versioning
    public class ProductsController : ControllerBase
    {
        private readonly IProductService _productService;

        public ProductsController(IProductService productService)
        {
            _productService = productService;
        }

        [HttpGet]
        public async Task<ActionResult<GarageRadiatorERP.Api.DTOs.System.PagedResponseDto<ProductDto>>> GetProducts([FromQuery] int page = 1, [FromQuery] int limit = 100, System.Threading.CancellationToken cancellationToken = default)
        {
            var products = await _productService.GetAllProductsAsync(page, limit, cancellationToken);
            return Ok(products);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ProductDto>> GetProduct(Guid id, System.Threading.CancellationToken cancellationToken)
        {
            var product = await _productService.GetProductByIdAsync(id, cancellationToken);
            if (product == null)
            {
                return NotFound();
            }
            return Ok(product);
        }

        [HttpPost]
        public async Task<ActionResult<ProductDto>> CreateProduct(CreateProductDto createDto)
        {
            var product = await _productService.CreateProductAsync(createDto);
            return CreatedAtAction(nameof(GetProduct), new { id = product.Id }, product);
        }

        [HttpGet("categories")]
        public async Task<ActionResult<IEnumerable<string>>> GetCategories([FromServices] GarageRadiatorERP.Api.Data.AppDbContext dbContext, System.Threading.CancellationToken cancellationToken)
        {
            // Fallback MVP: Truy vấn DISTINCT CategoryName từ bảng Products
            // Nếu có bảng ProductCategory, có thể query từ đó.
            var categories = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.ToListAsync(
                System.Linq.Queryable.Distinct(
                    System.Linq.Queryable.Where(
                        System.Linq.Queryable.Select(dbContext.Products, p => p.Category != null ? p.Category.Name : null),
                        c => c != null
                    )
                ),
                cancellationToken
            );

            // Bổ sung thêm các danh mục mặc định cho MVP nếu rỗng
            if (categories.Count == 0)
            {
                categories.AddRange(new[] { "Két nước", "Nắp két nước", "Ống nước", "Quạt làm mát" });
            }

            return Ok(categories);
        }
    }
}

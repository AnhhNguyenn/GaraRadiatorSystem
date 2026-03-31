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
        public async Task<ActionResult<IEnumerable<ProductDto>>> GetProducts([FromQuery] int page = 1, [FromQuery] int limit = 100, System.Threading.CancellationToken cancellationToken = default)
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
    }
}

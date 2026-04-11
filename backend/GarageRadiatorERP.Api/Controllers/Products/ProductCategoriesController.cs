using Microsoft.AspNetCore.Mvc;
using GarageRadiatorERP.Api.Data;
using GarageRadiatorERP.Api.Models.Products;
using GarageRadiatorERP.Api.DTOs.Products;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using System.Linq;

namespace GarageRadiatorERP.Api.Controllers.Products
{
    [ApiController]
    [Route("api/v1/[controller]")]
    public class ProductCategoriesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ProductCategoriesController(AppDbContext context)
        {
            _context = context;
        }

        [HttpPost]
        public async Task<ActionResult<ProductCategoryDto>> CreateCategory(CreateProductCategoryDto createDto)
        {
            if (string.IsNullOrWhiteSpace(createDto.Name))
            {
                return BadRequest("Category name is required.");
            }

            var category = new ProductCategory
            {
                Name = createDto.Name
            };

            _context.ProductCategories.Add(category);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetCategory), new { id = category.Id }, new ProductCategoryDto
            {
                Id = category.Id,
                Name = category.Name
            });
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ProductCategoryDto>> GetCategory(global::System.Guid id)
        {
            var category = await _context.ProductCategories.FindAsync(id);

            if (category == null)
            {
                return NotFound();
            }

            return Ok(new ProductCategoryDto
            {
                Id = category.Id,
                Name = category.Name
            });
        }
    }
}

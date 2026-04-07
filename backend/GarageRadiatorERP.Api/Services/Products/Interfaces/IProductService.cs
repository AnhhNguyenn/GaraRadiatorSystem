using System;
using System.Threading.Tasks;
using GarageRadiatorERP.Api.DTOs.Products;

namespace GarageRadiatorERP.Api.Services.Products
{
    public interface IProductService
    {
        Task<GarageRadiatorERP.Api.DTOs.System.PagedResponseDto<ProductDto>> GetAllProductsAsync(int page = 1, int limit = 100, global::System.Threading.CancellationToken cancellationToken = default);
        Task<ProductDto?> GetProductByIdAsync(Guid id, global::System.Threading.CancellationToken cancellationToken = default);
        Task<ProductDto> CreateProductAsync(CreateProductDto createDto, global::System.Threading.CancellationToken cancellationToken = default);
    }
}

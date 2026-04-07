using AutoMapper;
using GarageRadiatorERP.Api.Models.Products;
using GarageRadiatorERP.Api.DTOs.Products;
using GarageRadiatorERP.Api.Models.Inventory;
using GarageRadiatorERP.Api.DTOs.Inventory;
using GarageRadiatorERP.Api.Models.Orders;
using GarageRadiatorERP.Api.DTOs.Orders;

namespace GarageRadiatorERP.Api.Mapping
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            // Product Mappings
            CreateMap<Product, ProductDto>()
                .ForMember(dest => dest.CategoryName, opt => opt.MapFrom(src => src.Category != null ? src.Category.Name : null));
            CreateMap<CreateProductDto, Product>();

            // Inventory Mappings
            CreateMap<InventoryBatch, InventoryBatchDto>()
                .ForMember(dest => dest.ProductName, opt => opt.MapFrom(src => src.Product != null ? src.Product.Name : null))
                .ForMember(dest => dest.BinLocation, opt => opt.MapFrom(src => src.BinLocation != null ? src.BinLocation.Barcode : "N/A"));

            // Order Mappings
            CreateMap<Order, OrderDto>()
                .ForMember(dest => dest.CustomerName, opt => opt.MapFrom(src => src.Customer != null ? src.Customer.Name : null))
                .ForMember(dest => dest.ShippingCarrier, opt => opt.MapFrom(src => src.OnlineDetails != null ? src.OnlineDetails.CourierName : null))
                .ForMember(dest => dest.TrackingCode, opt => opt.MapFrom(src => src.OnlineDetails != null ? src.OnlineDetails.ShippingCode : null))
                .ForMember(dest => dest.LabelUrl, opt => opt.MapFrom(src => src.OnlineDetails != null ? src.OnlineDetails.LabelUrl : null));
            CreateMap<PurchaseOrder, PurchaseOrderDto>();
        }
    }
}

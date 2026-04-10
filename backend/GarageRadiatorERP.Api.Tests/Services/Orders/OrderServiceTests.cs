using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Moq;
using Xunit;
using GarageRadiatorERP.Api.Data;
using GarageRadiatorERP.Api.DTOs.Orders;
using GarageRadiatorERP.Api.DTOs.System;
using GarageRadiatorERP.Api.Models.Orders;
using GarageRadiatorERP.Api.Services.Orders;
using GarageRadiatorERP.Api.Services.System;
using GarageRadiatorERP.Api.Services.Platforms;
using Microsoft.AspNetCore.SignalR;

namespace GarageRadiatorERP.Api.Tests.Services.Orders
{
    public class OrderServiceTests
    {
        private readonly Mock<IHubContext<GarageRadiatorERP.Api.Hubs.ChatHub>> _mockHubContext;
        private readonly Mock<ITenantProvider> _mockTenantProvider;
        private readonly Mock<IConfiguration> _mockConfiguration;
        private readonly Mock<ISystemConfigurationService> _mockConfigService;
        private readonly Mock<IMapper> _mockMapper;
        private readonly Mock<IPlatformService> _mockPlatformService;

        public OrderServiceTests()
        {
            _mockHubContext = new Mock<IHubContext<GarageRadiatorERP.Api.Hubs.ChatHub>>();
            _mockTenantProvider = new Mock<ITenantProvider>();
            _mockTenantProvider.Setup(t => t.GetTenantId()).Returns(Guid.NewGuid());
            _mockConfiguration = new Mock<IConfiguration>();
            _mockConfigService = new Mock<ISystemConfigurationService>();
            _mockMapper = new Mock<IMapper>();
            _mockPlatformService = new Mock<IPlatformService>();
        }

        private AppDbContext CreateDbContext()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            return new AppDbContext(options, _mockTenantProvider.Object);
        }

        private OrderService CreateService(AppDbContext context)
        {
            return new OrderService(
                context,
                _mockHubContext.Object,
                _mockTenantProvider.Object,
                _mockConfiguration.Object,
                _mockConfigService.Object,
                _mockMapper.Object,
                _mockPlatformService.Object
            );
        }

        [Fact]
        public async Task GetOrdersAsync_ReturnsPagedResponse_DefaultPagination()
        {
            // Arrange
            using var context = CreateDbContext();

            // Seed 5 orders with different dates
            var baseDate = DateTime.UtcNow;
            for (int i = 0; i < 5; i++)
            {
                context.Orders.Add(new Order
                {
                    Id = Guid.NewGuid(),
                    OrderDate = baseDate.AddDays(i),
                    Source = "POS",
                    Status = "Completed"
                });
            }
            await context.SaveChangesAsync();

            var service = CreateService(context);

            _mockMapper.Setup(m => m.Map<List<OrderDto>>(It.IsAny<List<Order>>()))
                .Returns((List<Order> source) => source.Select(o => new OrderDto { Id = o.Id, OrderDate = o.OrderDate }).ToList());

            // Act
            var result = await service.GetOrdersAsync();

            // Assert
            Assert.NotNull(result);
            Assert.Equal(5, result.TotalCount);
            Assert.Equal(5, result.Data.Count());
            Assert.Equal(1, result.CurrentPage);

            // Verify descending order
            var dates = result.Data.Select(d => d.OrderDate).ToList();
            Assert.True(dates[0] > dates[1]);
            Assert.True(dates[1] > dates[2]);
        }

        [Fact]
        public async Task GetOrdersAsync_ReturnsPagedResponse_CustomPagination()
        {
            // Arrange
            using var context = CreateDbContext();

            var baseDate = DateTime.UtcNow;
            for (int i = 0; i < 5; i++)
            {
                context.Orders.Add(new Order
                {
                    Id = Guid.NewGuid(),
                    OrderDate = baseDate.AddDays(i),
                    Source = "POS",
                    Status = "Completed"
                });
            }
            await context.SaveChangesAsync();

            var service = CreateService(context);

            _mockMapper.Setup(m => m.Map<List<OrderDto>>(It.IsAny<List<Order>>()))
                .Returns((List<Order> source) => source.Select(o => new OrderDto { Id = o.Id, OrderDate = o.OrderDate }).ToList());

            // Act: request page 2, limit 2
            var result = await service.GetOrdersAsync(page: 2, limit: 2);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(5, result.TotalCount);
            Assert.Equal(2, result.Data.Count()); // Items on current page
            Assert.Equal(2, result.CurrentPage);
            Assert.Equal(3, result.TotalPages); // 5 items total, 2 per page -> 3 pages

            // The items should be the 3rd and 4th items when ordered descending by date
            // The dates inserted were: +0, +1, +2, +3, +4
            // Ordered descending: +4, +3, +2, +1, +0
            // Page 1 (limit 2): +4, +3
            // Page 2 (limit 2): +2, +1
            var dates = result.Data.Select(d => d.OrderDate).ToList();
            Assert.Equal(baseDate.AddDays(2).Date, dates[0].Date); // Check by date to avoid precision issues
            Assert.Equal(baseDate.AddDays(1).Date, dates[1].Date);
        }

        [Fact]
        public async Task GetOrdersAsync_ReturnsEmptyList_WhenNoOrders()
        {
            // Arrange
            using var context = CreateDbContext(); // Empty context
            var service = CreateService(context);

            _mockMapper.Setup(m => m.Map<List<OrderDto>>(It.IsAny<List<Order>>()))
                .Returns(new List<OrderDto>());

            // Act
            var result = await service.GetOrdersAsync();

            // Assert
            Assert.NotNull(result);
            Assert.Equal(0, result.TotalCount);
            Assert.Empty(result.Data);
            Assert.Equal(1, result.CurrentPage);
            Assert.Equal(0, result.TotalPages);
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Moq;
using Xunit;
using GarageRadiatorERP.Api.Data;
using GarageRadiatorERP.Api.Models.Orders;
using GarageRadiatorERP.Api.Models.Inventory;
using GarageRadiatorERP.Api.Models.System;
using GarageRadiatorERP.Api.Models.Products;
using GarageRadiatorERP.Api.Models.Platforms;
using GarageRadiatorERP.Api.Models.Finance;
using GarageRadiatorERP.Api.DTOs.Orders;
using GarageRadiatorERP.Api.Services.Orders;
using Microsoft.AspNetCore.SignalR;
using GarageRadiatorERP.Api.Services.System;
using Microsoft.Extensions.Configuration;
using AutoMapper;
using GarageRadiatorERP.Api.Services.Platforms;

namespace GarageRadiatorERP.Api.Tests.Services.Orders
{
    public class OrderServiceTests : IDisposable
    {
        private readonly DbContextOptions<AppDbContext> _options;

        public OrderServiceTests()
        {
            _options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .ConfigureWarnings(w => w.Ignore(InMemoryEventId.TransactionIgnoredWarning))
                .Options;
        }

        public void Dispose()
        {
        }

        private AppDbContext CreateContext(ITenantProvider tenantProvider)
        {
            return new AppDbContext(_options, tenantProvider);
        }

        [Fact]
        public async Task CreatePOSOrderAsync_WithValidData_ShouldCreateOrderSuccessfully()
        {
            // Arrange
            var tenantId = Guid.NewGuid();
            var customerId = Guid.NewGuid();
            var productId = Guid.NewGuid();
            var batchId = Guid.NewGuid();
            var categoryId = Guid.NewGuid();

            var mockTenantProvider = new Mock<ITenantProvider>();
            mockTenantProvider.Setup(t => t.GetTenantId()).Returns(tenantId);

            using (var context = CreateContext(mockTenantProvider.Object))
            {
                var customer = new Customer { Id = customerId, Name = "Test Customer", Phone = "123", TenantId = tenantId };
                var category = new ProductCategory { Id = categoryId, Name = "Electronics", TenantId = tenantId };
                var product = new Product { Id = productId, SKU = "P1", Name = "Product 1", StandardCost = 100, TenantId = tenantId, CategoryId = categoryId };
                var batch = new InventoryBatch { Id = batchId, ProductId = productId, RemainingQuantity = 10, CostPrice = 50, ImportDate = DateTime.UtcNow, TenantId = tenantId, RowVersion = new byte[8] };

                context.Customers.Add(customer);
                context.ProductCategories.Add(category);
                context.Products.Add(product);
                context.InventoryBatches.Add(batch);

                context.PlatformStores.Add(new PlatformStore { Id = Guid.NewGuid(), TenantId = tenantId, PlatformName = "Store", StoreName = "S1", BusinessModel = "Enterprise" });
                context.TaxConfigurations.Add(new TaxConfiguration { Id = Guid.NewGuid(), BusinessModel = "Enterprise", ProductCategory = "Electronics", VatRate = 10, PitRate = 0, TenantId = tenantId });

                await context.SaveChangesAsync();
            }

            var mockHubContext = new Mock<IHubContext<GarageRadiatorERP.Api.Hubs.ChatHub>>();
            var mockClients = new Mock<IHubClients>();
            var mockGroup = new Mock<IClientProxy>();
            mockHubContext.Setup(h => h.Clients).Returns(mockClients.Object);
            mockClients.Setup(c => c.Group(It.IsAny<string>())).Returns(mockGroup.Object);

            var mockConfig = new Mock<IConfiguration>();
            var mockConfigService = new Mock<ISystemConfigurationService>();
            mockConfigService.Setup(c => c.GetValueAsync<int>("Inventory.DefaultMinStockAlert")).ReturnsAsync(5);
            mockConfigService.Setup(c => c.GetValueAsync<decimal>("Finance.DefaultVAT")).ReturnsAsync(10);
            mockConfigService.Setup(c => c.GetValueAsync<int>("Inventory.LowStockSyncPlatformValue")).ReturnsAsync(0);

            var mockMapper = new Mock<IMapper>();
            var mockPlatformService = new Mock<IPlatformService>();

            var dto = new CreatePOSOrderDto
            {
                CustomerId = customerId,
                Notes = "Test order",
                Items = new List<CreateOrderItemDto>
                {
                    new CreateOrderItemDto { ProductId = productId, Quantity = 2, UnitPrice = 150 }
                }
            };

            using (var context = CreateContext(mockTenantProvider.Object))
            {
                var service = new OrderService(
                    context,
                    mockHubContext.Object,
                    mockTenantProvider.Object,
                    mockConfig.Object,
                    mockConfigService.Object,
                    mockMapper.Object,
                    mockPlatformService.Object
                );

                // Act
                var result = await service.CreatePOSOrderAsync(dto);

                // Assert
                Assert.NotNull(result);
                Assert.Equal("Completed", result.Status);
                Assert.NotEqual(Guid.Empty, result.Id);

                var orderInDb = await context.Orders.Include(o => o.Items).FirstOrDefaultAsync(o => o.Id == result.Id);
                Assert.NotNull(orderInDb);
                Assert.Equal(customerId, orderInDb.CustomerId);
                Assert.Single(orderInDb.Items);
                Assert.Equal(2, orderInDb.Items.First().Quantity);

                Assert.Equal(330, orderInDb.TotalAmount);
                Assert.Equal(100, orderInDb.TotalCost);

                var batchInDb = await context.InventoryBatches.FindAsync(batchId);
                Assert.Equal(8, batchInDb.RemainingQuantity);

                var txInDb = await context.InventoryTransactions.FirstOrDefaultAsync(t => t.OrderId == result.Id);
                Assert.NotNull(txInDb);
                Assert.Equal(-2, txInDb.QuantityChange);
            }
        }

        [Fact]
        public async Task CreatePOSOrderAsync_WithNegativeQuantity_ShouldThrowArgumentException()
        {
            var tenantId = Guid.NewGuid();
            var productId = Guid.NewGuid();
            var mockTenantProvider = new Mock<ITenantProvider>();
            mockTenantProvider.Setup(t => t.GetTenantId()).Returns(tenantId);
            var mockHubContext = new Mock<IHubContext<GarageRadiatorERP.Api.Hubs.ChatHub>>();
            var mockConfig = new Mock<IConfiguration>();
            var mockConfigService = new Mock<ISystemConfigurationService>();
            var mockMapper = new Mock<IMapper>();
            var mockPlatformService = new Mock<IPlatformService>();

            using (var context = CreateContext(mockTenantProvider.Object))
            {
                context.Products.Add(new Product { Id = productId, SKU = "P3", Name = "Product 3", StandardCost = 100, TenantId = tenantId });
                await context.SaveChangesAsync();

                var service = new OrderService(
                    context, mockHubContext.Object, mockTenantProvider.Object,
                    mockConfig.Object, mockConfigService.Object, mockMapper.Object, mockPlatformService.Object
                );

                var dto = new CreatePOSOrderDto
                {
                    Items = new List<CreateOrderItemDto>
                    {
                        new CreateOrderItemDto { ProductId = productId, Quantity = -1, UnitPrice = 150 }
                    }
                };

                // Act & Assert
                var ex = await Assert.ThrowsAsync<ArgumentException>(() => service.CreatePOSOrderAsync(dto));
                Assert.Contains("phải lớn hơn 0", ex.Message);
            }
        }

        [Fact]
        public async Task CreatePOSOrderAsync_InvalidCustomer_ShouldThrowArgumentException()
        {
            var tenantId = Guid.NewGuid();
            var mockTenantProvider = new Mock<ITenantProvider>();
            mockTenantProvider.Setup(t => t.GetTenantId()).Returns(tenantId);
            var mockHubContext = new Mock<IHubContext<GarageRadiatorERP.Api.Hubs.ChatHub>>();
            var mockConfig = new Mock<IConfiguration>();
            var mockConfigService = new Mock<ISystemConfigurationService>();
            var mockMapper = new Mock<IMapper>();
            var mockPlatformService = new Mock<IPlatformService>();

            using (var context = CreateContext(mockTenantProvider.Object))
            {
                var service = new OrderService(
                    context, mockHubContext.Object, mockTenantProvider.Object,
                    mockConfig.Object, mockConfigService.Object, mockMapper.Object, mockPlatformService.Object
                );

                var dto = new CreatePOSOrderDto
                {
                    CustomerId = Guid.NewGuid(), // Not in DB
                    Items = new List<CreateOrderItemDto>
                    {
                        new CreateOrderItemDto { ProductId = Guid.NewGuid(), Quantity = 1, UnitPrice = 150 }
                    }
                };

                // Act & Assert
                var ex = await Assert.ThrowsAsync<ArgumentException>(() => service.CreatePOSOrderAsync(dto));
                Assert.Contains("Khách hàng không tồn tại", ex.Message);
            }
        }

        [Fact]
        public async Task CreatePOSOrderAsync_BackorderScenario_ShouldCreateNegativeTransaction()
        {
            // Arrange
            var tenantId = Guid.NewGuid();
            var productId = Guid.NewGuid();

            var mockTenantProvider = new Mock<ITenantProvider>();
            mockTenantProvider.Setup(t => t.GetTenantId()).Returns(tenantId);

            using (var context = CreateContext(mockTenantProvider.Object))
            {
                var product = new Product { Id = productId, SKU = "P2", Name = "Product 2", StandardCost = 80, TenantId = tenantId };
                context.Products.Add(product);
                // Intentionally NO batches created to force backorder
                await context.SaveChangesAsync();
            }

            var mockHubContext = new Mock<IHubContext<GarageRadiatorERP.Api.Hubs.ChatHub>>();
            var mockClients = new Mock<IHubClients>();
            var mockGroup = new Mock<IClientProxy>();
            mockHubContext.Setup(h => h.Clients).Returns(mockClients.Object);
            mockClients.Setup(c => c.Group(It.IsAny<string>())).Returns(mockGroup.Object);

            var mockConfig = new Mock<IConfiguration>();
            var mockConfigService = new Mock<ISystemConfigurationService>();
            mockConfigService.Setup(c => c.GetValueAsync<int>("Inventory.DefaultMinStockAlert")).ReturnsAsync(5);
            mockConfigService.Setup(c => c.GetValueAsync<decimal>("Finance.DefaultVAT")).ReturnsAsync(10);
            mockConfigService.Setup(c => c.GetValueAsync<int>("Inventory.LowStockSyncPlatformValue")).ReturnsAsync(0);

            var mockMapper = new Mock<IMapper>();
            var mockPlatformService = new Mock<IPlatformService>();

            var dto = new CreatePOSOrderDto
            {
                Items = new List<CreateOrderItemDto>
                {
                    new CreateOrderItemDto { ProductId = productId, Quantity = 5, UnitPrice = 200 }
                }
            };

            using (var context = CreateContext(mockTenantProvider.Object))
            {
                var service = new OrderService(
                    context, mockHubContext.Object, mockTenantProvider.Object,
                    mockConfig.Object, mockConfigService.Object, mockMapper.Object, mockPlatformService.Object
                );

                // Act
                var result = await service.CreatePOSOrderAsync(dto);

                // Assert
                Assert.NotNull(result);

                var orderInDb = await context.Orders.Include(o => o.Items).FirstOrDefaultAsync(o => o.Id == result.Id);
                Assert.NotNull(orderInDb);
                Assert.Single(orderInDb.Items);

                var item = orderInDb.Items.First();
                Assert.Equal(5, item.Quantity);
                Assert.Equal(5, item.BackorderQuantity);
                Assert.Equal(80, item.CostPrice); // Fallback to StandardCost

                var txs = await context.InventoryTransactions.Where(t => t.OrderId == result.Id).ToListAsync();
                Assert.Single(txs);
                Assert.Equal(-5, txs[0].QuantityChange);
                Assert.Null(txs[0].BatchId);
                Assert.Equal("backorder", txs[0].Type);
            }
        }
    }
}

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
        }
    }
}

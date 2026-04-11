using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using GarageRadiatorERP.Api.Data;
using GarageRadiatorERP.Api.Models.Orders;
using GarageRadiatorERP.Api.Services.Orders;
using GarageRadiatorERP.Api.Services.System;
using GarageRadiatorERP.Api.Services.Platforms;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Moq;
using Xunit;
using GarageRadiatorERP.Api.Hubs;
using AutoMapper;
using System.Linq;

namespace GarageRadiatorERP.Tests.Services.Orders
{
    public class MockAppDbContext : AppDbContext
    {
        public bool ThrowConcurrencyException { get; set; }

        public MockAppDbContext(DbContextOptions<AppDbContext> options, ITenantProvider tenantProvider)
            : base(options, tenantProvider)
        {
        }

        public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            if (ThrowConcurrencyException)
            {
                throw new DbUpdateConcurrencyException("Simulated Concurrency Exception");
            }
            return base.SaveChangesAsync(cancellationToken);
        }
    }

    public class OrderServiceTests
    {
        [Fact]
        public async Task CancelOrderAsync_DbUpdateConcurrencyException_RollsbackAndThrowsConcurrencyException()
        {
            // Arrange
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseSqlite("DataSource=:memory:")
                .Options;

            var mockTenantProvider = new Mock<ITenantProvider>();
            mockTenantProvider.Setup(t => t.GetTenantId()).Returns(Guid.NewGuid());

            using var context = new MockAppDbContext(options, mockTenantProvider.Object);
            await context.Database.OpenConnectionAsync();
            await context.Database.EnsureCreatedAsync();

            var orderId = Guid.NewGuid();
            var order = new Order
            {
                Id = orderId,
                Status = OrderStatus.Completed.ToString(),
                Source = "POS",
                PaymentStatus = "Paid",
                Items = new List<OrderItem>()
            };
            context.Orders.Add(order);
            await context.SaveChangesAsync();

            var mockHubContext = new Mock<IHubContext<ChatHub>>();
            var mockConfig = new Mock<IConfiguration>();
            var mockSystemConfig = new Mock<ISystemConfigurationService>();
            var mockMapper = new Mock<IMapper>();
            var mockPlatformService = new Mock<IPlatformService>();

            var service = new OrderService(
                context,
                mockHubContext.Object,
                mockTenantProvider.Object,
                mockConfig.Object,
                mockSystemConfig.Object,
                mockMapper.Object,
                mockPlatformService.Object
            );

            // Act
            context.ThrowConcurrencyException = true; // Trigger the exception on the next SaveChangesAsync

            // Assert
            var ex = await Assert.ThrowsAsync<Exception>(() => service.CancelOrderAsync(orderId, "Customer request"));
            Assert.Equal("Quá nhiều giao dịch đồng thời, vui lòng thử lại sau (Concurrency Conflict).", ex.Message);

            context.ThrowConcurrencyException = false;
            var reloadedOrder = await context.Orders.FirstOrDefaultAsync(o => o.Id == orderId);
            if (reloadedOrder != null) {
                await context.Entry(reloadedOrder).ReloadAsync();
                Assert.Equal(OrderStatus.Completed.ToString(), reloadedOrder.Status);
            }
        }
    }
}

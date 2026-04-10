using System.Threading;
using System.Threading.Tasks;
using System.Collections.Generic;
using GarageRadiatorERP.Api.Controllers.Orders;
using GarageRadiatorERP.Api.DTOs.System;
using GarageRadiatorERP.Api.DTOs.Orders;
using GarageRadiatorERP.Api.Services.Orders;
using Microsoft.AspNetCore.Mvc;
using Moq;
using Xunit;

namespace GarageRadiatorERP.Tests.Controllers.Orders
{
    public class OrdersControllerTests
    {
        private readonly Mock<IOrderService> _mockOrderService;
        private readonly OrdersController _controller;

        public OrdersControllerTests()
        {
            _mockOrderService = new Mock<IOrderService>();
            _controller = new OrdersController(_mockOrderService.Object);
        }

        [Fact]
        public async Task GetOrders_ReturnsOkResult_WithPagedResponse()
        {
            // Arrange
            int page = 1;
            int limit = 100;
            var cancellationToken = new CancellationToken();
            var expectedResponse = new PagedResponseDto<OrderDto>(
                new List<OrderDto>(), 0, page, limit
            );

            _mockOrderService
                .Setup(s => s.GetOrdersAsync(page, limit, cancellationToken))
                .ReturnsAsync(expectedResponse);

            // Act
            var result = await _controller.GetOrders(page, limit, cancellationToken);

            // Assert
            var actionResult = Assert.IsType<ActionResult<PagedResponseDto<OrderDto>>>(result);
            var okResult = Assert.IsType<OkObjectResult>(actionResult.Result);
            var returnValue = Assert.IsType<PagedResponseDto<OrderDto>>(okResult.Value);
            Assert.Equal(expectedResponse, returnValue);
            _mockOrderService.Verify(s => s.GetOrdersAsync(page, limit, cancellationToken), Times.Once);
        }
    }
}

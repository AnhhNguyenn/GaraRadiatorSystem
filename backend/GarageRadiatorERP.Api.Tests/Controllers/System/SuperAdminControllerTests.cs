using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using GarageRadiatorERP.Api.Controllers.System;
using GarageRadiatorERP.Api.Data;
using GarageRadiatorERP.Api.Models.Platforms;
using GarageRadiatorERP.Api.Models.System;
using GarageRadiatorERP.Api.Services.System;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace GarageRadiatorERP.Api.Tests.Controllers.System
{
    public class SuperAdminControllerTests
    {
        private readonly AppDbContext _dbContext;
        private readonly Mock<UserManager<ApplicationUser>> _mockUserManager;
        private readonly Mock<IConfiguration> _mockConfiguration;
        private readonly Mock<ISystemConfigurationService> _mockConfigService;
        private readonly Mock<ITenantProvider> _mockTenantProvider;
        private readonly SuperAdminController _controller;

        public SuperAdminControllerTests()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .ConfigureWarnings(w => w.Ignore(InMemoryEventId.TransactionIgnoredWarning))
                .Options;

            _mockTenantProvider = new Mock<ITenantProvider>();
            // To fix Nullable object must have a value on Global Query Filters when no tenant is set
            // The query filter has 'tenantProperty == _tenantProvider.GetTenantId().Value'
            // So we need to ignore query filters when querying or set a dummy tenant id for the test
            _mockTenantProvider.Setup(t => t.GetTenantId()).Returns(Guid.Empty);

            _dbContext = new AppDbContext(options, _mockTenantProvider.Object);

            var store = new Mock<IUserStore<ApplicationUser>>();
            var optionsAccessor = new Mock<IOptions<IdentityOptions>>();
            var passwordHasher = new Mock<IPasswordHasher<ApplicationUser>>();
            var userValidators = new List<IUserValidator<ApplicationUser>>();
            var passwordValidators = new List<IPasswordValidator<ApplicationUser>>();
            var keyNormalizer = new Mock<ILookupNormalizer>();
            var errors = new Mock<IdentityErrorDescriber>();
            var services = new Mock<IServiceProvider>();
            var logger = new Mock<ILogger<UserManager<ApplicationUser>>>();

            _mockUserManager = new Mock<UserManager<ApplicationUser>>(
                store.Object,
                optionsAccessor.Object,
                passwordHasher.Object,
                userValidators,
                passwordValidators,
                keyNormalizer.Object,
                errors.Object,
                services.Object,
                logger.Object);

            _mockConfiguration = new Mock<IConfiguration>();
            _mockConfigService = new Mock<ISystemConfigurationService>();

            _controller = new SuperAdminController(_dbContext, _mockUserManager.Object, _mockConfiguration.Object, _mockConfigService.Object);
        }

        [Fact]
        public async Task OnboardTenant_MissingEmail_ReturnsBadRequest()
        {
            var request = new SuperAdminController.OnboardTenantRequest
            {
                StoreName = "Test Store",
                OwnerEmail = ""
            };

            var result = await _controller.OnboardTenant(request);

            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Equal("Email is required", badRequestResult.Value);
        }

        [Fact]
        public async Task OnboardTenant_EmailAlreadyExists_ReturnsBadRequest()
        {
            var request = new SuperAdminController.OnboardTenantRequest
            {
                StoreName = "Test Store",
                OwnerEmail = "test@example.com"
            };

            _mockUserManager.Setup(m => m.FindByEmailAsync(request.OwnerEmail))
                .ReturnsAsync(new ApplicationUser());

            var result = await _controller.OnboardTenant(request);

            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Equal("Email is already registered", badRequestResult.Value);
        }

        [Fact]
        public async Task OnboardTenant_CreateUserFails_ReturnsBadRequestAndRollbacks()
        {
            var request = new SuperAdminController.OnboardTenantRequest
            {
                StoreName = "Test Store",
                OwnerEmail = "test@example.com",
                OwnerFullName = "Test User",
                PlanName = "Basic",
                DurationMonths = 12,
                BusinessModel = "Household",
                TaxMethod = "Direct"
            };

            _mockUserManager.Setup(m => m.FindByEmailAsync(request.OwnerEmail))
                .ReturnsAsync((ApplicationUser?)null);

            var identityResult = IdentityResult.Failed(new IdentityError { Description = "Password too weak" });

            _mockUserManager.Setup(m => m.CreateAsync(It.IsAny<ApplicationUser>(), It.IsAny<string>()))
                .ReturnsAsync(identityResult);

            var result = await _controller.OnboardTenant(request);

            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            var errors = Assert.IsAssignableFrom<IEnumerable<IdentityError>>(badRequestResult.Value);
            Assert.Contains(errors, e => e.Description == "Password too weak");
        }

        [Fact]
        public async Task OnboardTenant_Success_CreatesTenantAndUser()
        {
            var request = new SuperAdminController.OnboardTenantRequest
            {
                StoreName = "Test Store",
                OwnerEmail = "test@example.com",
                OwnerFullName = "Test User",
                PlanName = "Enterprise",
                DurationMonths = 24,
                BusinessModel = "Corporate",
                TaxMethod = "Invoice"
            };

            _mockUserManager.Setup(m => m.FindByEmailAsync(request.OwnerEmail))
                .ReturnsAsync((ApplicationUser?)null);

            _mockUserManager.Setup(m => m.CreateAsync(It.IsAny<ApplicationUser>(), It.IsAny<string>()))
                .ReturnsAsync(IdentityResult.Success);

            _mockUserManager.Setup(m => m.AddToRoleAsync(It.IsAny<ApplicationUser>(), "TenantAdmin"))
                .ReturnsAsync(IdentityResult.Success);

            var result = await _controller.OnboardTenant(request);

            var okResult = Assert.IsType<OkObjectResult>(result);

            // Verify database records
            var tenant = await _dbContext.PlatformStores.IgnoreQueryFilters().FirstOrDefaultAsync(t => t.StoreName == "Test Store");
            Assert.NotNull(tenant);
            Assert.Equal("ERP", tenant.PlatformName);
            Assert.Equal("Corporate", tenant.BusinessModel);
            Assert.Equal("Invoice", tenant.TaxMethod);
            Assert.True(tenant.IsActive);

            var subscription = await _dbContext.TenantSubscriptions.IgnoreQueryFilters().FirstOrDefaultAsync(s => s.TenantId == tenant.Id);
            Assert.NotNull(subscription);
            Assert.Equal("Enterprise", subscription.PlanName);
            Assert.Equal(999, subscription.MaxUsers);
            Assert.True(subscription.IsActive);

            // Verify UserManager calls
            _mockUserManager.Verify(m => m.CreateAsync(It.Is<ApplicationUser>(u =>
                u.Email == "test@example.com" &&
                u.FullName == "Test User" &&
                u.TenantId == tenant.Id &&
                u.EmailConfirmed == true
            ), It.IsAny<string>()), Times.Once);

            _mockUserManager.Verify(m => m.AddToRoleAsync(It.IsAny<ApplicationUser>(), "TenantAdmin"), Times.Once);
        }
    }
}

using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using GarageRadiatorERP.Api.Models.System;

namespace GarageRadiatorERP.Api.Data
{
    public static class DataSeeder
    {
        public static async Task InitializeAsync(IServiceProvider serviceProvider)
        {
            var roleManager = serviceProvider.GetRequiredService<RoleManager<ApplicationRole>>();
            var userManager = serviceProvider.GetRequiredService<UserManager<ApplicationUser>>();
            var configuration = serviceProvider.GetRequiredService<IConfiguration>();

            string[] roles = new[] { "SuperAdmin", "TenantAdmin", "Staff" };
            foreach (var role in roles)
            {
                if (!await roleManager.RoleExistsAsync(role))
                {
                    await roleManager.CreateAsync(new ApplicationRole { Name = role, Description = $"System {role} Role" });
                }
            }

            var dbContext = serviceProvider.GetRequiredService<AppDbContext>();

            bool settingsExist = false;
            try { settingsExist = await dbContext.SystemSettings.IgnoreQueryFilters().AnyAsync(); } catch { }

            if (!settingsExist)
            {
                var defaultSettings = new[]
                {
                    new SystemSetting { SettingKey = "Finance.DefaultVAT", SettingValue = "10", Description = "Default VAT Rate (%)" },
                    new SystemSetting { SettingKey = "Finance.MaxPlatformFeeAlert", SettingValue = "8", Description = "Alert if platform fee exceeds (%)" },
                    new SystemSetting { SettingKey = "Inventory.DefaultMinStockAlert", SettingValue = "5", Description = "Default low stock alert threshold" },
                    new SystemSetting { SettingKey = "Inventory.LowStockSyncPlatformValue", SettingValue = "0", Description = "Sync value for platforms when stock is low" },
                    new SystemSetting { SettingKey = "Billing.TrialDays", SettingValue = "14", Description = "Free trial duration in days" },
                    new SystemSetting { SettingKey = "Billing.GracePeriodDays", SettingValue = "3", Description = "Days to allow usage after subscription expiration" },
                    new SystemSetting { SettingKey = "System.MaintenanceMode", SettingValue = "false", Description = "Put system into maintenance mode" }
                };
                dbContext.SystemSettings.AddRange(defaultSettings);
                await dbContext.SaveChangesAsync();
            }

            bool taxesExist = false;
            try { taxesExist = await dbContext.TaxConfigurations.IgnoreQueryFilters().AnyAsync(); } catch { }

            if (!taxesExist)
            {
                var defaultTaxes = new[]
                {
                    new Models.Finance.TaxConfiguration { BusinessModel = "Corporate", ProductCategory = "Két nước", VatRate = 8, PitRate = 0, CitRate = 20 },
                    new Models.Finance.TaxConfiguration { BusinessModel = "Household", ProductCategory = "Két nước", VatRate = 1.5m, PitRate = 1.5m, CitRate = 0 },
                    new Models.Finance.TaxConfiguration { BusinessModel = "Corporate", ProductCategory = "Dầu nhớt", VatRate = 10, PitRate = 0, CitRate = 20 },
                    new Models.Finance.TaxConfiguration { BusinessModel = "Household", ProductCategory = "Dầu nhớt", VatRate = 1.5m, PitRate = 1.5m, CitRate = 0 }
                };
                dbContext.TaxConfigurations.AddRange(defaultTaxes);
                await dbContext.SaveChangesAsync();
            }

            var usersExist = false;
            try {
                usersExist = await userManager.Users.IgnoreQueryFilters().AnyAsync();
            } catch { } // Bỏ qua nếu có lỗi schema liên đới lúc seed

            if (!usersExist)
            {
                var adminEmail = Environment.GetEnvironmentVariable("SUPERADMIN_EMAIL") ?? configuration["SuperAdminSetup:Email"];
                var adminPassword = Environment.GetEnvironmentVariable("SUPERADMIN_PASSWORD") ?? configuration["SuperAdminSetup:Password"];

                if (!string.IsNullOrEmpty(adminEmail) && !string.IsNullOrEmpty(adminPassword))
                {
                    var adminUser = new ApplicationUser
                    {
                        UserName = adminEmail,
                        Email = adminEmail,
                        FullName = "System Administrator",
                        TenantId = null, // Chúa tể không thuộc Gara nào
                        EmailConfirmed = true,
                        MustChangePassword = true // Bắt buộc đổi pass trong lần đăng nhập đầu
                    };

                    var createResult = await userManager.CreateAsync(adminUser, adminPassword);
                    if (createResult.Succeeded)
                    {
                        await userManager.AddToRoleAsync(adminUser, "SuperAdmin");
                    }
                }
            }
        }
    }
}

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

            var usersExist = await userManager.Users.IgnoreQueryFilters().AnyAsync();

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

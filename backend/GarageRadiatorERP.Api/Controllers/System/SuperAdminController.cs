using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using GarageRadiatorERP.Api.Data;
using GarageRadiatorERP.Api.Models.Platforms;
using GarageRadiatorERP.Api.Models.System;
using System;
using Microsoft.AspNetCore.Identity;
using global::System.Security.Claims;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using global::System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.EntityFrameworkCore;
using global::System.Linq;
using System.Collections.Generic;

namespace GarageRadiatorERP.Api.Controllers.System
{
    [ApiController]
    [Route("api/v1/system-admin")]
    [Authorize(Roles = "SuperAdmin")]
    public class SuperAdminController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IConfiguration _configuration;

        private readonly GarageRadiatorERP.Api.Services.System.ISystemConfigurationService _configService;

        public SuperAdminController(AppDbContext context, UserManager<ApplicationUser> userManager, IConfiguration configuration, GarageRadiatorERP.Api.Services.System.ISystemConfigurationService configService)
        {
            _context = context;
            _userManager = userManager;
            _configuration = configuration;
            _configService = configService;
        }

        [HttpGet("settings")]
        public async Task<IActionResult> GetSystemSettings()
        {
            var settings = await _context.SystemSettings.ToListAsync();
            return Ok(settings);
        }

        public class UpdateSettingRequest
        {
            public string SettingKey { get; set; } = string.Empty;
            public string SettingValue { get; set; } = string.Empty;
        }

        [HttpPut("settings")]
        public async Task<IActionResult> UpdateSystemSettings([FromBody] List<UpdateSettingRequest> request)
        {
            // Lỗi số 2 - (LỖ HỔNG VALIDATION CẤU HÌNH)
            foreach (var item in request)
            {
                if (item.SettingKey.StartsWith("Finance.") || item.SettingKey.StartsWith("Inventory.") || item.SettingKey.StartsWith("Billing."))
                {
                    if (item.SettingKey != "System.MaintenanceMode" && !decimal.TryParse(item.SettingValue, out _))
                    {
                        return BadRequest($"Validation failed: Value '{item.SettingValue}' for key '{item.SettingKey}' must be a valid number.");
                    }
                }

                if (item.SettingKey == "System.MaintenanceMode")
                {
                    if (!bool.TryParse(item.SettingValue, out _))
                    {
                        return BadRequest($"Validation failed: Value '{item.SettingValue}' for key '{item.SettingKey}' must be true or false.");
                    }
                }
            }

            var allSettings = await _context.SystemSettings.ToDictionaryAsync(s => s.SettingKey);
            foreach(var item in request)
            {
                if(allSettings.TryGetValue(item.SettingKey, out var setting))
                {
                    setting.SettingValue = item.SettingValue;
                }
            }

            await _context.SaveChangesAsync();

            // Xóa bộ nhớ đệm RAM để bắt buộc load lại thông số mới nhất
            _configService.ClearCache();

            return Ok(new { message = "Settings updated successfully and cache cleared." });
        }

        public class OnboardTenantRequest
        {
            public string StoreName { get; set; } = string.Empty;
            public string OwnerEmail { get; set; } = string.Empty;
            public string OwnerFullName { get; set; } = string.Empty;
            public string PlanName { get; set; } = "Basic";
            public int DurationMonths { get; set; } = 12;
            public string BusinessModel { get; set; } = "Household";
            public string TaxMethod { get; set; } = "Direct";
        }

        [HttpPost("tenants/onboard")]
        public async Task<IActionResult> OnboardTenant([FromBody] OnboardTenantRequest request)
        {
            if (string.IsNullOrEmpty(request.OwnerEmail)) return BadRequest("Email is required");

            var existingUser = await _userManager.FindByEmailAsync(request.OwnerEmail);
            if (existingUser != null) return BadRequest("Email is already registered");

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var newTenant = new PlatformStore
                {
                    Id = Guid.NewGuid(),
                    StoreName = request.StoreName,
                    PlatformName = "ERP", // Virtual platform for the shop itself
                    BusinessModel = request.BusinessModel,
                    TaxMethod = request.TaxMethod,
                    IsActive = true
                };
                newTenant.TenantId = newTenant.Id;

                var subscription = new TenantSubscription
                {
                    TenantId = newTenant.Id,
                    PlanName = request.PlanName,
                    StartDate = DateTime.UtcNow,
                    EndDate = DateTime.UtcNow.AddMonths(request.DurationMonths),
                    IsActive = true,
                    MaxUsers = request.PlanName == "Enterprise" ? 999 : 5
                };

                _context.PlatformStores.Add(newTenant);
                _context.TenantSubscriptions.Add(subscription);
                await _context.SaveChangesAsync(); // Cần save để sinh TenantId trước

                var newUser = new ApplicationUser
                {
                    UserName = request.OwnerEmail,
                    Email = request.OwnerEmail,
                    FullName = request.OwnerFullName,
                    TenantId = newTenant.Id,
                    EmailConfirmed = true
                };

                // Generate random password
                var tempPassword = GenerateRandomPassword();
                var result = await _userManager.CreateAsync(newUser, tempPassword);
                if (!result.Succeeded)
                {
                    await transaction.RollbackAsync();
                    return BadRequest(result.Errors);
                }

                await _userManager.AddToRoleAsync(newUser, "TenantAdmin");

                await transaction.CommitAsync();

                return Ok(new { message = "Onboard successful", email = newUser.Email, temporaryPassword = tempPassword });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, ex.Message);
            }
        }

        public class UpdateStatusRequest { public bool IsActive { get; set; } }

        [HttpPut("tenants/{tenantId}/status")]
        public async Task<IActionResult> UpdateTenantStatus(Guid tenantId, [FromBody] UpdateStatusRequest request)
        {
            var sub = await _context.TenantSubscriptions.IgnoreQueryFilters().FirstOrDefaultAsync(s => s.TenantId == tenantId);
            if (sub == null) return NotFound("Tenant Subscription not found");

            sub.IsActive = request.IsActive;
            _context.TenantSubscriptions.Update(sub);
            await _context.SaveChangesAsync();

            return Ok(new { message = $"Tenant status updated to {(request.IsActive ? "Active" : "Locked")}" });
        }

        public class RenewRequest { public int AdditionalMonths { get; set; } }

        [HttpPut("tenants/{tenantId}/renew")]
        public async Task<IActionResult> RenewTenant(Guid tenantId, [FromBody] RenewRequest request)
        {
            var sub = await _context.TenantSubscriptions.IgnoreQueryFilters().FirstOrDefaultAsync(s => s.TenantId == tenantId);
            if (sub == null) return NotFound("Tenant Subscription not found");

            if (sub.EndDate < DateTime.UtcNow)
                sub.EndDate = DateTime.UtcNow.AddMonths(request.AdditionalMonths);
            else
                sub.EndDate = sub.EndDate.AddMonths(request.AdditionalMonths);

            _context.TenantSubscriptions.Update(sub);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Renewal successful", newEndDate = sub.EndDate });
        }

        [HttpPost("tenants/{tenantId}/impersonate")]
        public async Task<IActionResult> ImpersonateTenant(Guid tenantId)
        {
            var store = await _context.PlatformStores.IgnoreQueryFilters().FirstOrDefaultAsync(s => s.Id == tenantId);
            if (store == null) return NotFound("Tenant not found");

            var tokenHandler = new JwtSecurityTokenHandler();
            var keyStr = Environment.GetEnvironmentVariable("JWT_SECRET_KEY") ?? _configuration["Jwt:Key"];
            var key = Encoding.UTF8.GetBytes(keyStr!);

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new Claim[]
                {
                    new Claim(ClaimTypes.NameIdentifier, User.FindFirstValue(ClaimTypes.NameIdentifier) ?? Guid.NewGuid().ToString()),
                    new Claim(ClaimTypes.Name, User.Identity?.Name ?? "SuperAdmin"),
                    new Claim("TenantId", tenantId.ToString()),
                    new Claim(ClaimTypes.Role, "ReadOnlySupport"), // Cấp quyền chỉ đọc cho Admin khi soi data khách
                    new Claim("IsImpersonating", "true")
                }),
                Expires = DateTime.UtcNow.AddHours(1),
                Issuer = "https://auth.garageradiator.com",
                Audience = "erp-api",
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            var tokenString = tokenHandler.WriteToken(token);

            var cookieOptions = new Microsoft.AspNetCore.Http.CookieOptions
            {
                HttpOnly = true,
                Secure = true, // Sử dụng HTTPS trong production
                SameSite = Microsoft.AspNetCore.Http.SameSiteMode.Lax,
                Expires = DateTime.UtcNow.AddHours(1)
            };
            Response.Cookies.Append("access_token", tokenString, cookieOptions);

            return Ok(new { message = "Impersonation successful" });
        }

        private string GenerateRandomPassword()
        {
            var opts = new PasswordOptions
            {
                RequiredLength = 8,
                RequiredUniqueChars = 4,
                RequireDigit = true,
                RequireLowercase = true,
                RequireNonAlphanumeric = true,
                RequireUppercase = true
            };

            string[] randomChars = new[] {
                "ABCDEFGHJKLMNOPQRSTUVWXYZ",    // uppercase
                "abcdefghijkmnopqrstuvwxyz",    // lowercase
                "0123456789",                   // digits
                "!@$?_-"                        // non-alphanumeric
            };

            var chars = new List<char>();

            chars.Insert(GetRandomInt(0, chars.Count + 1), randomChars[0][GetRandomInt(0, randomChars[0].Length)]);
            chars.Insert(GetRandomInt(0, chars.Count + 1), randomChars[1][GetRandomInt(0, randomChars[1].Length)]);
            chars.Insert(GetRandomInt(0, chars.Count + 1), randomChars[2][GetRandomInt(0, randomChars[2].Length)]);
            chars.Insert(GetRandomInt(0, chars.Count + 1), randomChars[3][GetRandomInt(0, randomChars[3].Length)]);

            for (int i = chars.Count; i < opts.RequiredLength || chars.Distinct().Count() < opts.RequiredUniqueChars; i++)
            {
                string rcs = randomChars[GetRandomInt(0, randomChars.Length)];
                chars.Insert(GetRandomInt(0, chars.Count + 1), rcs[GetRandomInt(0, rcs.Length)]);
            }

            return new string(chars.ToArray());
        }

        private int GetRandomInt(int min, int max)
        {
            if (min >= max) return min;
            return global::System.Security.Cryptography.RandomNumberGenerator.GetInt32(min, max);
        }
    }
}

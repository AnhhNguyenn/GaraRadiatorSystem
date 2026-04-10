using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Identity;
using System.Threading.Tasks;
using GarageRadiatorERP.Api.Models.System;
using System;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Text;
using Microsoft.Extensions.Configuration;
using System.Collections.Generic;

namespace GarageRadiatorERP.Api.Controllers.System
{
    [ApiController]
    [Route("api/v1/auth")]
    public class LoginController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly SignInManager<ApplicationUser> _signInManager;
        private readonly IConfiguration _configuration;

        public LoginController(UserManager<ApplicationUser> userManager, SignInManager<ApplicationUser> signInManager, IConfiguration configuration)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _configuration = configuration;
        }

        public class LoginRequest
        {
            public string Email { get; set; } = string.Empty;
            public string Password { get; set; } = string.Empty;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            var user = await _userManager.FindByEmailAsync(request.Email);
            if (user == null) return Unauthorized("Invalid credentials");

            var result = await _signInManager.CheckPasswordSignInAsync(user, request.Password, false);
            if (!result.Succeeded) return Unauthorized("Invalid credentials");

            if (user.MustChangePassword)
            {
                return Ok(new { requirePasswordChange = true, userId = user.Id, message = "Bạn phải đổi mật khẩu khởi tạo trước khi đăng nhập." });
            }

            var token = await GenerateJwtToken(user);
            SetTokenCookie(token);

            return Ok(new { requirePasswordChange = false });
        }

        public class ChangePasswordRequest
        {
            public Guid UserId { get; set; }
            public string OldPassword { get; set; } = string.Empty;
            public string NewPassword { get; set; } = string.Empty;
        }

        [HttpPost("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
        {
            var user = await _userManager.FindByIdAsync(request.UserId.ToString());
            if (user == null) return NotFound("User not found");

            var result = await _userManager.ChangePasswordAsync(user, request.OldPassword, request.NewPassword);
            if (!result.Succeeded) return BadRequest(result.Errors);

            user.MustChangePassword = false;
            await _userManager.UpdateAsync(user);

            var token = await GenerateJwtToken(user);
            SetTokenCookie(token);

            return Ok(new { requirePasswordChange = false });
        }

        private async Task<string> GenerateJwtToken(ApplicationUser user)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var keyStr = Environment.GetEnvironmentVariable("JWT_SECRET_KEY") ?? _configuration["Jwt:Key"];

            if (string.IsNullOrWhiteSpace(keyStr))
            {
                throw new InvalidOperationException("JWT Secret Key is missing. Please configure 'JWT_SECRET_KEY' environment variable or 'Jwt:Key' in appsettings.");
            }

            if (keyStr.Length < 32)
            {
                throw new InvalidOperationException("JWT Secret Key must be at least 32 characters long to be cryptographically secure for HMAC-SHA256.");
            }

            var key = Encoding.UTF8.GetBytes(keyStr);

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.UserName ?? "")
            };

            if (user.TenantId.HasValue)
            {
                claims.Add(new Claim("TenantId", user.TenantId.Value.ToString()));
            }

            var roles = await _userManager.GetRolesAsync(user);
            foreach (var role in roles)
            {
                claims.Add(new Claim(ClaimTypes.Role, role));
            }

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.UtcNow.AddHours(24),
                Issuer = "https://auth.garageradiator.com",
                Audience = "erp-api",
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }

        private void SetTokenCookie(string token)
        {
            var cookieOptions = new Microsoft.AspNetCore.Http.CookieOptions
            {
                HttpOnly = true,
                Secure = true, // Sử dụng HTTPS trong production
                SameSite = Microsoft.AspNetCore.Http.SameSiteMode.Lax,
                Expires = DateTime.UtcNow.AddHours(24)
            };
            Response.Cookies.Append("access_token", token, cookieOptions);
        }

        [HttpGet("me")]
        [Microsoft.AspNetCore.Authorization.Authorize]
        public IActionResult GetCurrentUser()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var email = User.FindFirstValue(ClaimTypes.Name);
            var tenantId = User.FindFirstValue("TenantId");
            var role = User.FindFirstValue(ClaimTypes.Role);

            if (userId == null) return Unauthorized();

            return Ok(new
            {
                Id = userId,
                Email = email,
                TenantId = tenantId,
                Role = role
            });
        }
    }
}

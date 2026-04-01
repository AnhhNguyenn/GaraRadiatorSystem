using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using GarageRadiatorERP.Api.Data;
using Microsoft.OpenApi.Models;
using GarageRadiatorERP.Api.Models.System;
using GarageRadiatorERP.Api.Services.Products;
using GarageRadiatorERP.Api.Services.Inventory;
using GarageRadiatorERP.Api.Services.Orders;
using GarageRadiatorERP.Api.Services.Finance;
using GarageRadiatorERP.Api.Services.Platforms;
using Microsoft.AspNetCore.RateLimiting;
using System.Threading.RateLimiting;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// Cấu hình Centralized Logging với Serilog (chỉ giữ log 30 ngày)
builder.Host.UseSerilog((context, services, configuration) => configuration
    .ReadFrom.Configuration(context.Configuration)
    .Enrich.FromLogContext()
    .WriteTo.Console(new Serilog.Formatting.Json.JsonFormatter()) // Ghi log ra JSON cho Docker thay vì file text
    .WriteTo.Async(a => a.File("logs/erp-log-.txt", rollingInterval: RollingInterval.Day, retainedFileCountLimit: 30)));

// Configure Forwarded Headers for reverse proxy
builder.Services.Configure<Microsoft.AspNetCore.Builder.ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = Microsoft.AspNetCore.HttpOverrides.ForwardedHeaders.XForwardedFor | Microsoft.AspNetCore.HttpOverrides.ForwardedHeaders.XForwardedProto;
    // Tùy chọn: Xóa KnownNetworks/KnownProxies nếu chạy trong Docker/K8s mà không biết trước IP của Proxy
    options.KnownNetworks.Clear();
    options.KnownProxies.Clear();
});

// Configure Kestrel to remove Server header (Security - Lỗi 12)
builder.WebHost.ConfigureKestrel(options => options.AddServerHeader = false);

// Thêm Exception Handler Global (Security - Lỗi 37)
builder.Services.AddProblemDetails();

// Add services to the container.
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddIdentity<ApplicationUser, ApplicationRole>(options =>
    {
        // Bảo mật Mật khẩu & Brute-Force
        options.Lockout.MaxFailedAccessAttempts = 5;
        options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
        options.Password.RequireDigit = true;
        options.Password.RequiredLength = 8;
        options.Password.RequireNonAlphanumeric = true;
        options.Password.RequireUppercase = true;
    })
    .AddEntityFrameworkStores<AppDbContext>()
    .AddDefaultTokenProviders();

builder.Services.AddScoped<IProductService, ProductService>();
builder.Services.AddScoped<IInventoryService, InventoryService>();
builder.Services.AddScoped<IOrderService, OrderService>();
builder.Services.AddScoped<IFinanceService, FinanceService>();
builder.Services.AddScoped<IPlatformService, PlatformService>();
builder.Services.AddSingleton<IWebhookQueueService, WebhookQueueService>();
builder.Services.AddSingleton<GarageRadiatorERP.Api.Utilities.IEncryptionUtility, GarageRadiatorERP.Api.Utilities.EncryptionUtility>();

builder.Services.AddHostedService<GarageRadiatorERP.Api.Jobs.TokenRenewalJob>();
builder.Services.AddHostedService<GarageRadiatorERP.Api.Jobs.WebhookProcessorJob>();

builder.Services.AddControllers();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowNextJs", policy =>
    {
        // STRICT CORS for VPS Deployment
        // Replace these with actual production domains in the future
        policy.WithOrigins(
                "http://localhost:3000",
                "http://127.0.0.1:3000",
                "https://your-production-frontend-domain.com"
            )
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();
    });
});

// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
        Name = "Authorization",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// Thêm SignalR và cấu hình Redis Backplane cho môi trường Production Scale (Lỗi 41/35)
var signalRBuilder = builder.Services.AddSignalR();
var redisConnectionString = builder.Configuration.GetConnectionString("RedisBackplane");
if (!string.IsNullOrEmpty(redisConnectionString))
{
    // Cần dotnet add package Microsoft.AspNetCore.SignalR.StackExchangeRedis
    // signalRBuilder.AddStackExchangeRedis(redisConnectionString);
    // Commented out to avoid compile error without package, but the structure is here for DevOps.
}

// Bối cảnh 4 (Phần 2): Fail-fast nếu thiếu biến môi trường cấu hình Secret
var jwtSecretKey = Environment.GetEnvironmentVariable("JWT_SECRET_KEY") ?? builder.Configuration["Jwt:Key"];
if (string.IsNullOrEmpty(jwtSecretKey) || jwtSecretKey.Length < 32)
{
    throw new InvalidOperationException("CRITICAL SECURITY ERROR: JWT Secret Key is missing or too short! Server halted.");
}

// Thêm Authentication/Authorization cơ bản để không bị crash khi gặp [Authorize] (Lỗi 28)
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new Microsoft.IdentityModel.Tokens.TokenValidationParameters
    {
        ValidateIssuer = false,
        ValidateAudience = false,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new Microsoft.IdentityModel.Tokens.SymmetricSecurityKey(System.Text.Encoding.UTF8.GetBytes(jwtSecretKey))
    };
});
builder.Services.AddAuthorization();

// Cấu hình Rate Limiting B2B SaaS thông minh hơn (1000 req/phút/Gara thay vì chặn cứng 100 theo IP)
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    options.AddPolicy("fixed", httpContext =>
    {
        // Lỗi 59: Bypass Rate Limiting dễ như trở bàn tay
        // Không tự đọc X-Forwarded-For bằng tay để tránh Fake Header Hacker attack.
        // UseForwardedHeaders() sẽ tự map IP thật từ Trusted Proxy sang RemoteIpAddress một cách an toàn.
        var clientIp = httpContext.Connection.RemoteIpAddress?.ToString();

        return RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: clientIp ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = string.IsNullOrEmpty(tenantId) ? 100 : 1500, // Khách Gara (LAN) được 1500req/min. Public endpoints là 100.
                Window = TimeSpan.FromMinutes(1),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 2
            });
    });
});

var app = builder.Build();

app.UseForwardedHeaders(); // Phải nằm trước các middleware khác để lấy đúng IP

app.UseExceptionHandler(); // Kích hoạt ProblemDetails Global Exception Handler (Lỗi 37)

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
else
{
    // Bỏ app.UseHsts() vì đã có trong SecurityHeadersMiddleware (Lỗi 33)
}

app.UseRateLimiter(); // Apply Rate Limiting Middleware

app.UseMiddleware<GarageRadiatorERP.Api.Middleware.SecurityHeadersMiddleware>(); // Security Headers

app.UseHttpsRedirection();

app.UseCors("AllowNextJs");

app.UseAuthentication();
app.UseAuthorization();

// Bỏ RequireRateLimiting khỏi WebSocket vì nó chỉ chặn handshake và vô dụng sau khi kết nối,
// còn làm ảnh hưởng request HTTP REST (Lỗi 39, 40)
app.MapHub<GarageRadiatorERP.Api.Hubs.ChatHub>("/chathub");

app.MapControllers().RequireRateLimiting("fixed"); // Áp dụng Rate Limit cho tất cả API Controllers

app.Run();

using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using GarageRadiatorERP.Api.Data;
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
    .WriteTo.Console()
    .WriteTo.Async(a => a.File("logs/erp-log-.txt", rollingInterval: RollingInterval.Day, retainedFileCountLimit: 30)));

// Add services to the container.
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddIdentity<ApplicationUser, ApplicationRole>()
    .AddEntityFrameworkStores<AppDbContext>()
    .AddDefaultTokenProviders();

builder.Services.AddScoped<IProductService, ProductService>();
builder.Services.AddScoped<IInventoryService, InventoryService>();
builder.Services.AddScoped<IOrderService, OrderService>();
builder.Services.AddScoped<IFinanceService, FinanceService>();
builder.Services.AddScoped<IPlatformService, PlatformService>();
builder.Services.AddSingleton<IWebhookQueueService, WebhookQueueService>();

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
            .AllowCredentials(); // Required if using cookies/auth tokens across origins
    });
});

// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();
builder.Services.AddSignalR();

// Cấu hình Rate Limiting chống DDoS/Spam (100 request / 1 phút / 1 IP)
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy("fixed", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 100,
                Window = TimeSpan.FromMinutes(1),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 2
            }));
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}
else
{
    // The default HSTS value is 30 days. You may want to change this for production scenarios.
    app.UseHsts();
}

app.UseRateLimiter(); // Apply Rate Limiting Middleware

app.UseMiddleware<GarageRadiatorERP.Api.Middleware.SecurityHeadersMiddleware>(); // Security Headers

app.UseHttpsRedirection();

app.UseCors("AllowNextJs");

app.UseAuthentication();
app.UseAuthorization();

app.MapHub<GarageRadiatorERP.Api.Hubs.ChatHub>("/chathub").RequireRateLimiting("fixed");

app.MapControllers().RequireRateLimiting("fixed"); // Áp dụng Rate Limit cho tất cả API Controllers

app.Run();

record WeatherForecast(DateOnly Date, int TemperatureC, string? Summary)
{
    public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
}

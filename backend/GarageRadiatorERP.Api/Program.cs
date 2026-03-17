using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using GarageRadiatorERP.Api.Data;
using GarageRadiatorERP.Api.Models.System;
using GarageRadiatorERP.Api.Services.Products;
using GarageRadiatorERP.Api.Services.Inventory;
using GarageRadiatorERP.Api.Services.Orders;
using GarageRadiatorERP.Api.Services.Finance;
using GarageRadiatorERP.Api.Services.Platforms;

var builder = WebApplication.CreateBuilder(args);

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

builder.Services.AddHostedService<GarageRadiatorERP.Api.Jobs.TokenRenewalJob>();

builder.Services.AddControllers();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowNextJs", policy =>
    {
        policy.WithOrigins("http://localhost:3000", "http://127.0.0.1:3000", "http://192.168.2.96:3000")
            .AllowAnyMethod()
            .AllowAnyHeader();
    });
});

// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();
builder.Services.AddSignalR();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseCors("AllowNextJs");

app.UseAuthentication();
app.UseAuthorization();

app.MapHub<GarageRadiatorERP.Api.Hubs.ChatHub>("/chathub");

app.MapControllers();

app.Run();

record WeatherForecast(DateOnly Date, int TemperatureC, string? Summary)
{
    public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
}

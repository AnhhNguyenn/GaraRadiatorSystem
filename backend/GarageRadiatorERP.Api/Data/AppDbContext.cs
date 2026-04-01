using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using GarageRadiatorERP.Api.Models.Products;
using GarageRadiatorERP.Api.Models.Vehicles;
using GarageRadiatorERP.Api.Models.Inventory;
using GarageRadiatorERP.Api.Models.Orders;
using GarageRadiatorERP.Api.Models.Finance;
using GarageRadiatorERP.Api.Models.System;
using GarageRadiatorERP.Api.Models.Platforms;
using System.Linq;
using System;

namespace GarageRadiatorERP.Api.Data
{
    public class AppDbContext : IdentityDbContext<ApplicationUser, ApplicationRole, Guid>
    {
        private readonly GarageRadiatorERP.Api.Services.System.ITenantProvider _tenantProvider;
        private Guid? _currentTenantId;

        public AppDbContext(DbContextOptions<AppDbContext> options, GarageRadiatorERP.Api.Services.System.ITenantProvider tenantProvider) : base(options)
        {
            _tenantProvider = tenantProvider;
            _currentTenantId = _tenantProvider.GetTenantId();
        }

        // Helper Property cho EF Core Global Query Filter
        public Guid? CurrentTenantId => _currentTenantId;

        // PIM
        public DbSet<Product> Products { get; set; }
        public DbSet<ProductCategory> ProductCategories { get; set; }
        public DbSet<ProductSpecs> ProductSpecs { get; set; }
        public DbSet<ProductHoseSpecs> ProductHoseSpecs { get; set; }
        public DbSet<ProductImage> ProductImages { get; set; }
        public DbSet<OEMReference> OEMReferences { get; set; }

        // Vehicles
        public DbSet<Vehicle> Vehicles { get; set; }
        public DbSet<ProductVehicleMap> ProductVehicleMaps { get; set; }

        // WMS & Inventory
        public DbSet<Warehouse> Warehouses { get; set; }
        public DbSet<Zone> Zones { get; set; }
        public DbSet<BinLocation> BinLocations { get; set; }
        public DbSet<InventoryBatch> InventoryBatches { get; set; }
        public DbSet<InventoryTransaction> InventoryTransactions { get; set; }
        public DbSet<Supplier> Suppliers { get; set; }
        public DbSet<PurchaseOrder> PurchaseOrders { get; set; }
        public DbSet<PurchaseItem> PurchaseItems { get; set; }

        // Mảng Crm, Sales & POS
        public DbSet<Customer> Customers { get; set; }
        public DbSet<Order> Orders { get; set; }
        public DbSet<OrderItem> OrderItems { get; set; }
        public DbSet<OnlineOrderDetails> OnlineOrderDetails { get; set; }

        // Finance & System
        public DbSet<Expense> Expenses { get; set; }
        public DbSet<ProfitReport> ProfitReports { get; set; }
        public DbSet<TaxProfile> TaxProfiles { get; set; }
        public DbSet<TaxRecord> TaxRecords { get; set; }
        public DbSet<AuditLog> AuditLogs { get; set; }
        public DbSet<PlatformPayload> PlatformPayloads { get; set; }
        public DbSet<PlatformConversation> PlatformConversations { get; set; }
        public DbSet<PlatformMessage> PlatformMessages { get; set; }
        public DbSet<PlatformStore> PlatformStores { get; set; }
        public DbSet<PlatformToken> PlatformTokens { get; set; }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            // Configure Many-to-Many for Product - Vehicle
            builder.Entity<ProductVehicleMap>()
                .HasKey(pv => new { pv.ProductId, pv.VehicleId });

            builder.Entity<ProductVehicleMap>()
                .HasOne(pv => pv.Product)
                .WithMany(p => p.VehicleMaps)
                .HasForeignKey(pv => pv.ProductId);

            builder.Entity<ProductVehicleMap>()
                .HasOne(pv => pv.Vehicle)
                .WithMany(v => v.ProductMaps)
                .HasForeignKey(pv => pv.VehicleId);

            // Configure One-to-One for Product Specs
            builder.Entity<ProductSpecs>()
                .HasOne(s => s.Product)
                .WithOne(p => p.Specs)
                .HasForeignKey<ProductSpecs>(s => s.ProductId);

            builder.Entity<ProductHoseSpecs>()
                .HasOne(s => s.Product)
                .WithOne(p => p.HoseSpecs)
                .HasForeignKey<ProductHoseSpecs>(s => s.ProductId);

            // Configure OnlineOrderDetails One-to-One
            builder.Entity<OnlineOrderDetails>()
                .HasOne(d => d.Order)
                .WithOne(o => o.OnlineDetails)
                .HasForeignKey<OnlineOrderDetails>(d => d.OrderId);

            // Fix sai số giá vốn (Lỗi 23) và phân chia Precision
            var decimalProps = builder.Model.GetEntityTypes()
                .SelectMany(t => t.GetProperties())
                .Where(p => p.ClrType == typeof(decimal) || p.ClrType == typeof(decimal?));

            foreach (var property in decimalProps)
            {
                if (property.Name.Contains("Cost") || property.Name.Contains("Price"))
                {
                    property.SetColumnType("decimal(18,4)");
                }
                else
                {
                    property.SetColumnType("decimal(18,2)");
                }
            }

            // Fix SQL Server sập vì Index nvarchar(max) (Lỗi 22)
            builder.Entity<Product>().Property(p => p.SKU).HasMaxLength(100);
            builder.Entity<Product>().Property(p => p.Barcode).HasMaxLength(100);

            // Database Indexing chuẩn xác để tăng Query speed
            builder.Entity<Product>().HasIndex(p => p.SKU).IsUnique();
            builder.Entity<Product>().HasIndex(p => p.Barcode);

            builder.Entity<BinLocation>().HasIndex(b => b.Barcode).IsUnique();

            builder.Entity<InventoryBatch>().HasIndex(b => b.ImportDate);
            builder.Entity<InventoryBatch>().HasIndex(b => b.ProductId);

            builder.Entity<Order>().HasIndex(o => o.OrderDate);
            builder.Entity<Order>().HasIndex(o => o.Status);

            builder.Entity<OnlineOrderDetails>().HasIndex(o => o.PlatformOrderId).IsUnique();

            // Bối cảnh 4: Ngăn chặn nhân bản Store khi có Race Condition
            builder.Entity<PlatformStore>().HasIndex(s => new { s.PlatformName, s.ShopId }).IsUnique();

            // Cấu hình Global Query Filter cho Multi-Tenant & Soft Delete
            foreach (var entityType in builder.Model.GetEntityTypes())
            {
                var isSoftDeletable = typeof(GarageRadiatorERP.Api.Models.System.ISoftDeletable).IsAssignableFrom(entityType.ClrType);
                var isTenantEntity = typeof(GarageRadiatorERP.Api.Models.System.ITenantEntity).IsAssignableFrom(entityType.ClrType);

                if (isSoftDeletable || isTenantEntity)
                {
                    var parameter = System.Linq.Expressions.Expression.Parameter(entityType.ClrType, "e");
                    System.Linq.Expressions.Expression? condition = null;

                    if (isSoftDeletable)
                    {
                        var isDeletedProperty = System.Linq.Expressions.Expression.Property(parameter, "IsDeleted");
                        condition = System.Linq.Expressions.Expression.Equal(isDeletedProperty, System.Linq.Expressions.Expression.Constant(false));
                    }

                    if (isTenantEntity)
                    {
                        var tenantProperty = System.Linq.Expressions.Expression.Property(parameter, "TenantId");
                        var currentTenantIdProperty = typeof(AppDbContext).GetProperty(nameof(CurrentTenantId));

                        // Property access directly binds to "this" contextual instance per-request
                        var tenantIdValue = System.Linq.Expressions.Expression.Property(System.Linq.Expressions.Expression.Constant(this), currentTenantIdProperty!);

                        var hasValueProp = System.Linq.Expressions.Expression.Property(tenantIdValue, "HasValue");
                        var valueProp = System.Linq.Expressions.Expression.Property(tenantIdValue, "Value");

                        var noTenantCondition = System.Linq.Expressions.Expression.Equal(hasValueProp, System.Linq.Expressions.Expression.Constant(false));
                        var matchTenantCondition = System.Linq.Expressions.Expression.Equal(tenantProperty, valueProp);

                        var tenantCondition = System.Linq.Expressions.Expression.OrElse(noTenantCondition, matchTenantCondition);

                        condition = condition == null ? tenantCondition : System.Linq.Expressions.Expression.AndAlso(condition, tenantCondition);
                    }

                    if (condition != null)
                    {
                        var lambda = System.Linq.Expressions.Expression.Lambda(condition, parameter);
                        builder.Entity(entityType.ClrType).HasQueryFilter(lambda);
                    }
                }
            }


            // Bối cảnh 1: Kích hoạt Concurrency Check thực sự cho kho
            builder.Entity<InventoryBatch>().Property(b => b.RowVersion).IsRowVersion();
        }

        public override int SaveChanges()
        {
            ApplySoftDelete();


            GenerateAuditLogs();

            return base.SaveChanges();
        }

        public override System.Threading.Tasks.Task<int> SaveChangesAsync(System.Threading.CancellationToken cancellationToken = default)
        {
            ApplySoftDelete();
            GenerateAuditLogs();
            return base.SaveChangesAsync(cancellationToken);
        }

        private void GenerateAuditLogs()
        {
            // Bối cảnh 2: Thiếu Audit Trail (Nhật ký thao tác) cho ERP
            ChangeTracker.DetectChanges();
            var entries = ChangeTracker.Entries()
                .Where(e => e.State == EntityState.Added || e.State == EntityState.Modified || e.State == EntityState.Deleted)
                .Where(e => !(e.Entity is AuditLog)) // Tránh đệ quy
                .ToList();

            foreach (var entry in entries)
            {
                var auditLog = new AuditLog
                {
                    TableName = entry.Entity.GetType().Name,
                    Action = entry.State.ToString(),
                    CreatedAt = DateTime.UtcNow
                };

                // Lưu các trường dữ liệu JSON cho các thực thể quan trọng nếu cần
                if (entry.State == EntityState.Modified)
                {
                    var oldValues = new System.Collections.Generic.Dictionary<string, object?>();
                    var newValues = new System.Collections.Generic.Dictionary<string, object?>();

                    foreach (var property in entry.Properties.Where(p => p.IsModified))
                    {
                        oldValues[property.Metadata.Name] = property.OriginalValue;
                        newValues[property.Metadata.Name] = property.CurrentValue;
                    }

                    auditLog.OldData = System.Text.Json.JsonSerializer.Serialize(oldValues);
                    auditLog.NewData = System.Text.Json.JsonSerializer.Serialize(newValues);
                }
                else if (entry.State == EntityState.Deleted)
                {
                    var oldValues = new System.Collections.Generic.Dictionary<string, object?>();
                    foreach (var property in entry.Properties)
                    {
                        oldValues[property.Metadata.Name] = property.OriginalValue;
                    }
                    auditLog.OldData = System.Text.Json.JsonSerializer.Serialize(oldValues);
                }

                AuditLogs.Add(auditLog);
            }
        }

        private void ApplySoftDelete()
        {
            // Tự động gán TenantId khi tạo mới thực thể (Multi-Tenancy Insert)
            foreach (var entry in ChangeTracker.Entries<GarageRadiatorERP.Api.Models.System.ITenantEntity>())
            {
                if (entry.State == EntityState.Added && _currentTenantId.HasValue)
                {
                    entry.Entity.TenantId = _currentTenantId.Value;
                }
            }


            foreach (var entry in ChangeTracker.Entries<GarageRadiatorERP.Api.Models.System.ISoftDeletable>())
            {
                if (entry.State == EntityState.Deleted)
                {
                    entry.State = EntityState.Modified;
                    entry.Entity.IsDeleted = true;
                }
            }
        }
    }
}

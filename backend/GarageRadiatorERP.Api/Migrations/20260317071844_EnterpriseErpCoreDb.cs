using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GarageRadiatorERP.Api.Migrations
{
    /// <inheritdoc />
    public partial class EnterpriseErpCoreDb : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_InventoryBatches_Locations_LocationId",
                table: "InventoryBatches");

            migrationBuilder.DropForeignKey(
                name: "FK_OrderItems_InventoryBatches_BatchId",
                table: "OrderItems");

            migrationBuilder.DropForeignKey(
                name: "FK_PurchaseItems_InventoryBatches_BatchId",
                table: "PurchaseItems");

            migrationBuilder.DropTable(
                name: "Locations");

            migrationBuilder.DropColumn(
                name: "Weight",
                table: "Products");

            migrationBuilder.RenameColumn(
                name: "Brand",
                table: "Vehicles",
                newName: "Make");

            migrationBuilder.RenameColumn(
                name: "BatchId",
                table: "PurchaseItems",
                newName: "InventoryBatchId");

            migrationBuilder.RenameIndex(
                name: "IX_PurchaseItems_BatchId",
                table: "PurchaseItems",
                newName: "IX_PurchaseItems_InventoryBatchId");

            migrationBuilder.RenameColumn(
                name: "BatchId",
                table: "OrderItems",
                newName: "InventoryBatchId");

            migrationBuilder.RenameIndex(
                name: "IX_OrderItems_BatchId",
                table: "OrderItems",
                newName: "IX_OrderItems_InventoryBatchId");

            migrationBuilder.RenameColumn(
                name: "TrackingCode",
                table: "OnlineOrderDetails",
                newName: "CourierName");

            migrationBuilder.RenameColumn(
                name: "Quantity",
                table: "InventoryTransactions",
                newName: "QuantityChange");

            migrationBuilder.RenameColumn(
                name: "Remaining",
                table: "InventoryBatches",
                newName: "RemainingQuantity");

            migrationBuilder.RenameColumn(
                name: "Quantity",
                table: "InventoryBatches",
                newName: "InitialQuantity");

            migrationBuilder.RenameColumn(
                name: "LocationId",
                table: "InventoryBatches",
                newName: "BinLocationId");

            migrationBuilder.RenameIndex(
                name: "IX_InventoryBatches_LocationId",
                table: "InventoryBatches",
                newName: "IX_InventoryBatches_BinLocationId");

            migrationBuilder.AddColumn<string>(
                name: "BodyStyle",
                table: "Vehicles",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SubModel",
                table: "Vehicles",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Transmission",
                table: "Vehicles",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FitmentNotes",
                table: "ProductVehicleMaps",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TransmissionType",
                table: "ProductSpecs",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "GrossWeight",
                table: "Products",
                type: "decimal(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsBulky",
                table: "Products",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<decimal>(
                name: "NetWeight",
                table: "Products",
                type: "decimal(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UnitOfMeasure",
                table: "Products",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<decimal>(
                name: "Discount",
                table: "Orders",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "Notes",
                table: "Orders",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PaymentStatus",
                table: "Orders",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "BackorderQuantity",
                table: "OrderItems",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "WebhookReceivedAt",
                table: "OnlineOrderDetails",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ReferenceDocument",
                table: "InventoryTransactions",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BatchNumber",
                table: "InventoryBatches",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<byte[]>(
                name: "RowVersion",
                table: "InventoryBatches",
                type: "rowversion",
                rowVersion: true,
                nullable: false,
                defaultValue: new byte[0]);

            migrationBuilder.AddColumn<decimal>(
                name: "CreditLimit",
                table: "Customers",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "CurrentBalance",
                table: "Customers",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "PricingTier",
                table: "Customers",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "OEMReferences",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ProductId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OEMCode = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Manufacturer = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OEMReferences", x => x.Id);
                    table.ForeignKey(
                        name: "FK_OEMReferences_Products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PlatformConversations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Platform = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    BuyerId = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    BuyerName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    LastMessage = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PlatformConversations", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PlatformPayloads",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Platform = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    PayloadJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PlatformPayloads", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Zones",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    WarehouseId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Zones", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Zones_Warehouses_WarehouseId",
                        column: x => x.WarehouseId,
                        principalTable: "Warehouses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PlatformMessages",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ConversationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Sender = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Message = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsRead = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PlatformMessages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PlatformMessages_PlatformConversations_ConversationId",
                        column: x => x.ConversationId,
                        principalTable: "PlatformConversations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "BinLocations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ZoneId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Barcode = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Rack = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Shelf = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BinLocations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BinLocations_Zones_ZoneId",
                        column: x => x.ZoneId,
                        principalTable: "Zones",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Products_Barcode",
                table: "Products",
                column: "Barcode");

            migrationBuilder.CreateIndex(
                name: "IX_Products_SKU",
                table: "Products",
                column: "SKU",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Orders_OrderDate",
                table: "Orders",
                column: "OrderDate");

            migrationBuilder.CreateIndex(
                name: "IX_Orders_Status",
                table: "Orders",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_OnlineOrderDetails_PlatformOrderId",
                table: "OnlineOrderDetails",
                column: "PlatformOrderId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_InventoryBatches_ImportDate",
                table: "InventoryBatches",
                column: "ImportDate");

            migrationBuilder.CreateIndex(
                name: "IX_BinLocations_Barcode",
                table: "BinLocations",
                column: "Barcode",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_BinLocations_ZoneId",
                table: "BinLocations",
                column: "ZoneId");

            migrationBuilder.CreateIndex(
                name: "IX_OEMReferences_ProductId",
                table: "OEMReferences",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_PlatformMessages_ConversationId",
                table: "PlatformMessages",
                column: "ConversationId");

            migrationBuilder.CreateIndex(
                name: "IX_Zones_WarehouseId",
                table: "Zones",
                column: "WarehouseId");

            migrationBuilder.AddForeignKey(
                name: "FK_InventoryBatches_BinLocations_BinLocationId",
                table: "InventoryBatches",
                column: "BinLocationId",
                principalTable: "BinLocations",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_OrderItems_InventoryBatches_InventoryBatchId",
                table: "OrderItems",
                column: "InventoryBatchId",
                principalTable: "InventoryBatches",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_PurchaseItems_InventoryBatches_InventoryBatchId",
                table: "PurchaseItems",
                column: "InventoryBatchId",
                principalTable: "InventoryBatches",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_InventoryBatches_BinLocations_BinLocationId",
                table: "InventoryBatches");

            migrationBuilder.DropForeignKey(
                name: "FK_OrderItems_InventoryBatches_InventoryBatchId",
                table: "OrderItems");

            migrationBuilder.DropForeignKey(
                name: "FK_PurchaseItems_InventoryBatches_InventoryBatchId",
                table: "PurchaseItems");

            migrationBuilder.DropTable(
                name: "BinLocations");

            migrationBuilder.DropTable(
                name: "OEMReferences");

            migrationBuilder.DropTable(
                name: "PlatformMessages");

            migrationBuilder.DropTable(
                name: "PlatformPayloads");

            migrationBuilder.DropTable(
                name: "Zones");

            migrationBuilder.DropTable(
                name: "PlatformConversations");

            migrationBuilder.DropIndex(
                name: "IX_Products_Barcode",
                table: "Products");

            migrationBuilder.DropIndex(
                name: "IX_Products_SKU",
                table: "Products");

            migrationBuilder.DropIndex(
                name: "IX_Orders_OrderDate",
                table: "Orders");

            migrationBuilder.DropIndex(
                name: "IX_Orders_Status",
                table: "Orders");

            migrationBuilder.DropIndex(
                name: "IX_OnlineOrderDetails_PlatformOrderId",
                table: "OnlineOrderDetails");

            migrationBuilder.DropIndex(
                name: "IX_InventoryBatches_ImportDate",
                table: "InventoryBatches");

            migrationBuilder.DropColumn(
                name: "BodyStyle",
                table: "Vehicles");

            migrationBuilder.DropColumn(
                name: "SubModel",
                table: "Vehicles");

            migrationBuilder.DropColumn(
                name: "Transmission",
                table: "Vehicles");

            migrationBuilder.DropColumn(
                name: "FitmentNotes",
                table: "ProductVehicleMaps");

            migrationBuilder.DropColumn(
                name: "TransmissionType",
                table: "ProductSpecs");

            migrationBuilder.DropColumn(
                name: "GrossWeight",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "IsBulky",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "NetWeight",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "UnitOfMeasure",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "Discount",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "Notes",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "PaymentStatus",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "BackorderQuantity",
                table: "OrderItems");

            migrationBuilder.DropColumn(
                name: "WebhookReceivedAt",
                table: "OnlineOrderDetails");

            migrationBuilder.DropColumn(
                name: "ReferenceDocument",
                table: "InventoryTransactions");

            migrationBuilder.DropColumn(
                name: "BatchNumber",
                table: "InventoryBatches");

            migrationBuilder.DropColumn(
                name: "RowVersion",
                table: "InventoryBatches");

            migrationBuilder.DropColumn(
                name: "CreditLimit",
                table: "Customers");

            migrationBuilder.DropColumn(
                name: "CurrentBalance",
                table: "Customers");

            migrationBuilder.DropColumn(
                name: "PricingTier",
                table: "Customers");

            migrationBuilder.RenameColumn(
                name: "Make",
                table: "Vehicles",
                newName: "Brand");

            migrationBuilder.RenameColumn(
                name: "InventoryBatchId",
                table: "PurchaseItems",
                newName: "BatchId");

            migrationBuilder.RenameIndex(
                name: "IX_PurchaseItems_InventoryBatchId",
                table: "PurchaseItems",
                newName: "IX_PurchaseItems_BatchId");

            migrationBuilder.RenameColumn(
                name: "InventoryBatchId",
                table: "OrderItems",
                newName: "BatchId");

            migrationBuilder.RenameIndex(
                name: "IX_OrderItems_InventoryBatchId",
                table: "OrderItems",
                newName: "IX_OrderItems_BatchId");

            migrationBuilder.RenameColumn(
                name: "CourierName",
                table: "OnlineOrderDetails",
                newName: "TrackingCode");

            migrationBuilder.RenameColumn(
                name: "QuantityChange",
                table: "InventoryTransactions",
                newName: "Quantity");

            migrationBuilder.RenameColumn(
                name: "RemainingQuantity",
                table: "InventoryBatches",
                newName: "Remaining");

            migrationBuilder.RenameColumn(
                name: "InitialQuantity",
                table: "InventoryBatches",
                newName: "Quantity");

            migrationBuilder.RenameColumn(
                name: "BinLocationId",
                table: "InventoryBatches",
                newName: "LocationId");

            migrationBuilder.RenameIndex(
                name: "IX_InventoryBatches_BinLocationId",
                table: "InventoryBatches",
                newName: "IX_InventoryBatches_LocationId");

            migrationBuilder.AddColumn<decimal>(
                name: "Weight",
                table: "Products",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Locations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    WarehouseId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Bin = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Shelf = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Locations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Locations_Warehouses_WarehouseId",
                        column: x => x.WarehouseId,
                        principalTable: "Warehouses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Locations_WarehouseId",
                table: "Locations",
                column: "WarehouseId");

            migrationBuilder.AddForeignKey(
                name: "FK_InventoryBatches_Locations_LocationId",
                table: "InventoryBatches",
                column: "LocationId",
                principalTable: "Locations",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_OrderItems_InventoryBatches_BatchId",
                table: "OrderItems",
                column: "BatchId",
                principalTable: "InventoryBatches",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_PurchaseItems_InventoryBatches_BatchId",
                table: "PurchaseItems",
                column: "BatchId",
                principalTable: "InventoryBatches",
                principalColumn: "Id");
        }
    }
}

using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GarageRadiatorERP.Api.Migrations
{
    public partial class AddStandardCostToProduct : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "StandardCost",
                table: "Products",
                type: "decimal(18,4)",
                nullable: false,
                defaultValue: 0m);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "StandardCost",
                table: "Products");
        }
    }
}

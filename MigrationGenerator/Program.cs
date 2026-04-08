using System;
using System.IO;
using System.Reflection;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.DependencyInjection;
using GarageRadiatorERP.Api.Data;

namespace MigrationGenerator
{
    class Program
    {
        static void Main(string[] args)
        {
            var optionsBuilder = new DbContextOptionsBuilder<AppDbContext>();
            optionsBuilder.UseNpgsql("Host=localhost;Port=5432;Database=GaraErpDb;Username=postgres;Password=password");

            using (var context = new AppDbContext(optionsBuilder.Options, new DummyTenantProvider()))
            {
                Console.WriteLine("Generating Snapshot is unsupported in bare terminal. Returning.");
            }
        }
    }

    public class DummyTenantProvider : GarageRadiatorERP.Api.Services.System.ITenantProvider
    {
        public System.Guid? GetTenantId() => null;
    }
}

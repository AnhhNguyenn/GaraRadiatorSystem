using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using BenchmarkDotNet.Attributes;
using BenchmarkDotNet.Running;
using Microsoft.EntityFrameworkCore;

namespace PerfTest
{
    public class InventoryBatch
    {
        public Guid Id { get; set; }
        public Guid ProductId { get; set; }
        public int RemainingQuantity { get; set; }
    }

    public class AppDbContext : DbContext
    {
        public DbSet<InventoryBatch> InventoryBatches { get; set; }

        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }
    }

    [MemoryDiagnoser]
    public class OrderServiceBenchmark
    {
        private AppDbContext _context;
        private Dictionary<Guid, int> _syncStockDict;

        [GlobalSetup]
        public void Setup()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: "PerfTestDb")
                .Options;

            _context = new AppDbContext(options);

            // Tự sinh data
            _syncStockDict = new Dictionary<Guid, int>();
            for (int i = 0; i < 50; i++)
            {
                var productId = Guid.NewGuid();
                _syncStockDict[productId] = 5;

                for (int j = 0; j < 10; j++)
                {
                    _context.InventoryBatches.Add(new InventoryBatch
                    {
                        Id = Guid.NewGuid(),
                        ProductId = productId,
                        RemainingQuantity = 10
                    });
                }
            }

            _context.SaveChanges();
        }

        [GlobalCleanup]
        public void Cleanup()
        {
            _context.Database.EnsureDeleted();
            _context.Dispose();
        }

        [Benchmark(Baseline = true)]
        public async Task NPlus1QueryAsync()
        {
            foreach (var kvp in _syncStockDict)
            {
                var productId = kvp.Key;

                var totalStock = await _context.InventoryBatches
                    .Where(b => b.ProductId == productId && b.RemainingQuantity > 0)
                    .SumAsync(b => b.RemainingQuantity);

                // Simulate platform sync
                await Task.CompletedTask;
            }
        }

        [Benchmark]
        public async Task BatchedQueryAsync()
        {
            var productIds = _syncStockDict.Keys.ToList();

            var stockSums = await _context.InventoryBatches
                .Where(b => productIds.Contains(b.ProductId) && b.RemainingQuantity > 0)
                .GroupBy(b => b.ProductId)
                .Select(g => new { ProductId = g.Key, TotalStock = g.Sum(b => b.RemainingQuantity) })
                .ToDictionaryAsync(x => x.ProductId, x => x.TotalStock);

            foreach (var kvp in _syncStockDict)
            {
                var productId = kvp.Key;
                var totalStock = stockSums.TryGetValue(productId, out var stock) ? stock : 0;

                // Simulate platform sync
                await Task.CompletedTask;
            }
        }
    }

    class Program
    {
        static void Main(string[] args)
        {
            var summary = BenchmarkRunner.Run<OrderServiceBenchmark>();
        }
    }
}

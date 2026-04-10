# Performance Baseline and Theoretical Improvement

## Baseline Measurement Constraints
In this environment, establishing an exact millisecond benchmark for the `OrderService.cs` stock synchronization is impractical because:
1. **Database Requirements:** Meaningful benchmarks for Entity Framework Core require a running instance of PostgreSQL with a significant amount of seeded data to accurately simulate query latency and execution plans.
2. **Data Sparsity:** An order with many distinct items (where the N+1 issue becomes severe) would need to be generated, and the corresponding inventory batches created to measure the overhead correctly.
3. **External Dependencies:** The `_platformService.SyncStockToPlatformAsync` method introduces arbitrary delays (network I/O, API rate limits) which would contaminate pure database query timing.

## Theoretical Improvement (O(N) to O(1) Database Queries)

**The Problem (Baseline):**
Currently, `OrderService.cs` loops over `syncStockDict` (representing distinct `ProductId`s in an order). For each product, it executes a separate query:
```csharp
var totalStock = await _context.InventoryBatches
    .Where(b => b.ProductId == productId && b.RemainingQuantity > 0)
    .SumAsync(b => b.RemainingQuantity);
```
If an order contains $N$ distinct products, the backend makes $N$ separate round trips to the PostgreSQL database. This causes:
- Connection pool exhaustion under heavy load.
- Network latency multiplied by $N$.
- High overhead on the EF Core query parser and translation engine.

**The Solution:**
By collecting all `productIds` and executing a single aggregate query:
```csharp
var productIds = syncStockDict.Keys.ToList();
var totalStocks = await _context.InventoryBatches
    .Where(b => productIds.Contains(b.ProductId) && b.RemainingQuantity > 0)
    .GroupBy(b => b.ProductId)
    .Select(g => new { ProductId = g.Key, TotalStock = g.Sum(b => b.RemainingQuantity) })
    .ToDictionaryAsync(x => x.ProductId, x => x.TotalStock);
```
We reduce the number of queries from $O(N)$ to $O(1)$.

**Expected Impact:**
- **Network Roundtrips:** Reduced from $N$ to 1.
- **Latency:** For an order with 20 distinct items and 5ms latency per query, DB time decreases from ~100ms to ~5-10ms.
- **Scalability:** The database can handle significantly more concurrent order cancellation/return requests because fewer active queries are competing for CPU and I/O.

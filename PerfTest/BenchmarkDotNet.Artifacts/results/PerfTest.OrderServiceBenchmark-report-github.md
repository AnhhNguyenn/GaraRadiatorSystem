```

BenchmarkDotNet v0.15.8, Linux Ubuntu 24.04.4 LTS (Noble Numbat)
Intel Xeon Processor 2.30GHz, 1 CPU, 4 logical and 4 physical cores
.NET SDK 10.0.103
  [Host]     : .NET 10.0.3 (10.0.3, 10.0.326.7603), X64 RyuJIT x86-64-v3
  DefaultJob : .NET 10.0.3 (10.0.3, 10.0.326.7603), X64 RyuJIT x86-64-v3


```
| Method            | Mean       | Error    | StdDev   | Ratio | Gen0    | Gen1   | Allocated  | Alloc Ratio |
|------------------ |-----------:|---------:|---------:|------:|--------:|-------:|-----------:|------------:|
| NPlus1QueryAsync  | 4,338.0 μs | 38.18 μs | 29.81 μs |  1.00 | 78.1250 | 7.8125 | 1966.02 KB |        1.00 |
| BatchedQueryAsync |   314.8 μs |  2.37 μs |  1.85 μs |  0.07 |  7.8125 | 0.9766 |  196.08 KB |        0.10 |

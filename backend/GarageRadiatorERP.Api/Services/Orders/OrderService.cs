using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using GarageRadiatorERP.Api.Data;
using GarageRadiatorERP.Api.Models.Orders;
using GarageRadiatorERP.Api.DTOs.Orders;
using GarageRadiatorERP.Api.Models.Inventory;
using Microsoft.AspNetCore.SignalR;

namespace GarageRadiatorERP.Api.Services.Orders
{
    public interface IOrderService
    {
        Task<OrderDto> CreatePOSOrderAsync(CreatePOSOrderDto dto);
    }

    public class OrderService : IOrderService
    {
        private readonly AppDbContext _context;
        private readonly Microsoft.AspNetCore.SignalR.IHubContext<GarageRadiatorERP.Api.Hubs.ChatHub> _hubContext;

        public OrderService(AppDbContext context, Microsoft.AspNetCore.SignalR.IHubContext<GarageRadiatorERP.Api.Hubs.ChatHub> hubContext)
        {
            _context = context;
            _hubContext = hubContext;
        }

        public async Task<OrderDto> CreatePOSOrderAsync(CreatePOSOrderDto dto)
        {
            int maxRetries = 3;
            for (int retry = 0; retry < maxRetries; retry++)
            {
                try
                {
                    var order = new Order
                    {
                        CustomerId = dto.CustomerId,
                        Source = "POS",
                        Status = "Completed",
                        PaymentStatus = "Paid",
                        OrderDate = DateTime.UtcNow,
                        Notes = dto.Notes
                    };

                    decimal totalAmount = 0;
                    decimal totalCost = 0;

                    foreach (var itemDto in dto.Items)
                    {
                        // Simple FIFO logic to deduct stock
                        var batchesToDeduct = await _context.InventoryBatches
                            .Where(b => b.ProductId == itemDto.ProductId && b.RemainingQuantity > 0)
                            .OrderBy(b => b.ImportDate)
                            .ToListAsync();

                        int qtyToFulfill = itemDto.Quantity;

                        foreach (var batch in batchesToDeduct)
                        {
                            if (qtyToFulfill <= 0) break;

                            int qtyFromThisBatch = Math.Min(batch.RemainingQuantity, qtyToFulfill);
                            
                            batch.RemainingQuantity -= qtyFromThisBatch;
                            qtyToFulfill -= qtyFromThisBatch;

                            var orderItem = new OrderItem
                            {
                                Order = order,
                                ProductId = itemDto.ProductId,
                                InventoryBatch = batch,
                                Quantity = qtyFromThisBatch,
                                UnitPrice = itemDto.UnitPrice,
                                CostPrice = batch.CostPrice,
                                BackorderQuantity = 0
                            };
                            order.Items.Add(orderItem);

                            // Add transaction
                            var transaction = new InventoryTransaction
                            {
                                ProductId = itemDto.ProductId,
                                Batch = batch,
                                Type = "sale",
                                QuantityChange = -qtyFromThisBatch,
                                ReferenceDocument = "POS Order", // Will update after save
                                CreatedAt = DateTime.UtcNow
                            };
                            _context.InventoryTransactions.Add(transaction);

                            totalAmount += (qtyFromThisBatch * itemDto.UnitPrice);
                            totalCost += (qtyFromThisBatch * batch.CostPrice);

                            // Send Low Stock Notification
                            if (batch.RemainingQuantity < 3)
                            {
                                await _hubContext.Clients.All.SendAsync("ReceiveNotification", new 
                                { 
                                    message = $"⚠️ Cảnh báo tồn kho: Sản phẩm ID {itemDto.ProductId} ở Lô {batch.Id} sắp hết (Còn {batch.RemainingQuantity} cái).", 
                                    type = "warning", 
                                    time = DateTime.UtcNow 
                                });
                            }
                        }

                        if (qtyToFulfill > 0)
                        {
                            // Oversell scenario (Not enough stock) - ghi nhận Backorder nợ khách (Giao sau)
                            var backOrderItem = new OrderItem
                            {
                                Order = order,
                                ProductId = itemDto.ProductId,
                                Quantity = qtyToFulfill, // Assign remaining qty here
                                BackorderQuantity = qtyToFulfill,
                                UnitPrice = itemDto.UnitPrice,
                                CostPrice = 0 // Tùy chiến lược, tạm gán 0
                            };
                            order.Items.Add(backOrderItem);
                            totalAmount += (qtyToFulfill * itemDto.UnitPrice);
                        }
                    }

                    order.TotalAmount = totalAmount;
                    order.TotalCost = totalCost;
                    order.Profit = totalAmount - totalCost;

                    _context.Orders.Add(order);
                    await _context.SaveChangesAsync();

                    // Update ReferenceDocument in transactions
                    var transactions = _context.ChangeTracker.Entries<InventoryTransaction>()
                        .Where(e => e.Entity.ReferenceDocument == "POS Order")
                        .Select(e => e.Entity);
                    foreach(var t in transactions)
                    {
                        t.ReferenceDocument = order.Id.ToString();
                    }
                    if (transactions.Any())
                    {
                        await _context.SaveChangesAsync();
                    }

                    return new OrderDto
                    {
                        Id = order.Id,
                        Source = order.Source,
                        Status = order.Status,
                        TotalAmount = order.TotalAmount,
                        TotalCost = order.TotalCost,
                        Profit = order.Profit
                    };
                }
                catch (DbUpdateConcurrencyException)
                {
                    if (retry == maxRetries - 1)
                        throw new Exception("Quá nhiều giao dịch đồng thời, vui lòng thử lại sau (Concurrency Conflict).");
                    
                    _context.ChangeTracker.Clear();
                }
            }
            throw new Exception("Unexpected error during Order creation.");
        }
    }
}

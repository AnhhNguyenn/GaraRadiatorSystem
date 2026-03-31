using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using GarageRadiatorERP.Api.Data;
using GarageRadiatorERP.Api.Models.Finance;
using GarageRadiatorERP.Api.DTOs.Finance;

namespace GarageRadiatorERP.Api.Services.Finance
{
    public interface IFinanceService
    {
        Task<IEnumerable<ExpenseDto>> GetAllExpensesAsync(int page = 1, int limit = 100, System.Threading.CancellationToken cancellationToken = default);
        Task<ExpenseDto> CreateExpenseAsync(CreateExpenseDto createDto, System.Threading.CancellationToken cancellationToken = default);
        Task<ProfitReportDto> GetProfitReportAsync(DateTime startDate, DateTime endDate, System.Threading.CancellationToken cancellationToken = default);
    }

    public class FinanceService : IFinanceService
    {
        private readonly AppDbContext _context;

        public FinanceService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<ExpenseDto>> GetAllExpensesAsync(int page = 1, int limit = 100, System.Threading.CancellationToken cancellationToken = default)
        {
            // Thêm phân trang (Lỗi 50) và CancellationToken (Lỗi 24)
            return await _context.Expenses
                .OrderByDescending(e => e.Date)
                .Skip((page - 1) * limit)
                .Take(limit)
                .Select(e => new ExpenseDto
                {
                    Id = e.Id,
                    Category = e.Category,
                    Amount = e.Amount,
                    Date = e.Date,
                    Note = e.Note
                })
                .ToListAsync(cancellationToken);
        }

        public async Task<ExpenseDto> CreateExpenseAsync(CreateExpenseDto createDto, System.Threading.CancellationToken cancellationToken = default)
        {
            var expense = new Expense
            {
                Category = createDto.Category,
                Amount = createDto.Amount,
                Note = createDto.Note,
                // Fix thời gian ghi nhận và timezone (Lỗi 17 / 39)
                Date = createDto.ExpenseDate ?? GarageRadiatorERP.Api.Utilities.TimeUtility.GetLocalTime()
            };

            _context.Expenses.Add(expense);
            await _context.SaveChangesAsync(cancellationToken);

            return new ExpenseDto
            {
                Id = expense.Id,
                Category = expense.Category,
                Amount = expense.Amount,
                Date = expense.Date,
                Note = expense.Note
            };
        }

        public async Task<ProfitReportDto> GetProfitReportAsync(DateTime startDate, DateTime endDate, System.Threading.CancellationToken cancellationToken = default)
        {
            // Fix Kéo sập Server (Memory Bomb) (Lỗi 19 / 36) - Tính tổng trực tiếp bằng DB
            decimal totalRevenue = await _context.Orders
                .Where(o => o.OrderDate >= startDate && o.OrderDate <= endDate)
                .SumAsync(o => o.TotalAmount, cancellationToken);

            decimal totalCost = await _context.Orders
                .Where(o => o.OrderDate >= startDate && o.OrderDate <= endDate)
                .SumAsync(o => o.TotalCost, cancellationToken);

            decimal totalExpense = await _context.Expenses
                .Where(e => e.Date >= startDate && e.Date <= endDate)
                .SumAsync(e => e.Amount, cancellationToken);

            return new ProfitReportDto
            {
                TotalRevenue = totalRevenue,
                TotalCost = totalCost,
                TotalExpense = totalExpense,
                NetProfit = totalRevenue - totalCost - totalExpense
            };
        }
    }
}

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
        Task<IEnumerable<ExpenseDto>> GetAllExpensesAsync();
        Task<ExpenseDto> CreateExpenseAsync(CreateExpenseDto createDto);
        Task<ProfitReportDto> GetProfitReportAsync(DateTime startDate, DateTime endDate);
    }

    public class FinanceService : IFinanceService
    {
        private readonly AppDbContext _context;

        public FinanceService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<ExpenseDto>> GetAllExpensesAsync()
        {
            return await _context.Expenses
                .Select(e => new ExpenseDto
                {
                    Id = e.Id,
                    Category = e.Category,
                    Amount = e.Amount,
                    Date = e.Date,
                    Note = e.Note
                })
                .ToListAsync();
        }

        public async Task<ExpenseDto> CreateExpenseAsync(CreateExpenseDto createDto)
        {
            var expense = new Expense
            {
                Category = createDto.Category,
                Amount = createDto.Amount,
                Note = createDto.Note,
                Date = DateTime.UtcNow
            };

            _context.Expenses.Add(expense);
            await _context.SaveChangesAsync();

            return new ExpenseDto
            {
                Id = expense.Id,
                Category = expense.Category,
                Amount = expense.Amount,
                Date = expense.Date,
                Note = expense.Note
            };
        }

        public async Task<ProfitReportDto> GetProfitReportAsync(DateTime startDate, DateTime endDate)
        {
            var orders = await _context.Orders
                .Where(o => o.OrderDate >= startDate && o.OrderDate <= endDate)
                .ToListAsync();

            var expenses = await _context.Expenses
                .Where(e => e.Date >= startDate && e.Date <= endDate)
                .ToListAsync();

            decimal totalRevenue = orders.Sum(o => o.TotalAmount);
            decimal totalCost = orders.Sum(o => o.TotalCost);
            decimal totalExpense = expenses.Sum(e => e.Amount);

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

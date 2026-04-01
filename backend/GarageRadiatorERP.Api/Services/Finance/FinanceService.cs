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
        Task<GarageRadiatorERP.Api.DTOs.System.PagedResponseDto<ExpenseDto>> GetAllExpensesAsync(int page = 1, int limit = 100, global::System.Threading.CancellationToken cancellationToken = default);
        Task<ExpenseDto> CreateExpenseAsync(CreateExpenseDto createDto, global::System.Threading.CancellationToken cancellationToken = default);
        Task<ProfitReportDto> GetProfitReportAsync(DateTime startDate, DateTime endDate, global::System.Threading.CancellationToken cancellationToken = default);
    }

    public class FinanceService : IFinanceService
    {
        private readonly AppDbContext _context;

        public FinanceService(AppDbContext context)
        {
            _context = context;
        }


        public async Task<GarageRadiatorERP.Api.DTOs.System.PagedResponseDto<ExpenseDto>> GetAllExpensesAsync(int page = 1, int limit = 100, global::System.Threading.CancellationToken cancellationToken = default)
        {
            // Thêm phân trang (Lỗi 50) và CancellationToken (Lỗi 24)
            var query = _context.Expenses;
            int totalCount = await query.CountAsync(cancellationToken);

            var data = await query
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

            return new GarageRadiatorERP.Api.DTOs.System.PagedResponseDto<ExpenseDto>(data, totalCount, page, limit);
        }


        public async Task<ExpenseDto> CreateExpenseAsync(CreateExpenseDto createDto, global::System.Threading.CancellationToken cancellationToken = default)
        {
            var expense = new Expense
            {
                Category = createDto.Category,
                Amount = createDto.Amount,
                Note = createDto.Note,
                // Fix thời gian ghi nhận (Lỗi 17 / 39)
                Date = createDto.ExpenseDate ?? DateTime.UtcNow // Lỗi 3: Lưu DB phải dùng UTC
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


        public async Task<ProfitReportDto> GetProfitReportAsync(DateTime startDate, DateTime endDate, global::System.Threading.CancellationToken cancellationToken = default)
        {
            // Bối cảnh 1: Đảm bảo thời gian tính là bao gồm trọn vẹn ngày cuối cùng
            var start = startDate.Date;
            var endInclusive = endDate.Date.AddDays(1); // Luôn luôn vét cạn đến 00:00:00 của ngày tiếp theo

            // Fix Kéo sập Server (Memory Bomb) (Lỗi 19 / 36) - Tính tổng trực tiếp bằng DB
            // Fix Lỗi 57: Thảm họa SumAsync trên tập rỗng gây crash 500
            // Fix Lỗi 62: Báo cáo tài chính ảo do quên lọc trạng thái "Đã thanh toán"
            var paidStatus = Models.Orders.PaymentStatus.Paid.ToString();

            decimal totalRevenue = await _context.Orders
                .Where(o => o.OrderDate >= start && o.OrderDate < endInclusive && o.PaymentStatus == paidStatus)
                .SumAsync(o => (decimal?)o.TotalAmount, cancellationToken) ?? 0;

            decimal totalCost = await _context.Orders
                .Where(o => o.OrderDate >= start && o.OrderDate < endInclusive && o.PaymentStatus == paidStatus)
                .SumAsync(o => (decimal?)o.TotalCost, cancellationToken) ?? 0;

            decimal totalExpense = await _context.Expenses
                .Where(e => e.Date >= start && e.Date < endInclusive)
                .SumAsync(e => (decimal?)e.Amount, cancellationToken) ?? 0;

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

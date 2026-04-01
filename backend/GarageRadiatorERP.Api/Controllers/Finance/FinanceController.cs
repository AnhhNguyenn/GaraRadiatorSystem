using Microsoft.AspNetCore.Mvc;
using GarageRadiatorERP.Api.Services.Finance;

namespace GarageRadiatorERP.Api.Controllers.Finance
{
    [ApiController]
    [Route("api/v1/finance")] // Fix Versioning API (Lỗi 8 / 53)
    public class FinanceController : ControllerBase
    {
        private readonly IFinanceService _financeService;

        public FinanceController(IFinanceService financeService)
        {
            _financeService = financeService;
        }

        [HttpGet("profit-report")]
        public async Task<IActionResult> GetProfitReport([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate, CancellationToken cancellationToken)
        {
            // Trả lại logic Timezone chuẩn (Lỗi 3) - Lưu và xử lý UTC, hiển thị do Frontend lo
            var start = startDate ?? new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);
            var end = endDate ?? DateTime.UtcNow;

            // Bối cảnh 3: Mở rộng EndDate để vét cạn doanh thu giờ/phút/giây của ngày cuối cùng
            var inclusiveEnd = end.Date.AddDays(1); // Tránh lỗi làm tròn Ticks của SQL Server

            var result = await _financeService.GetProfitReportAsync(start, inclusiveEnd, cancellationToken);

            // Gắn thêm Period format cho Front-end dễ hiển thị
            var response = new
            {
                Revenue = result.TotalRevenue,
                CostOfGoodsSold = result.TotalCost,
                GrossProfit = result.TotalRevenue - result.TotalCost,
                OperatingExpenses = result.TotalExpense,
                NetProfit = result.NetProfit,
                Period = $"{start.ToString("dd/MM/yyyy")} - {end.ToString("dd/MM/yyyy")}"
            };

            return Ok(response);
        }

        [HttpGet("expenses")]
        public async Task<IActionResult> GetExpenses([FromQuery] int page = 1, [FromQuery] int limit = 100, CancellationToken cancellationToken = default)
        {
            var result = await _financeService.GetAllExpensesAsync(page, limit, cancellationToken);
            return Ok(result);
        }

        [HttpPost("expenses")]
        public async Task<IActionResult> AddExpense([FromBody] GarageRadiatorERP.Api.DTOs.Finance.CreateExpenseDto expenseDto, CancellationToken cancellationToken)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState); // Fix Lỗi DTO Validation (Lỗi 38)
            }

            var result = await _financeService.CreateExpenseAsync(expenseDto, cancellationToken);
            return Ok(result);
        }
    }
}

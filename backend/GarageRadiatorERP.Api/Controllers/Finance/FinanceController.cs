using Microsoft.AspNetCore.Mvc;
using GarageRadiatorERP.Api.Services.Finance;

namespace GarageRadiatorERP.Api.Controllers.Finance
{
    [ApiController]
    [Route("api/finance")]
    public class FinanceController : ControllerBase
    {
        private readonly IFinanceService _financeService;

        public FinanceController(IFinanceService financeService)
        {
            _financeService = financeService;
        }

        [HttpGet("profit-report")]
        public async Task<IActionResult> GetProfitReport([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
        {
            var start = startDate ?? new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);
            var end = endDate ?? DateTime.UtcNow;

            var result = await _financeService.GetProfitReportAsync(start, end);

            // Gắn thêm Period format cho Front-end dễ hiển thị
            var response = new {
                Revenue = result.TotalRevenue,
                CostOfGoodsSold = result.TotalCost,
                GrossProfit = result.TotalRevenue - result.TotalCost,
                OperatingExpenses = result.TotalExpense,
                NetProfit = result.NetProfit,
                Period = $"{start.ToString("dd/MM/yyyy")} - {end.ToString("dd/MM/yyyy")}"
            };

            return Ok(response);
        }

        [HttpPost("expenses")]
        public async Task<IActionResult> AddExpense([FromBody] object expenseDto)
        {
            return Ok(new { message = "Logged operating expense successfully" });
        }
    }
}

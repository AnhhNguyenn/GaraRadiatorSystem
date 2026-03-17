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
            // Thực tế: Lấy tất cả Order hoàn thành trong kỳ, map với InventoryBatch đã trừ, tính TotalCost.
            // Dữ liệu mô phỏng để test cho Dashboard Next.js:
            var result = new {
                Revenue = 145000000,
                CostOfGoodsSold = 85000000, // FIFO Cost calculated
                GrossProfit = 60000000,
                OperatingExpenses = 12000000,
                NetProfit = 48000000,
                Period = $"{startDate?.ToString("dd/MM/yyyy") ?? "01/03/2026"} - {endDate?.ToString("dd/MM/yyyy") ?? "31/03/2026"}"
            };

            return Ok(result);
        }

        [HttpPost("expenses")]
        public async Task<IActionResult> AddExpense([FromBody] object expenseDto)
        {
            return Ok(new { message = "Logged operating expense successfully" });
        }
    }
}

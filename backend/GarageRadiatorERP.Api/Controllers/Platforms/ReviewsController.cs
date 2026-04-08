using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using GarageRadiatorERP.Api.Data;
using Microsoft.EntityFrameworkCore;
using global::System.Linq;
using System;

namespace GarageRadiatorERP.Api.Controllers.Platforms
{
    [ApiController]
    [Route("api/v1/[controller]")]
    public class ReviewsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ReviewsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetReviews()
        {
            var reviews = await _context.ProductReviews
                .Include(r => r.Product)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();

            return Ok(reviews.Select(r => new
            {
                r.Id,
                r.Platform,
                r.PlatformOrderId,
                r.BuyerName,
                r.Rating,
                r.Comment,
                r.Reply,
                ProductName = r.Product?.Name,
                r.CreatedAt,
                r.RepliedAt
            }));
        }

        [HttpPost("{id}/reply")]
        public async Task<IActionResult> ReplyReview(Guid id, [FromBody] string replyText)
        {
            var review = await _context.ProductReviews.FindAsync(id);
            if (review == null) return NotFound("Review not found");

            review.Reply = replyText;
            review.RepliedAt = DateTime.UtcNow;

            // Mock calling Sàn API to reply (e.g. v2.shop.reply_review)
            // await _httpClient.PostAsJsonAsync(...)

            await _context.SaveChangesAsync();
            return Ok(new { message = "Phản hồi đánh giá thành công" });
        }
    }
}

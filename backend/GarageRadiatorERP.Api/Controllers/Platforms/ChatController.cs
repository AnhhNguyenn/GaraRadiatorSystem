using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GarageRadiatorERP.Api.Data;
using GarageRadiatorERP.Api.Models.Platforms;
using System;
using System.Collections.Generic;
using global::System.Linq;
using System.Threading.Tasks;

namespace GarageRadiatorERP.Api.Controllers.Platforms
{
    [ApiController]
    [Route("api/[controller]")]
    public class ChatController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ChatController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("conversations")]
        public async Task<ActionResult<IEnumerable<PlatformConversation>>> GetConversations()
        {
            return await _context.PlatformConversations
                .OrderByDescending(c => c.UpdatedAt)
                .ToListAsync();
        }

        [HttpGet("conversations/{id}/messages")]
        public async Task<ActionResult<IEnumerable<PlatformMessage>>> GetMessages(Guid id)
        {
            return await _context.PlatformMessages
                .Where(m => m.ConversationId == id)
                .OrderBy(m => m.CreatedAt)
                .ToListAsync();
        }

        [HttpPost("conversations/{id}/messages")]
        public async Task<ActionResult<PlatformMessage>> SendMessage(Guid id, [FromBody] string messageText)
        {
            var conversation = await _context.PlatformConversations.FindAsync(id);
            if (conversation == null) return NotFound();

            var message = new PlatformMessage
            {
                ConversationId = id,
                Sender = "Seller",
                Message = messageText,
                CreatedAt = DateTime.UtcNow,
                IsRead = true
            };

            _context.PlatformMessages.Add(message);

            conversation.LastMessage = messageText;
            conversation.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Here we would call the Platform API (Shopee/TikTok) to actually send the message

            return Ok(message);
        }
    }
}

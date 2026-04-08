using System;

namespace GarageRadiatorERP.Api.DTOs.Platforms
{
    public class SendChatMessageDto
    {
        public string MessageText { get; set; } = string.Empty;
        public string? ImageUrl { get; set; }
    }
}

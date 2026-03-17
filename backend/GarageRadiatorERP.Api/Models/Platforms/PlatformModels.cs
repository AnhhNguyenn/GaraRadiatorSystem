using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace GarageRadiatorERP.Api.Models.Platforms
{
    public class PlatformPayload
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        [StringLength(50)]
        public string Platform { get; set; } = string.Empty; // Shopee, TikTok

        public string PayloadJson { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public class PlatformConversation
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        [StringLength(50)]
        public string Platform { get; set; } = string.Empty;

        [Required]
        [StringLength(100)]
        public string BuyerId { get; set; } = string.Empty;

        [StringLength(200)]
        public string? BuyerName { get; set; }

        public string? LastMessage { get; set; }
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public ICollection<PlatformMessage> Messages { get; set; } = new List<PlatformMessage>();
    }

    public class PlatformMessage
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        public Guid ConversationId { get; set; }
        public PlatformConversation Conversation { get; set; } = null!;

        [Required]
        [StringLength(50)]
        public string Sender { get; set; } = string.Empty; // Buyer, Seller

        [Required]
        public string Message { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public bool IsRead { get; set; } = false;
    }

    public class PlatformStore
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        [StringLength(50)]
        public string PlatformName { get; set; } = string.Empty; // "Shopee", "TikTok"

        [Required]
        [StringLength(100)]
        public string StoreName { get; set; } = string.Empty;

        [StringLength(100)]
        public string? ShopId { get; set; } // Identifier given by platform

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public ICollection<PlatformToken> Tokens { get; set; } = new List<PlatformToken>();
    }

    public class PlatformToken
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        public Guid StoreId { get; set; }
        public PlatformStore Store { get; set; } = null!;

        [Required]
        public string AccessToken { get; set; } = string.Empty;

        [Required]
        public string RefreshToken { get; set; } = string.Empty;

        public DateTime ExpiresAt { get; set; }
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}

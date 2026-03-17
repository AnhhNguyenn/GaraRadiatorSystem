using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace GarageRadiatorERP.Api.Models.Vehicles
{
    public class Vehicle
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        [StringLength(100)]
        public string Make { get; set; } = string.Empty; // VD: Honda, Toyota, Ford

        [Required]
        [StringLength(100)]
        public string Model { get; set; } = string.Empty; // VD: Civic, Ranger

        [StringLength(100)]
        public string? SubModel { get; set; } // VD: EX, XLT

        [StringLength(100)]
        public string? Engine { get; set; } // VD: 2.0L 4-Cyl, 3.2L Turbo Diesel

        public int? YearFrom { get; set; }
        public int? YearTo { get; set; }

        [StringLength(50)]
        public string? BodyStyle { get; set; } // VD: Sedan, SUV, Hatchback

        [StringLength(50)]
        public string? Transmission { get; set; } // AT/MT

        // Navigation properties
        public ICollection<ProductVehicleMap> ProductMaps { get; set; } = new List<ProductVehicleMap>();
    }

    public class ProductVehicleMap
    {
        public Guid ProductId { get; set; }
        public Products.Product Product { get; set; } = null!;

        public Guid VehicleId { get; set; }
        public Vehicle Vehicle { get; set; } = null!;

        [StringLength(255)]
        public string? FitmentNotes { get; set; } // Cực kỳ quan trọng, VD: "Chỉ lắp cho xe ráp VN, xe độ cản nhập Mỹ cấn"
    }
}

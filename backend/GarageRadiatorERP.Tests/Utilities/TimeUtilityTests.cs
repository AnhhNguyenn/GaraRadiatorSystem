using System;
using FluentAssertions;
using GarageRadiatorERP.Api.Utilities;
using Xunit;

namespace GarageRadiatorERP.Tests.Utilities
{
    public class TimeUtilityTests
    {
        [Fact]
        public void GetLocalTime_WithValidTimeZone_DoesNotThrow()
        {
            // Act
            // If the environment has "SE Asia Standard Time" or "Asia/Ho_Chi_Minh", this won't fail.
            // But if it lacks both, it falls back to Utc.AddHours(7).
            // We just ensure it doesn't throw and returns a time close to UTC+7.
            var utcNowBefore = DateTime.UtcNow;
            var result = TimeUtility.GetLocalTime();

            // Assert
            var timeDifference = result - utcNowBefore;
            timeDifference.TotalHours.Should().BeInRange(6.99, 7.01);
        }

        [Fact]
        public void GetLocalTime_WithInvalidPrimaryZoneButValidFallback_DoesNotThrow()
        {
            // Arrange
            string invalidPrimary = "Invalid_Zone_123";
            // Find a valid timezone from the system to use as fallback, so the test is robust
            // We can't guarantee what local is, but it should succeed.
            string validFallback = TimeZoneInfo.Local.Id;

            // Act
            var result = TimeUtility.GetLocalTime(invalidPrimary, validFallback);

            // Assert
            // It just shouldn't throw. We don't care about the kind since it varies by system.
            result.Should().BeAfter(DateTime.MinValue);
        }

        [Fact]
        public void GetLocalTime_WithBothInvalidZones_ReturnsUtcPlus7()
        {
            // Arrange
            string invalidPrimary = "Invalid_Primary_Zone";
            string invalidFallback = "Invalid_Fallback_Zone";

            // To check if it returns UTC+7, we can take UtcNow, call the method, and see if
            // the difference is close to 7 hours.
            var utcNowBefore = DateTime.UtcNow;

            // Act
            var result = TimeUtility.GetLocalTime(invalidPrimary, invalidFallback);

            // Assert
            var timeDifference = result - utcNowBefore;

            timeDifference.TotalHours.Should().BeInRange(6.99, 7.01, "Fallback adds 7 hours to UTC");
            result.Kind.Should().Be(DateTimeKind.Utc); // Because utcNow.AddHours(7) preserves Utc Kind
        }
    }
}

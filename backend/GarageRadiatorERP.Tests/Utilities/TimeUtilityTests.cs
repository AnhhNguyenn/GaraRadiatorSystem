using System;
using Xunit;
using GarageRadiatorERP.Api.Utilities;
using FluentAssertions;
using GarageRadiatorERP.Api.Utilities;
using Xunit;

namespace GarageRadiatorERP.Tests.Utilities
{
    public class TimeUtilityTests
    {
        [Fact]
        public void GetLocalTime_ReturnsValidDateTime()
        {
            // Act
            var localTime = TimeUtility.GetLocalTime();

            // Assert
            Assert.NotEqual(default(DateTime), localTime);
            // Verify timezone offset relative to UTC is approximately +7
            var utcTime = DateTime.UtcNow;
            var difference = localTime - utcTime;
            Assert.True(difference.TotalHours >= 6.9 && difference.TotalHours <= 7.1, $"Time difference was {difference.TotalHours} hours");
        }

        [Fact]
        public void GetLocalTime_HandlesTimeZoneNotFoundException_FallbackToIANA()
        {
            // Act
            // Force primary to fail by passing an invalid primary timezone ID
            var localTime = TimeUtility.GetLocalTimeInternal("Invalid_Time_Zone_1", "Asia/Ho_Chi_Minh");

            // Assert
            var utcTime = DateTime.UtcNow;
            var difference = localTime - utcTime;
            Assert.True(difference.TotalHours >= 6.9 && difference.TotalHours <= 7.1, $"Time difference was {difference.TotalHours} hours");
        }

        [Fact]
        public void GetLocalTime_HandlesBothTimeZoneNotFoundExceptions_FallbackToManualOffset()
        {
            // Act
            // Force both to fail by passing invalid timezone IDs for both primary and fallback
            var localTime = TimeUtility.GetLocalTimeInternal("Invalid_Time_Zone_1", "Invalid_Time_Zone_2");

            // Assert
            var utcTime = DateTime.UtcNow;
            var difference = localTime - utcTime;
            // The manual fallback uses .AddHours(7)
            Assert.True(difference.TotalHours >= 6.9 && difference.TotalHours <= 7.1, $"Time difference was {difference.TotalHours} hours");
        }

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
            result.Kind.Should().BeOneOf(DateTimeKind.Utc, DateTimeKind.Unspecified); // Because utcNow.AddHours(7) preserves Utc Kind
        }
    }
}

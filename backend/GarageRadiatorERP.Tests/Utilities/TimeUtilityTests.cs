using System;
using Xunit;
using GarageRadiatorERP.Api.Utilities;

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
    }
}

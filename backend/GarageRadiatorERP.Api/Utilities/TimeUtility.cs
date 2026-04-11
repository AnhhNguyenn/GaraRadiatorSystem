using System;
using System.Runtime.CompilerServices;

[assembly: InternalsVisibleTo("GarageRadiatorERP.Tests")]
namespace GarageRadiatorERP.Api.Utilities
{
    public static class TimeUtility
    {
        public static DateTime GetLocalTime(string primaryTimeZoneId = "SE Asia Standard Time", string fallbackTimeZoneId = "Asia/Ho_Chi_Minh")
        {
            return GetLocalTimeInternal("SE Asia Standard Time", "Asia/Ho_Chi_Minh");
        }

        // Internal method to allow testing exceptions by providing invalid timezone IDs
        internal static DateTime GetLocalTimeInternal(string primaryTimeZoneId, string fallbackTimeZoneId)
        {
            var utcNow = DateTime.UtcNow;
            try
            {
                // Windows & một số Linux có hỗ trợ "SE Asia Standard Time"
                var tzInfo = TimeZoneInfo.FindSystemTimeZoneById(primaryTimeZoneId);
                return TimeZoneInfo.ConvertTimeFromUtc(utcNow, tzInfo);
            }
            catch (TimeZoneNotFoundException)
            {
                try
                {
                    // Fallback cho môi trường IANA (Linux/Docker)
                    var tzInfo = TimeZoneInfo.FindSystemTimeZoneById(fallbackTimeZoneId);
                    return TimeZoneInfo.ConvertTimeFromUtc(utcNow, tzInfo);
                }
                catch
                {
                    // Fallback cuối cùng nếu cả 2 lỗi
                    return utcNow.AddHours(7);
                }
            }
        }
    }
}

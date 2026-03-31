using System;

namespace GarageRadiatorERP.Api.Utilities
{
    public static class TimeUtility
    {
        // Fix Timezone: Trả về giờ Local (SE Asia / ICT UTC+7) thay vì UTC thuần
        // Giải quyết lỗi kế toán và chốt đơn bị lệch ngày
        public static DateTime GetLocalTime()
        {
            var utcNow = DateTime.UtcNow;
            try
            {
                // Windows & một số Linux có hỗ trợ "SE Asia Standard Time"
                var tzInfo = TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time");
                return TimeZoneInfo.ConvertTimeFromUtc(utcNow, tzInfo);
            }
            catch (TimeZoneNotFoundException)
            {
                try
                {
                    // Fallback cho môi trường IANA (Linux/Docker)
                    var tzInfo = TimeZoneInfo.FindSystemTimeZoneById("Asia/Ho_Chi_Minh");
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

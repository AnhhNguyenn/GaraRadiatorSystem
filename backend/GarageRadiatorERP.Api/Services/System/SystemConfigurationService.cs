using System.Threading.Tasks;
using GarageRadiatorERP.Api.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace GarageRadiatorERP.Api.Services.System
{
    public interface ISystemConfigurationService
    {
        Task<string?> GetValueAsync(string key);
        Task<T?> GetValueAsync<T>(string key);
        void ClearCache();
    }

    public class SystemConfigurationService : ISystemConfigurationService
    {
        private readonly AppDbContext _context;
        private readonly IMemoryCache _cache;
        private const string CacheKey = "SystemSettingsCache";

        public SystemConfigurationService(AppDbContext context, IMemoryCache cache)
        {
            _context = context;
            _cache = cache;
        }

        public async Task<string?> GetValueAsync(string key)
        {
            if (!_cache.TryGetValue(CacheKey, out global::System.Collections.Generic.Dictionary<string, string>? settingsCache))
            {
                settingsCache = await _context.SystemSettings
                    .ToDictionaryAsync(s => s.SettingKey, s => s.SettingValue);

                var cacheEntryOptions = new MemoryCacheEntryOptions()
                    .SetSlidingExpiration(global::System.TimeSpan.FromHours(24));

                _cache.Set(CacheKey, settingsCache, cacheEntryOptions);
            }

            if (settingsCache != null && settingsCache.TryGetValue(key, out var value))
            {
                return value;
            }

            return null;
        }

        public async Task<T?> GetValueAsync<T>(string key)
        {
            var strValue = await GetValueAsync(key);
            if (string.IsNullOrEmpty(strValue)) return default;

            try
            {
                var converter = global::System.ComponentModel.TypeDescriptor.GetConverter(typeof(T));
                if (converter != null)
                {
                    return (T?)converter.ConvertFromString(strValue);
                }
                return default;
            }
            catch
            {
                return default;
            }
        }

        public void ClearCache()
        {
            _cache.Remove(CacheKey);
        }
    }
}

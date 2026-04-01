using System;
using System.Collections.Generic;

namespace GarageRadiatorERP.Api.DTOs.System
{
    public class PagedResponseDto<T>
    {
        public IEnumerable<T> Data { get; set; } = new List<T>();
        public int TotalCount { get; set; }
        public int TotalPages { get; set; }
        public int CurrentPage { get; set; }

        public PagedResponseDto(IEnumerable<T> data, int totalCount, int page, int limit)
        {
            Data = data;
            TotalCount = totalCount;
            CurrentPage = page;
            TotalPages = limit > 0 ? (int)Math.Ceiling(totalCount / (double)limit) : 0;
        }
    }
}

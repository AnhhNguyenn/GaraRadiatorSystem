namespace GarageRadiatorERP.Api.Models.Orders
{
    public enum OrderSource
    {
        POS,
        Shopee,
        TikTok,
        Zalo
    }

    public enum OrderStatus
    {
        Pending,
        Reserved,
        Completed,
        Cancelled,
        Returned
    }

    public enum PaymentStatus
    {
        Unpaid,
        Partial,
        Paid,
        Debt
    }
}

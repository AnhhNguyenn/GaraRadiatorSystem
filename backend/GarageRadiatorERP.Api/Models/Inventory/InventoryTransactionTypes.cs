namespace GarageRadiatorERP.Api.Models.Inventory
{
    public static class InventoryTransactionTypes
    {
        public const string Import = "import";
        public const string Sale = "sale";
        public const string Backorder = "backorder";
        public const string Adjustment = "adjustment";
        public const string Return = "return";
        public const string ReturnBackorder = "return_backorder";
        public const string CancelRestore = "cancel_restore";
        public const string CancelRestoreBackorder = "cancel_restore_backorder";
        public const string Damage = "damage";
    }
}

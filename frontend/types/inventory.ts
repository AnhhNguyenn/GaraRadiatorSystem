export interface InventoryBatch {
  id: string;
  productName: string;
  importDate: string;
  locationName: string | null;
  costPrice: number;
  remaining: number;
  quantity: number;
}

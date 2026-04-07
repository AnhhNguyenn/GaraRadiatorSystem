export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  categoryName?: string;
  brand?: string;
  netWeight?: number;
  grossWeight?: number;
  unitOfMeasure?: string;
  currentStock?: number;
  retailPrice?: number;
  standardCost?: number;
  createdAt: string;
}

export interface PagedResponse<T> {
  data: T[];
  totalCount: number;
  page: number;
  limit: number;
}

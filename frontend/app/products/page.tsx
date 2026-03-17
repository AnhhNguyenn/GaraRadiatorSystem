'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, Plus, Settings, Car, Edit, Trash2 } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { api } from '@/lib/apiClient';

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await api.products.list();
      setProducts(data);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product: any) => {
    setSelectedProduct(product);
    setIsEditModalOpen(true);
  };

  const handleDelete = (product: any) => {
    setSelectedProduct(product);
    setIsDeleteModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Sản phẩm</h1>
          <p className="text-sm text-slate-500">Quản lý danh mục sản phẩm, thông số và dòng xe tương thích.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button 
            onClick={() => setIsFilterModalOpen(true)}
            className="inline-flex items-center justify-center rounded-md bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
          >
            <Filter className="mr-2 h-4 w-4 text-slate-400" />
            Lọc
          </button>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500"
          >
            <Plus className="mr-2 h-4 w-4" />
            Thêm sản phẩm
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm tên sản phẩm, mã, dòng xe..."
              className="h-9 w-full rounded-md border border-slate-200 bg-slate-50 pl-9 pr-4 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <select className="h-9 w-full sm:w-auto rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
              <option>Tất cả danh mục</option>
              <option>Két nước</option>
              <option>Nắp két nước</option>
              <option>Ống nước</option>
              <option>Quạt làm mát</option>
            </select>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Mã SP</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Tên sản phẩm</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Danh mục</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Thông số</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Dòng xe</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Tồn kho</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Giá bán</th>
                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Thao tác</span></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-sm text-slate-500">
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-sm text-slate-500">
                    Không tìm thấy sản phẩm nào.
                  </td>
                </tr>
              ) : (
                products.map((product: any) => (
                  <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{product.sku || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">{product.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                        {product.categoryName || 'Sản phẩm'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      <div className="flex items-center gap-1">
                        <Settings className="h-3 w-3 text-slate-400" />
                        {product.brand || '---'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      <div className="flex items-center gap-1">
                        <Car className="h-3 w-3 text-slate-400" />
                        ---
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-slate-900">
                      <span className={(product.currentStock || 0) < 10 ? 'text-rose-600' : 'text-emerald-600'}>
                        {product.currentStock || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-slate-900">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.retailPrice || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleEdit(product)} className="text-indigo-600 hover:text-indigo-900 transition-colors" title="Sửa">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(product)} className="text-rose-600 hover:text-rose-900 transition-colors" title="Xóa">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-slate-200 px-6 py-3 flex items-center justify-between bg-slate-50 rounded-b-xl">
          <p className="text-sm text-slate-500">Hiển thị <span className="font-medium">1</span> đến <span className="font-medium">{products.length}</span> của <span className="font-medium">{products.length}</span> kết quả</p>
          <div className="flex gap-1">
            <button className="px-3 py-1 rounded border border-slate-200 bg-white text-sm text-slate-500 hover:bg-slate-50 disabled:opacity-50" disabled>Trước</button>
            <button className="px-3 py-1 rounded border border-slate-200 bg-white text-sm text-slate-500 hover:bg-slate-50">Sau</button>
          </div>
        </div>
      </div>

      {/* Add Product Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Thêm sản phẩm mới" maxWidth="max-w-2xl">
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setIsAddModalOpen(false); }}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Tên sản phẩm *</label>
              <input type="text" required className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" placeholder="VD: Két nước Toyota Vios 2015-2020" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mã sản phẩm (SKU) *</label>
              <input type="text" required className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" placeholder="VD: RAD-001" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Danh mục *</label>
              <select required className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none">
                <option value="">Chọn danh mục</option>
                <option value="ket_nuoc">Két nước</option>
                <option value="nap_ket">Nắp két nước</option>
                <option value="ong_nuoc">Ống nước</option>
                <option value="quat">Quạt làm mát</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Giá bán lẻ (VNĐ) *</label>
              <input type="number" required className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" placeholder="0" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Giá sỉ / Gara (VNĐ)</label>
              <input type="number" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" placeholder="0" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Thông số kỹ thuật</label>
              <input type="text" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" placeholder="VD: Dày 16mm, Nhôm, 2 hàng ống" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Dòng xe tương thích</label>
              <input type="text" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" placeholder="VD: Vios 1.5G 2015-2020, Yaris 2014" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Mã SKU Shopee / TikTok (Để đồng bộ)</label>
              <input type="text" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" placeholder="Nhập mã SKU trên sàn TMĐT nếu có" />
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 pt-4">
            <button type="button" onClick={() => setIsAddModalOpen(false)} className="rounded-md px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">Hủy</button>
            <button type="submit" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">Lưu sản phẩm</button>
          </div>
        </form>
      </Modal>

      {/* Filter Modal */}
      <Modal isOpen={isFilterModalOpen} onClose={() => setIsFilterModalOpen(false)} title="Lọc sản phẩm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Trạng thái tồn kho</label>
            <select className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none">
              <option>Tất cả</option>
              <option>Còn hàng</option>
              <option>Sắp hết hàng (&lt; 5)</option>
              <option>Hết hàng</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Dòng xe</label>
            <input type="text" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none" placeholder="Nhập tên dòng xe..." />
          </div>
          <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 pt-4">
            <button onClick={() => setIsFilterModalOpen(false)} className="rounded-md px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">Hủy</button>
            <button onClick={() => setIsFilterModalOpen(false)} className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">Áp dụng</button>
          </div>
        </div>
      </Modal>

      {/* Edit Product Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Sửa sản phẩm" maxWidth="max-w-2xl">
        {selectedProduct && (
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setIsEditModalOpen(false); }}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Tên sản phẩm *</label>
                <input type="text" defaultValue={selectedProduct.name} required className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mã sản phẩm (SKU) *</label>
                <input type="text" defaultValue={selectedProduct.sku} disabled className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Danh mục *</label>
                <select required className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none">
                  <option value="ket_nuoc" selected={selectedProduct.categoryName === 'Két nước'}>Két nước</option>
                  <option value="nap_ket" selected={selectedProduct.categoryName === 'Nắp két nước'}>Nắp két nước</option>
                  <option value="ong_nuoc" selected={selectedProduct.categoryName === 'Ống nước'}>Ống nước</option>
                  <option value="quat" selected={selectedProduct.categoryName === 'Quạt làm mát'}>Quạt làm mát</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Giá bán lẻ (VNĐ) *</label>
                <input type="text" defaultValue={selectedProduct.retailPrice} required className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tồn kho</label>
                <input type="number" defaultValue={selectedProduct.currentStock} disabled className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 outline-none" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Thông số kỹ thuật</label>
                <input type="text" defaultValue={selectedProduct.brand} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 pt-4">
              <button type="button" onClick={() => setIsEditModalOpen(false)} className="rounded-md px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">Hủy</button>
              <button type="submit" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">Lưu thay đổi</button>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Xác nhận xóa">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Bạn có chắc chắn muốn xóa sản phẩm <span className="font-bold text-slate-900">{selectedProduct?.name}</span> không? Hành động này không thể hoàn tác.
          </p>
          <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 pt-4">
            <button onClick={() => setIsDeleteModalOpen(false)} className="rounded-md px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">Hủy</button>
            <button onClick={() => setIsDeleteModalOpen(false)} className="rounded-md bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-500">Xóa sản phẩm</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { Search, Filter, Plus, Truck, Building2, Calendar, MoreHorizontal, X, Edit, Info } from 'lucide-react';
import { Modal } from '@/components/ui/modal';

const mockPurchases = [
  { id: 'PO-20260311-01', supplier: 'Nhà máy Phụ tùng Denso', date: '11/03/2026', total: '45,000,000 đ', status: 'completed', items: 5 },
  { id: 'PO-20260310-02', supplier: 'Công ty Nhựa & Cao su Bình Minh', date: '10/03/2026', total: '12,500,000 đ', status: 'completed', items: 12 },
  { id: 'PO-20260308-01', supplier: 'Đại lý Phụ tùng Toyota', date: '08/03/2026', total: '85,000,000 đ', status: 'pending', items: 24 },
  { id: 'PO-20260305-03', supplier: 'Nhà máy Phụ tùng Denso', date: '05/03/2026', total: '32,000,000 đ', status: 'completed', items: 8 },
  { id: 'PO-20260301-01', supplier: 'Công ty TNHH Phụ tùng Ô tô Việt', date: '01/03/2026', total: '18,500,000 đ', status: 'completed', items: 15 },
];

export default function PurchasesPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<any>(null);

  const handleEdit = (purchase: any) => {
    setSelectedPurchase(purchase);
    setIsEditModalOpen(true);
  };

  const handleViewDetails = (purchase: any) => {
    setSelectedPurchase(purchase);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Nhập hàng</h1>
          <p className="text-sm text-slate-500">Quản lý đơn đặt hàng từ nhà cung cấp và nhập kho.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button className="inline-flex items-center justify-center rounded-md bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50">
            <Filter className="mr-2 h-4 w-4 text-slate-400" />
            Lọc
          </button>
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500"
          >
            <Plus className="mr-2 h-4 w-4" />
            Tạo đơn nhập
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-indigo-50 p-3">
              <Truck className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Tổng chi phí nhập (Tháng này)</p>
              <p className="text-xl sm:text-2xl font-bold text-slate-900">193,000,000 đ</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-emerald-50 p-3">
              <Building2 className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Nhà cung cấp</p>
              <p className="text-xl sm:text-2xl font-bold text-slate-900">14</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-amber-50 p-3">
              <Calendar className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Đơn đang chờ giao</p>
              <p className="text-xl sm:text-2xl font-bold text-amber-600">1</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm mã đơn nhập, nhà cung cấp..."
              className="h-9 w-full rounded-md border border-slate-200 bg-slate-50 pl-9 pr-4 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <select className="h-9 w-full sm:w-auto rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
              <option>Tất cả trạng thái</option>
              <option>Đã hoàn thành</option>
              <option>Đang chờ giao</option>
            </select>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Mã Đơn Nhập</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Nhà cung cấp</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Ngày nhập</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Số loại SP</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Tổng tiền</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Trạng thái</th>
                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Thao tác</span></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {mockPurchases.map((purchase) => (
                <tr key={purchase.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">{purchase.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{purchase.supplier}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{purchase.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-slate-500">{purchase.items}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-slate-900">{purchase.total}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      purchase.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {purchase.status === 'completed' ? 'Đã nhập kho' : 'Đang chờ giao'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleEdit(purchase)} className="text-indigo-600 hover:text-indigo-900 transition-colors" title="Sửa">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleViewDetails(purchase)} className="text-slate-400 hover:text-indigo-600 transition-colors" title="Chi tiết">
                        <Info className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-slate-200 px-6 py-3 flex items-center justify-between bg-slate-50 rounded-b-xl">
          <p className="text-sm text-slate-500">Hiển thị <span className="font-medium">1</span> đến <span className="font-medium">5</span> của <span className="font-medium">45</span> đơn nhập</p>
          <div className="flex gap-1">
            <button className="px-3 py-1 rounded border border-slate-200 bg-white text-sm text-slate-500 hover:bg-slate-50 disabled:opacity-50" disabled>Trước</button>
            <button className="px-3 py-1 rounded border border-slate-200 bg-white text-sm text-slate-500 hover:bg-slate-50">Sau</button>
          </div>
        </div>
      </div>

      {/* Create Purchase Modal */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Tạo đơn nhập hàng" maxWidth="max-w-3xl">
        <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); setIsCreateModalOpen(false); }}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nhà cung cấp *</label>
              <select required className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
                <option value="">Chọn nhà cung cấp</option>
                <option value="1">Nhà máy Phụ tùng Denso</option>
                <option value="2">Đại lý Phụ tùng Toyota</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Ngày dự kiến nhập</label>
              <input type="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
            </div>
          </div>
          
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-sm font-medium text-slate-900">Chi tiết sản phẩm nhập</h3>
              <button type="button" className="text-sm text-indigo-600 font-medium hover:text-indigo-700">+ Thêm sản phẩm</button>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-slate-500 mb-1">Sản phẩm</label>
                  <select className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none">
                    <option>Két nước Toyota Vios 2015-2020</option>
                  </select>
                </div>
                <div className="w-24">
                  <label className="block text-xs font-medium text-slate-500 mb-1">Số lượng</label>
                  <input type="number" defaultValue="10" min="1" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none" />
                </div>
                <div className="w-32">
                  <label className="block text-xs font-medium text-slate-500 mb-1">Giá nhập</label>
                  <input type="text" defaultValue="1,100,000" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none" />
                </div>
                <button type="button" className="p-2 text-rose-500 hover:bg-rose-50 rounded-md mb-[1px]">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 flex justify-end">
              <div className="text-right">
                <p className="text-sm text-slate-500">Tổng cộng</p>
                <p className="text-xl font-bold text-indigo-600">11,000,000 đ</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
            <button type="button" onClick={() => setIsCreateModalOpen(false)} className="rounded-md px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">Hủy</button>
            <button type="submit" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">Tạo đơn & Nhập kho</button>
          </div>
        </form>
      </Modal>

      {/* Edit Purchase Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Sửa đơn nhập hàng" maxWidth="max-w-3xl">
        {selectedPurchase && (
          <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); setIsEditModalOpen(false); }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nhà cung cấp *</label>
                <select required className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
                  <option value="">Chọn nhà cung cấp</option>
                  <option value="denso" selected={selectedPurchase.supplier.includes('Denso')}>Nhà máy Phụ tùng Denso</option>
                  <option value="binhminh" selected={selectedPurchase.supplier.includes('Bình Minh')}>Công ty Nhựa & Cao su Bình Minh</option>
                  <option value="toyota" selected={selectedPurchase.supplier.includes('Toyota')}>Đại lý Phụ tùng Toyota</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ngày dự kiến giao *</label>
                <input type="date" required className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Ghi chú</label>
              <textarea rows={2} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" placeholder="Ghi chú thêm về đơn nhập..." />
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 pt-4 mt-6">
              <button type="button" onClick={() => setIsEditModalOpen(false)} className="rounded-md px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">Hủy</button>
              <button type="submit" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">Lưu thay đổi</button>
            </div>
          </form>
        )}
      </Modal>

      {/* Purchase Detail Modal */}
      <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title={`Chi tiết đơn nhập ${selectedPurchase?.id || ''}`} maxWidth="max-w-2xl">
        {selectedPurchase && (
          <div className="space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{selectedPurchase.supplier}</h3>
                <p className="text-sm text-slate-500">Ngày nhập: {selectedPurchase.date}</p>
              </div>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                selectedPurchase.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {selectedPurchase.status === 'completed' ? 'Đã nhập kho' : 'Đang chờ giao'}
              </span>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Sản phẩm</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-slate-500">SL</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-slate-500">Giá nhập</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-slate-500">Thành tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  <tr>
                    <td className="px-4 py-3 text-sm text-slate-900">Két nước Toyota Vios 2015-2020<br/><span className="text-xs text-slate-500">SKU: RAD-001</span></td>
                    <td className="px-4 py-3 text-sm text-right text-slate-900">10</td>
                    <td className="px-4 py-3 text-sm text-right text-slate-500">1,100,000 đ</td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-slate-900">11,000,000 đ</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm text-slate-900">Nắp két nước 1.1 Bar<br/><span className="text-xs text-slate-500">SKU: CAP-003</span></td>
                    <td className="px-4 py-3 text-sm text-right text-slate-900">50</td>
                    <td className="px-4 py-3 text-sm text-right text-slate-500">30,000 đ</td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-slate-900">1,500,000 đ</td>
                  </tr>
                </tbody>
              </table>
              <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 flex justify-between items-center">
                <span className="text-sm font-medium text-slate-700">Tổng cộng</span>
                <span className="text-lg font-bold text-indigo-600">{selectedPurchase.total}</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
              <button onClick={() => setIsDetailModalOpen(false)} className="rounded-md px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">Đóng</button>
              {selectedPurchase.status === 'pending' && (
                <button className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">
                  Xác nhận nhập kho
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, ArrowDownUp, PackagePlus, AlertCircle, PackageMinus, Info } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { api } from '@/lib/apiClient';

export default function InventoryPage() {
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalValue: 0,
    batchCount: 0,
    lowStockCount: 0
  });

  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isCheckModalOpen, setIsCheckModalOpen] = useState(false);
  const [isInboundModalOpen, setIsInboundModalOpen] = useState(false);
  const [isOutboundModalOpen, setIsOutboundModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<any>(null);

  useEffect(() => {
    loadBatches();
  }, []);

  const loadBatches = async () => {
    try {
      setLoading(true);
      const data = await api.inventory.batches();
      setBatches(data);
      
      const totalValue = data.reduce((sum: number, b: any) => sum + (b.remaining * b.costPrice), 0);
      const lowStock = data.filter((b: any) => b.remaining < 10).length;

      setStats({
        totalValue,
        batchCount: data.length,
        lowStockCount: lowStock
      });
    } catch (error) {
      console.error('Failed to load inventory batches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (batch: any) => {
    setSelectedBatch(batch);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Quản lý kho</h1>
          <p className="text-sm text-slate-500">Theo dõi tồn kho theo lô (Batch) và vị trí lưu trữ.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setIsFilterModalOpen(true)} className="inline-flex items-center justify-center rounded-md bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50">
            <Filter className="mr-2 h-4 w-4 text-slate-400" />
            Lọc
          </button>
          <button 
            onClick={() => setIsInboundModalOpen(true)}
            className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-500"
          >
            <PackagePlus className="mr-2 h-4 w-4" />
            Nhập kho
          </button>
          <button 
            onClick={() => setIsOutboundModalOpen(true)}
            className="inline-flex items-center justify-center rounded-md bg-rose-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-rose-500"
          >
            <PackageMinus className="mr-2 h-4 w-4" />
            Xuất kho
          </button>
          <button 
            onClick={() => setIsCheckModalOpen(true)}
            className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500"
          >
            <ArrowDownUp className="mr-2 h-4 w-4" />
            Kiểm kho
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-indigo-50 p-3">
              <PackagePlus className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Tổng giá trị tồn kho</p>
              <p className="text-xl sm:text-2xl font-bold text-slate-900">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(stats.totalValue)}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-emerald-50 p-3">
              <ArrowDownUp className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Tổng số lô hàng</p>
              <p className="text-xl sm:text-2xl font-bold text-slate-900">{stats.batchCount}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-rose-50 p-3">
              <AlertCircle className="h-6 w-6 text-rose-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Lô sắp hết hàng</p>
              <p className="text-xl sm:text-2xl font-bold text-rose-600">{stats.lowStockCount}</p>
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
              placeholder="Tìm mã lô, tên sản phẩm, vị trí..."
              className="h-9 w-full rounded-md border border-slate-200 bg-slate-50 pl-9 pr-4 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <select className="h-9 w-full sm:w-auto rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
              <option>Tất cả kho</option>
              <option>Kho A (Két nước)</option>
              <option>Kho B (Phụ kiện)</option>
            </select>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Mã Lô</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Sản phẩm</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Ngày nhập</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Vị trí</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Giá vốn</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">SL Nhập</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">SL Còn lại</th>
                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Thao tác</span></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-sm text-slate-500">Đang tải dữ liệu...</td>
                </tr>
              ) : batches.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-sm text-slate-500">Không có dữ liệu lô hàng</td>
                </tr>
              ) : batches.map((batch) => (
                <tr key={batch.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">{batch.id.substring(0, 8)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{batch.productName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {new Date(batch.importDate).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                      {batch.locationName || 'Chưa xếp chỗ'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-slate-900">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(batch.costPrice)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-slate-500">{batch.quantity}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-slate-900">
                    <span className={batch.remaining < 10 ? 'text-rose-600' : 'text-emerald-600'}>
                      {batch.remaining}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => handleViewDetails(batch)} className="text-indigo-600 hover:text-indigo-900 transition-colors" title="Chi tiết">
                      <Info className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-slate-200 px-6 py-3 flex items-center justify-between bg-slate-50 rounded-b-xl">
          <p className="text-sm text-slate-500">Hiển thị <span className="font-medium">1</span> đến <span className="font-medium">{batches.length}</span> kết quả</p>
          <div className="flex gap-1">
            <button className="px-3 py-1 rounded border border-slate-200 bg-white text-sm text-slate-500 hover:bg-slate-50 disabled:opacity-50" disabled>Trước</button>
            <button className="px-3 py-1 rounded border border-slate-200 bg-white text-sm text-slate-500 hover:bg-slate-50">Sau</button>
          </div>
        </div>
      </div>

      {/* Filter Modal */}
      <Modal isOpen={isFilterModalOpen} onClose={() => setIsFilterModalOpen(false)} title="Lọc dữ liệu kho">
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setIsFilterModalOpen(false); }}>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Vị trí lưu trữ</label>
            <select className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
              <option value="">Tất cả vị trí</option>
              <option value="kho-a">Kho A</option>
              <option value="kho-b">Kho B</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Trạng thái tồn kho</label>
            <select className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
              <option value="">Tất cả</option>
              <option value="low">Sắp hết hàng</option>
              <option value="out">Hết hàng</option>
              <option value="in-stock">Còn hàng</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 border-t border-slate-200 pt-4 mt-6">
            <button type="button" onClick={() => setIsFilterModalOpen(false)} className="rounded-md px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">Hủy</button>
            <button type="submit" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">Áp dụng lọc</button>
          </div>
        </form>
      </Modal>

      {/* Inventory Check Modal */}
      <Modal isOpen={isCheckModalOpen} onClose={() => setIsCheckModalOpen(false)} title="Kiểm kê kho" maxWidth="max-w-2xl">
        <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); setIsCheckModalOpen(false); }}>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mã lô cần kiểm kê *</label>
              <input type="text" required className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" placeholder="Nhập mã lô (VD: B-20260301-01)" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Số lượng hệ thống</label>
                <input type="text" disabled value="12" className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Số lượng thực tế *</label>
                <input type="number" required className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" placeholder="Nhập số lượng thực tế đếm được" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Ghi chú / Lý do chênh lệch</label>
              <textarea rows={3} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" placeholder="Nhập lý do nếu có chênh lệch (VD: Hư hỏng, mất mát...)" />
            </div>
          </div>
          <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
            <button type="button" onClick={() => setIsCheckModalOpen(false)} className="rounded-md px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">Hủy</button>
            <button type="submit" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">Xác nhận kiểm kê</button>
          </div>
        </form>
      </Modal>

      {/* Inbound Modal */}
      <Modal isOpen={isInboundModalOpen} onClose={() => setIsInboundModalOpen(false)} title="Nhập kho thủ công" maxWidth="max-w-2xl">
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setIsInboundModalOpen(false); }}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Sản phẩm *</label>
              <select required className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
                <option value="">Chọn sản phẩm</option>
                <option value="RAD-001">Két nước Toyota Vios 2015-2020</option>
                <option value="RAD-002">Két nước Innova 2008-2015</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Số lượng *</label>
              <input type="number" required min="1" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Giá vốn (VNĐ) *</label>
              <input type="number" required min="0" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Vị trí lưu trữ</label>
              <input type="text" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" placeholder="VD: Kho A - Kệ 1" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nhà cung cấp</label>
              <input type="text" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" placeholder="VD: Denso" />
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 pt-4">
            <button type="button" onClick={() => setIsInboundModalOpen(false)} className="rounded-md px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">Hủy</button>
            <button type="submit" className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500">Tạo lô nhập kho</button>
          </div>
        </form>
      </Modal>

      {/* Outbound Modal */}
      <Modal isOpen={isOutboundModalOpen} onClose={() => setIsOutboundModalOpen(false)} title="Xuất kho thủ công" maxWidth="max-w-2xl">
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setIsOutboundModalOpen(false); }}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Lô hàng *</label>
              <select required className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
                <option value="">Chọn lô hàng để xuất</option>
                {batches.map(b => (
                  <option key={b.id} value={b.id}>{b.id} - {b.productName} (Tồn: {b.remaining})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Số lượng xuất *</label>
              <input type="number" required min="1" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Lý do xuất *</label>
              <select required className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
                <option value="ban_hang">Bán hàng (Offline/Sàn)</option>
                <option value="hu_hong">Hư hỏng / Lỗi</option>
                <option value="khac">Khác</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Ghi chú</label>
              <input type="text" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" placeholder="Mã đơn hàng hoặc lý do chi tiết..." />
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 pt-4">
            <button type="button" onClick={() => setIsOutboundModalOpen(false)} className="rounded-md px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">Hủy</button>
            <button type="submit" className="rounded-md bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-500">Xác nhận xuất kho</button>
          </div>
        </form>
      </Modal>

      {/* Batch Detail Modal */}
      <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title="Chi tiết lô hàng" maxWidth="max-w-2xl">
        {selectedBatch && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-500">Mã lô</p>
                <p className="font-medium text-slate-900">{selectedBatch.id}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Sản phẩm</p>
                <p className="font-medium text-slate-900">{selectedBatch.product}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Ngày nhập</p>
                <p className="font-medium text-slate-900">{selectedBatch.importDate}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Vị trí lưu trữ</p>
                <p className="font-medium text-slate-900">{selectedBatch.location}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Giá vốn</p>
                <p className="font-medium text-slate-900">{selectedBatch.cost}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Số lượng ban đầu</p>
                <p className="font-medium text-slate-900">{selectedBatch.initialQty}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Số lượng còn lại</p>
                <p className="font-bold text-indigo-600 text-lg">{selectedBatch.remainingQty}</p>
              </div>
            </div>
            
            <div className="border-t border-slate-200 pt-4">
              <h4 className="text-sm font-medium text-slate-900 mb-3">Lịch sử xuất/nhập gần đây</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm border-b border-slate-100 pb-2">
                  <div>
                    <span className="font-medium text-rose-600">Xuất kho</span>
                    <span className="text-slate-500 ml-2">Đơn hàng ORD-001</span>
                  </div>
                  <div className="text-right">
                    <span className="font-medium">-2</span>
                    <p className="text-xs text-slate-400">11/03/2026 08:30</p>
                  </div>
                </div>
                <div className="flex justify-between items-center text-sm border-b border-slate-100 pb-2">
                  <div>
                    <span className="font-medium text-emerald-600">Nhập kho</span>
                    <span className="text-slate-500 ml-2">Nhập hàng mới</span>
                  </div>
                  <div className="text-right">
                    <span className="font-medium">+{selectedBatch.initialQty}</span>
                    <p className="text-xs text-slate-400">{selectedBatch.importDate}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
              <button onClick={() => setIsDetailModalOpen(false)} className="rounded-md px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">Đóng</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

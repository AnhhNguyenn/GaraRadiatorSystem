'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, ArrowDownUp, PackagePlus, AlertCircle, PackageMinus, Info } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { api } from '@/lib/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { InventoryBatch } from '@/types/inventory';

export default function InventoryPage() {
  const [batches, setBatches] = useState<InventoryBatch[]>([]);
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
  const [selectedBatch, setSelectedBatch] = useState<InventoryBatch | null>(null);

  useEffect(() => {
    loadBatches();
  }, []);

  const loadBatches = async () => {
    try {
      setLoading(true);
      const data = await api.inventory.batches();
      setBatches(data);
      
      const totalValue = data.reduce((sum: number, b: InventoryBatch) => sum + (b.remaining * b.costPrice), 0);
      const lowStock = data.filter((b: InventoryBatch) => b.remaining < 10).length;

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
    <div className="space-y-8 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 px-2">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Quản lý kho</h1>
          <p className="text-sm font-medium text-slate-500">Theo dõi tồn kho theo lô (Batch) và vị trí lưu trữ.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => setIsFilterModalOpen(true)} className="rounded-xl border-slate-200 bg-white">
            <Filter className="mr-2 h-4 w-4 text-slate-400" />
            Lọc
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsInboundModalOpen(true)} className="rounded-xl bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100 transition-colors">
            <PackagePlus className="mr-2 h-4 w-4" />
            Nhập kho
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsOutboundModalOpen(true)} className="rounded-xl bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100 transition-colors">
            <PackageMinus className="mr-2 h-4 w-4" />
            Xuất kho
          </Button>
          <Button size="sm" onClick={() => setIsCheckModalOpen(true)} className="rounded-xl shadow-lg shadow-primary/20">
            <ArrowDownUp className="mr-2 h-4 w-4" />
            Kiểm kho
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 px-1">
        <div className="ios-card p-6 flex items-center gap-5">
          <div className="rounded-2xl bg-primary/10 p-4">
            <PackagePlus className="h-7 w-7 text-primary" />
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Tổng giá trị</p>
            <p className="text-2xl font-black text-slate-900 tracking-tighter">
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(stats.totalValue)}
            </p>
          </div>
        </div>
        <div className="ios-card p-6 flex items-center gap-5">
          <div className="rounded-2xl bg-emerald-50 p-4">
            <ArrowDownUp className="h-7 w-7 text-emerald-500" />
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Số lô hàng</p>
            <p className="text-2xl font-black text-slate-900 tracking-tighter">{stats.batchCount}</p>
          </div>
        </div>
        <div className="ios-card p-6 flex items-center gap-5">
          <div className="rounded-2xl bg-rose-50 p-4">
            <AlertCircle className="h-7 w-7 text-rose-500" />
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Sắp hết hàng</p>
            <p className="text-2xl font-black text-rose-600 tracking-tighter">{stats.lowStockCount}</p>
          </div>
        </div>
      </div>

      <div className="ios-card overflow-hidden px-1">
        <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="relative w-full sm:max-w-md group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Tìm mã lô, tên sản phẩm, vị trí..."
              className="pl-11"
            />
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <Select defaultValue="all">
              <SelectTrigger className="h-11 w-full sm:w-auto rounded-2xl border border-slate-100 bg-slate-50 px-4 text-sm font-bold text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all">
                <SelectValue placeholder="Chọn kho" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả kho</SelectItem>
                <SelectItem value="kho-a">Kho A (Két nước)</SelectItem>
                <SelectItem value="kho-b">Kho B (Phụ kiện)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">Mã Lô</TableHead>
              <TableHead>Sản phẩm</TableHead>
              <TableHead>Ngày nhập</TableHead>
              <TableHead>Vị trí</TableHead>
              <TableHead className="text-right">Giá vốn</TableHead>
              <TableHead className="text-right">Tồn hiện tại</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-slate-400 font-medium italic">Đang tải dữ liệu...</TableCell>
              </TableRow>
            ) : batches.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-slate-400 font-medium italic">Không có dữ liệu lô hàng</TableCell>
              </TableRow>
            ) : batches.map((batch) => (
              <TableRow key={batch.id}>
                <TableCell className="font-bold text-primary text-xs uppercase">{batch.id.substring(0, 8)}</TableCell>
                <TableCell className="font-extrabold text-slate-900">{batch.productName}</TableCell>
                <TableCell className="text-xs font-bold text-slate-500">
                  {new Date(batch.importDate).toLocaleDateString('vi-VN')}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="bg-slate-100 text-slate-600 font-bold text-[10px] border-none uppercase tracking-tight">
                    {batch.locationName || 'Chưa xếp chỗ'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-bold text-slate-600">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(batch.costPrice)}
                </TableCell>
                <TableCell className="text-right">
                  <span className={cn(
                    "inline-flex items-center px-2 py-1 rounded-lg font-black",
                    batch.remaining < 10 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
                  )}>
                    {batch.remaining} / {batch.quantity}
                  </span>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon-sm" onClick={() => handleViewDetails(batch)} className="text-slate-400 hover:text-primary hover:bg-primary/5 rounded-full">
                    <Info className="h-5 w-5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        <div className="px-6 py-4 flex items-center justify-between bg-slate-50/50">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Hiển thị <span className="text-slate-900">{batches.length}</span> kết quả</p>
          <div className="flex gap-2">
            <Button variant="outline" size="xs" disabled className="rounded-lg">Trước</Button>
            <Button variant="outline" size="xs" className="rounded-lg">Sau</Button>
          </div>
        </div>
      </div>

      {/* Filter Modal */}
      <Modal isOpen={isFilterModalOpen} onClose={() => setIsFilterModalOpen(false)} title="Lọc dữ liệu kho">
        <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); setIsFilterModalOpen(false); }}>
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Vị trí lưu trữ</label>
            <Select>
              <SelectTrigger className="w-full h-12 rounded-2xl border border-slate-100 bg-slate-50 px-4 text-sm font-bold text-slate-600">
                <SelectValue placeholder="Tất cả vị trí" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả vị trí</SelectItem>
                <SelectItem value="kho-a">Kho A</SelectItem>
                <SelectItem value="kho-b">Kho B</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Trạng thái tồn kho</label>
            <Select>
              <SelectTrigger className="w-full h-12 rounded-2xl border border-slate-100 bg-slate-50 px-4 text-sm font-bold text-slate-600">
                <SelectValue placeholder="Tất cả trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="low">Sắp hết hàng</SelectItem>
                <SelectItem value="out">Hết hàng</SelectItem>
                <SelectItem value="in-stock">Còn hàng</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-3 border-t border-slate-50 pt-6 mt-6">
            <Button variant="ghost" type="button" onClick={() => setIsFilterModalOpen(false)} className="rounded-xl">Hủy</Button>
            <Button type="submit" className="bg-primary rounded-xl px-8">Áp dụng lọc</Button>
          </div>
        </form>
      </Modal>

      {/* Inventory Check Modal */}
      <Modal isOpen={isCheckModalOpen} onClose={() => setIsCheckModalOpen(false)} title="Kiểm kê kho" maxWidth="max-w-2xl">
        <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); setIsCheckModalOpen(false); }}>
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Mã lô cần kiểm kê *</label>
              <Input required placeholder="Nhập mã lô (VD: B-20260301-01)" />
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Số lượng hệ thống</label>
                <Input disabled value="12" className="bg-slate-50 font-bold" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Số lượng thực tế *</label>
                <Input type="number" required placeholder="Nhập số thực tế" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Ghi chú / Lý do chênh lệch</label>
              <textarea rows={3} className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all placeholder:font-normal" placeholder="Nhập lý do nếu có chênh lệch..." />
            </div>
          </div>
          <div className="flex justify-end gap-3 border-t border-slate-50 pt-6">
            <Button variant="ghost" type="button" onClick={() => setIsCheckModalOpen(false)} className="rounded-xl">Hủy</Button>
            <Button type="submit" className="bg-primary rounded-xl px-8">Xác nhận kiểm kê</Button>
          </div>
        </form>
      </Modal>

      {/* Inbound Modal */}
      <Modal isOpen={isInboundModalOpen} onClose={() => setIsInboundModalOpen(false)} title="Nhập kho" maxWidth="max-w-2xl">
        <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); setIsInboundModalOpen(false); }}>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Sản phẩm *</label>
              <Select required>
                <SelectTrigger className="w-full h-12 rounded-2xl border border-slate-100 bg-slate-50 px-4 text-sm font-bold text-slate-600">
                  <SelectValue placeholder="Chọn sản phẩm" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RAD-001">Két nước Toyota Vios 2015-2020</SelectItem>
                  <SelectItem value="RAD-002">Két nước Innova 2008-2015</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Số lượng *</label>
              <Input type="number" required min="1" />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Giá vốn (VNĐ) *</label>
              <Input type="number" required min="0" />
            </div>
          </div>
          <div className="mt-8 flex justify-end gap-3 border-t border-slate-50 pt-6">
            <Button variant="ghost" type="button" onClick={() => setIsInboundModalOpen(false)} className="rounded-xl">Hủy</Button>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-8">Tạo lô nhập kho</Button>
          </div>
        </form>
      </Modal>

      {/* Outbound Modal */}
      <Modal isOpen={isOutboundModalOpen} onClose={() => setIsOutboundModalOpen(false)} title="Xuất kho" maxWidth="max-w-2xl">
        <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); setIsOutboundModalOpen(false); }}>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Lô hàng *</label>
              <Select required>
                <SelectTrigger className="w-full h-12 rounded-2xl border border-slate-100 bg-slate-50 px-4 text-sm font-bold text-slate-600">
                  <SelectValue placeholder="Chọn lô hàng để xuất" />
                </SelectTrigger>
                <SelectContent>
                  {batches.map(b => (
                    <SelectItem key={b.id} value={b.id}>{b.id.substring(0,8)} - {b.productName} (Tồn: {b.remaining})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Số lượng xuất *</label>
              <Input type="number" required min="1" />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Lý do *</label>
              <Select required defaultValue="ban_hang">
                <SelectTrigger className="w-full h-12 rounded-2xl border border-slate-100 bg-slate-50 px-4 text-sm font-bold text-slate-600">
                  <SelectValue placeholder="Lý do xuất" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ban_hang">Bán hàng</SelectItem>
                  <SelectItem value="hu_hong">Hư hỏng / Lỗi</SelectItem>
                  <SelectItem value="khac">Khác</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-8 flex justify-end gap-3 border-t border-slate-50 pt-6">
            <Button variant="ghost" type="button" onClick={() => setIsOutboundModalOpen(false)} className="rounded-xl">Hủy</Button>
            <Button type="submit" className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl px-8">Xác nhận xuất</Button>
          </div>
        </form>
      </Modal>

      {/* Batch Detail Modal */}
      <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title="Chi tiết lô hàng" maxWidth="max-w-2xl">
        {selectedBatch && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 gap-6">
              <div className="p-4 bg-slate-50 rounded-2xl">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Mã lô</p>
                <p className="font-bold text-slate-900">{selectedBatch.id}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Sản phẩm</p>
                <p className="font-bold text-slate-900">{selectedBatch.productName}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ngày nhập</p>
                <p className="font-bold text-slate-900">{new Date(selectedBatch.importDate).toLocaleDateString('vi-VN')}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Vị trí</p>
                <p className="font-bold text-slate-900">{selectedBatch.locationName || 'Chưa xếp chỗ'}</p>
              </div>
              <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Số lượng còn lại</p>
                <p className="text-2xl font-black text-primary tracking-tighter">{selectedBatch.remaining}</p>
              </div>
            </div>
            
            <div className="border-t border-slate-50 pt-6">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 italic">Lịch sử biến động gần đây</h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-rose-50 rounded-xl text-rose-600">
                      <PackageMinus className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">Xuất kho: Đơn hàng ORD-001</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">11/03/2026 08:30</p>
                    </div>
                  </div>
                  <span className="font-black text-rose-600">-2</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-50">
              <Button onClick={() => setIsDetailModalOpen(false)} className="rounded-xl px-10">Đóng</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

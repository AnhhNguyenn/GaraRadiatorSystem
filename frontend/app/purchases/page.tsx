'use client';

import { useState } from 'react';
import { Search, Filter, Plus, Truck, Building2, Calendar, MoreHorizontal, X, Edit, Info, ShoppingCart, PackageOpen, Inbox } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
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

const mockPurchases = [
  { id: 'PO-20260311-01', supplier: 'Nhà máy Phụ tùng Denso', date: '11/03/2026', total: 45000000, status: 'completed', items: 5 },
  { id: 'PO-20260310-02', supplier: 'Công ty Nhựa & Cao su Bình Minh', date: '10/03/2026', total: 12500000, status: 'completed', items: 12 },
  { id: 'PO-20260308-01', supplier: 'Đại lý Phụ tùng Toyota', date: '08/03/2026', total: 85000000, status: 'pending', items: 24 },
  { id: 'PO-20260305-03', supplier: 'Nhà máy Phụ tùng Denso', date: '05/03/2026', total: 32000000, status: 'completed', items: 8 },
  { id: 'PO-20260301-01', supplier: 'Công ty TNHH Phụ tùng Ô tô Việt', date: '01/03/2026', total: 18500000, status: 'completed', items: 15 },
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
    <div className="space-y-8 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 px-2">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Nhập hàng</h1>
          <p className="text-sm font-medium text-slate-500">Đối soát linh kiện và quản lý chuỗi cung ứng nhà máy.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" size="sm" className="rounded-xl border-slate-200">
            <Filter className="mr-2 h-4 w-4 text-slate-400" />
            Lọc đơn nhập
          </Button>
          <Button size="sm" onClick={() => setIsCreateModalOpen(true)} className="rounded-xl shadow-lg shadow-primary/20">
            <ShoppingCart className="mr-2 h-4 w-4" />
            Tạo đơn nhập
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 px-1">
        <div className="ios-card p-6 flex items-center gap-5">
          <div className="rounded-2xl bg-primary/10 p-4">
            <PackageOpen className="h-7 w-7 text-primary" />
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Chi phí tháng</p>
            <p className="text-2xl font-black text-slate-900 tracking-tighter">193,000,000 đ</p>
          </div>
        </div>
        <div className="ios-card p-6 flex items-center gap-5">
          <div className="rounded-2xl bg-indigo-50 p-4">
            <Building2 className="h-7 w-7 text-indigo-500" />
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Nhà cung cấp</p>
            <p className="text-2xl font-black text-slate-900 tracking-tighter">14</p>
          </div>
        </div>
        <div className="ios-card p-6 flex items-center gap-5 border-l-4 border-l-amber-500">
          <div className="rounded-2xl bg-amber-50 p-4">
            <Inbox className="h-7 w-7 text-amber-500" />
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Chờ nhận hàng</p>
            <p className="text-2xl font-black text-amber-600 tracking-tighter">01</p>
          </div>
        </div>
      </div>

      <div className="ios-card overflow-hidden px-1">
        <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="relative w-full sm:max-w-md group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Tìm mã đơn nhập, nhà cung cấp..."
              className="pl-11"
            />
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <Select defaultValue="all">
              <SelectTrigger className="h-11 w-full sm:w-auto rounded-2xl border border-slate-100 bg-slate-50 px-4 text-sm font-bold text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Trạng thái: Tất cả</SelectItem>
                <SelectItem value="completed">Đã hoàn thành</SelectItem>
                <SelectItem value="pending">Đang xử lý</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[180px]">Mã Đơn Nhập</TableHead>
              <TableHead>Nhà cung cấp</TableHead>
              <TableHead>Ngày nhập</TableHead>
              <TableHead className="text-right">Loại SP</TableHead>
              <TableHead className="text-right">Tổng tiền</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockPurchases.map((purchase) => (
              <TableRow key={purchase.id}>
                <TableCell className="font-bold text-slate-400 text-xs uppercase">{purchase.id}</TableCell>
                <TableCell className="font-extrabold text-slate-900">{purchase.supplier}</TableCell>
                <TableCell className="text-xs font-bold text-slate-500 italic">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3 text-slate-300" />
                    {purchase.date}
                  </div>
                </TableCell>
                <TableCell className="text-right font-black text-slate-400">{purchase.items}</TableCell>
                <TableCell className="text-right font-black text-slate-900">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(purchase.total)}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn(
                    "font-bold rounded-lg border",
                    purchase.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                  )}>
                    {purchase.status === 'completed' ? 'Đã nhập kho' : 'Chờ giao'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="icon-sm" onClick={() => handleEdit(purchase)} className="text-slate-400 hover:text-primary hover:bg-primary/5 rounded-full">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => handleViewDetails(purchase)} className="text-slate-400 hover:text-primary hover:bg-primary/5 rounded-full">
                      <Info className="h-5 w-5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        <div className="px-6 py-4 flex items-center justify-between bg-slate-50/50">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest italic">
            Hiển thị <span className="text-slate-900 font-black not-italic">{mockPurchases.length}</span> vận đơn nhập
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="xs" disabled className="rounded-lg">Trước</Button>
            <Button variant="outline" size="xs" className="rounded-lg">Sau</Button>
          </div>
        </div>
      </div>

      {/* Create Purchase Modal */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Tạo vận đơn nhập hàng mới" maxWidth="max-w-3xl">
        <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); setIsCreateModalOpen(false); }}>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Nhà cung cấp *</label>
              <Select required>
                <SelectTrigger className="w-full h-12 rounded-2xl border border-slate-100 bg-slate-50 px-4 text-sm font-bold text-slate-600">
                  <SelectValue placeholder="Chọn đơn vị cung ứng" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Nhà máy Phụ tùng Denso</SelectItem>
                  <SelectItem value="2">Đại lý Phụ tùng Toyota</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Ngày dự kiến nhập</label>
              <input type="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-full h-12 rounded-2xl border border-slate-100 bg-slate-50 px-4 text-sm font-bold text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all" />
            </div>
          </div>
          
          <div className="bg-slate-50/50 p-1 border border-slate-100 rounded-3xl overflow-hidden shadow-inner">
            <div className="px-6 py-4 flex justify-between items-center">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Danh mục linh kiện nhập</h3>
              <Button variant="ghost" type="button" size="sm" className="text-primary font-bold hover:bg-primary/5 rounded-xl">+ Thêm dòng SP</Button>
            </div>
            <div className="px-5 pb-5 space-y-4">
              <div className="flex gap-4 items-end bg-white p-4 rounded-2xl border border-slate-50 shadow-sm relative group">
                <div className="flex-1">
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Tên sản phẩm</label>
                  <Select defaultValue="vios">
                    <SelectTrigger className="w-full h-11 rounded-xl border border-slate-100 bg-slate-50 px-4 text-sm font-bold">
                      <SelectValue placeholder="Sản phẩm" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vios">Két nước Toyota Vios 2015-2020</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-24">
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Số lượng</label>
                  <Input type="number" defaultValue="10" min="1" className="h-11 rounded-xl" />
                </div>
                <div className="w-32">
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Đơn giá nhập</label>
                  <Input type="text" defaultValue="1,100,000" className="h-11 rounded-xl" />
                </div>
                <Button variant="ghost" size="icon-sm" className="text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-full mb-1">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="p-6 bg-white border-t border-slate-50 flex justify-end">
              <div className="text-right">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Tổng cộng dự kiến</p>
                <p className="text-3xl font-black text-primary tracking-tighter">11,000,000 đ</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" type="button" onClick={() => setIsCreateModalOpen(false)} className="rounded-xl font-bold">Hủy</Button>
            <Button type="submit" className="rounded-xl px-12 bg-primary shadow-lg shadow-primary/20 font-bold">Xác nhận & Nhập kho</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

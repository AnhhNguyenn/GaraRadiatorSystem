'use client';

import { useState } from 'react';
import { Search, Filter, Plus, User, Phone, MapPin, MoreHorizontal, Edit, Info, Users, UserPlus, Star, Store } from 'lucide-react';
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

const mockCustomers = [
  { id: 'CUS-001', name: 'Gara Auto Phát', type: 'Gara', phone: '0901234567', address: '123 Nguyễn Văn Cừ, Q5, TP.HCM', totalOrders: 45, totalSpent: 125000000 },
  { id: 'CUS-002', name: 'Gara Thành Đạt', type: 'Gara', phone: '0987654321', address: '456 Lê Hồng Phong, Q10, TP.HCM', totalOrders: 28, totalSpent: 85400000 },
  { id: 'CUS-003', name: 'Nguyễn Văn A', type: 'Cá nhân', phone: '0912345678', address: '789 Trần Hưng Đạo, Q1, TP.HCM', totalOrders: 2, totalSpent: 3200000 },
  { id: 'CUS-004', name: 'Trần Thị B', type: 'Cá nhân', phone: '0933445566', address: 'Shopee Customer', totalOrders: 1, totalSpent: 1200000 },
  { id: 'CUS-005', name: 'Gara Minh Trí', type: 'Gara', phone: '0909887766', address: '321 Phạm Văn Đồng, Thủ Đức', totalOrders: 15, totalSpent: 42000000 },
];

export default function CustomersPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  const handleEdit = (customer: any) => {
    setSelectedCustomer(customer);
    setIsEditModalOpen(true);
  };

  const handleViewDetails = (customer: any) => {
    setSelectedCustomer(customer);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 px-2">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Khách hàng</h1>
          <p className="text-sm font-medium text-slate-500">Quản lý mạng lưới khách hàng cá nhân và các đối tác Gara chiến lược.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" size="sm" className="rounded-xl border-slate-200">
            <Filter className="mr-2 h-4 w-4 text-slate-400" />
            Lọc khách hàng
          </Button>
          <Button size="sm" onClick={() => setIsAddModalOpen(true)} className="rounded-xl shadow-lg shadow-primary/20">
            <UserPlus className="mr-2 h-4 w-4" />
            Thêm đối tác
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 px-1">
        <div className="ios-card p-6 flex items-center gap-5">
          <div className="rounded-2xl bg-primary/10 p-4">
            <Users className="h-7 w-7 text-primary" />
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Tổng khách</p>
            <p className="text-2xl font-black text-slate-900 tracking-tighter">1,245</p>
          </div>
        </div>
        <div className="ios-card p-6 flex items-center gap-5">
          <div className="rounded-2xl bg-indigo-50 p-4">
            <Store className="h-7 w-7 text-indigo-500" />
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Đối tác Gara</p>
            <p className="text-2xl font-black text-slate-900 tracking-tighter">85</p>
          </div>
        </div>
        <div className="ios-card p-6 flex items-center gap-5 border-l-4 border-l-emerald-500">
          <div className="rounded-2xl bg-emerald-50 p-4">
            <Star className="h-7 w-7 text-emerald-500" />
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Khách mới</p>
            <p className="text-2xl font-black text-emerald-600 tracking-tighter">+124</p>
          </div>
        </div>
      </div>

      <div className="ios-card overflow-hidden px-1">
        <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="relative w-full sm:max-w-md group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Tìm tên khách hàng, số điện thoại..."
              className="pl-11"
            />
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <Select defaultValue="all">
              <SelectTrigger className="h-11 w-full sm:w-auto rounded-2xl border border-slate-100 bg-slate-50 px-4 text-sm font-bold text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all">
                <SelectValue placeholder="Loại khách" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Loại khách: Tất cả</SelectItem>
                <SelectItem value="gara">Gara đối tác</SelectItem>
                <SelectItem value="individual">Khách lẻ</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">Mã KH</TableHead>
              <TableHead>Tên khách hàng</TableHead>
              <TableHead>Phân loại</TableHead>
              <TableHead>Liên hệ</TableHead>
              <TableHead className="text-right">Số đơn</TableHead>
              <TableHead className="text-right">Tổng chi tiêu</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockCustomers.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell className="font-bold text-primary text-xs uppercase">{customer.id}</TableCell>
                <TableCell className="font-extrabold text-slate-900">{customer.name}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className={cn(
                    "font-black uppercase text-[10px] tracking-tight border-none",
                    customer.type === 'Gara' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-500'
                  )}>
                    {customer.type}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs font-bold text-slate-500">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <Phone className="h-3 w-3 text-slate-300" />
                      {customer.phone}
                    </div>
                    <div className="flex items-center gap-2 italic text-slate-400 font-medium">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate max-w-[180px]">{customer.address}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right font-black text-slate-400">{customer.totalOrders}</TableCell>
                <TableCell className="text-right font-black text-slate-900">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(customer.totalSpent)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="icon-sm" onClick={() => handleEdit(customer)} className="text-slate-400 hover:text-primary hover:bg-primary/5 rounded-full">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => handleViewDetails(customer)} className="text-slate-400 hover:text-primary hover:bg-primary/5 rounded-full">
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
            Hiển thị <span className="text-slate-900 font-black not-italic">{mockCustomers.length}</span> đối tác
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="xs" disabled className="rounded-lg">Trước</Button>
            <Button variant="outline" size="xs" className="rounded-lg">Sau</Button>
          </div>
        </div>
      </div>

      {/* Add Customer Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Thêm khách hàng / Gara mới">
        <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); setIsAddModalOpen(false); }}>
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Tên khách hàng / Gara *</label>
              <Input required placeholder="VD: Gara Auto Phát" />
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Loại khách hàng *</label>
                <Select required>
                  <SelectTrigger className="w-full h-12 rounded-2xl border border-slate-100 bg-slate-50 px-4 text-sm font-bold text-slate-600">
                    <SelectValue placeholder="Loại khách hàng" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cá nhân">Cá nhân</SelectItem>
                    <SelectItem value="Gara">Gara đối tác</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Số điện thoại *</label>
                <Input required placeholder="VD: 0901234567" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Địa chỉ</label>
              <textarea rows={2} className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all placeholder:font-normal" placeholder="Nhập địa chỉ chi tiết khách hàng..." />
            </div>
          </div>
          <div className="mt-8 flex justify-end gap-3 border-t border-slate-50 pt-6">
            <Button variant="ghost" type="button" onClick={() => setIsAddModalOpen(false)} className="rounded-xl">Hủy</Button>
            <Button type="submit" className="rounded-xl bg-primary px-8">Lưu khách hàng</Button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal would follow same logic... */}
    </div>
  );
}

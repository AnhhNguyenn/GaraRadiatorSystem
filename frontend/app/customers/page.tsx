'use client';

import { useState } from 'react';
import { Search, Filter, Plus, User, Phone, MapPin, MoreHorizontal, Edit, Info } from 'lucide-react';
import { Modal } from '@/components/ui/modal';

const mockCustomers = [
  { id: 'CUS-001', name: 'Gara Auto Phát', type: 'Gara', phone: '0901234567', address: '123 Nguyễn Văn Cừ, Q5, TP.HCM', totalOrders: 45, totalSpent: '125,000,000 đ' },
  { id: 'CUS-002', name: 'Gara Thành Đạt', type: 'Gara', phone: '0987654321', address: '456 Lê Hồng Phong, Q10, TP.HCM', totalOrders: 28, totalSpent: '85,400,000 đ' },
  { id: 'CUS-003', name: 'Nguyễn Văn A', type: 'Cá nhân', phone: '0912345678', address: '789 Trần Hưng Đạo, Q1, TP.HCM', totalOrders: 2, totalSpent: '3,200,000 đ' },
  { id: 'CUS-004', name: 'Trần Thị B', type: 'Cá nhân', phone: '0933445566', address: 'Shopee Customer', totalOrders: 1, totalSpent: '1,200,000 đ' },
  { id: 'CUS-005', name: 'Gara Minh Trí', type: 'Gara', phone: '0909887766', address: '321 Phạm Văn Đồng, Thủ Đức', totalOrders: 15, totalSpent: '42,000,000 đ' },
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Khách hàng</h1>
          <p className="text-sm text-slate-500">Quản lý thông tin khách hàng cá nhân và các Gara đối tác.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button className="inline-flex items-center justify-center rounded-md bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50">
            <Filter className="mr-2 h-4 w-4 text-slate-400" />
            Lọc
          </button>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500"
          >
            <Plus className="mr-2 h-4 w-4" />
            Thêm khách hàng
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-indigo-50 p-3">
              <User className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Tổng khách hàng</p>
              <p className="text-xl sm:text-2xl font-bold text-slate-900">1,245</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-emerald-50 p-3">
              <User className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Gara đối tác</p>
              <p className="text-xl sm:text-2xl font-bold text-slate-900">85</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-amber-50 p-3">
              <User className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Khách hàng mới (Tháng này)</p>
              <p className="text-xl sm:text-2xl font-bold text-amber-600">+124</p>
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
              placeholder="Tìm tên khách hàng, số điện thoại..."
              className="h-9 w-full rounded-md border border-slate-200 bg-slate-50 pl-9 pr-4 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <select className="h-9 w-full sm:w-auto rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
              <option>Tất cả loại khách</option>
              <option>Gara đối tác</option>
              <option>Khách lẻ</option>
            </select>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Mã KH</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Tên khách hàng</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Loại</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Liên hệ</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Số đơn hàng</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Tổng chi tiêu</th>
                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Thao tác</span></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {mockCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">{customer.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{customer.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                      customer.type === 'Gara' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {customer.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3 text-slate-400" />
                        {customer.phone}
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        <MapPin className="h-3 w-3 text-slate-400" />
                        <span className="truncate max-w-[200px]">{customer.address}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-slate-500">{customer.totalOrders}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-slate-900">{customer.totalSpent}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleEdit(customer)} className="text-indigo-600 hover:text-indigo-900 transition-colors" title="Sửa">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleViewDetails(customer)} className="text-slate-400 hover:text-indigo-600 transition-colors" title="Chi tiết">
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
          <p className="text-sm text-slate-500">Hiển thị <span className="font-medium">1</span> đến <span className="font-medium">5</span> của <span className="font-medium">1,245</span> khách hàng</p>
          <div className="flex gap-1">
            <button className="px-3 py-1 rounded border border-slate-200 bg-white text-sm text-slate-500 hover:bg-slate-50 disabled:opacity-50" disabled>Trước</button>
            <button className="px-3 py-1 rounded border border-slate-200 bg-white text-sm text-slate-500 hover:bg-slate-50">Sau</button>
          </div>
        </div>
      </div>

      {/* Add Customer Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Thêm khách hàng mới">
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setIsAddModalOpen(false); }}>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tên khách hàng / Gara *</label>
            <input type="text" required className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" placeholder="Nhập tên khách hàng" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Loại khách hàng *</label>
            <select required className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
              <option value="Cá nhân">Cá nhân</option>
              <option value="Gara">Gara đối tác</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Số điện thoại *</label>
            <input type="text" required className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" placeholder="Nhập số điện thoại" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Địa chỉ</label>
            <textarea rows={2} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" placeholder="Nhập địa chỉ" />
          </div>
          <div className="flex justify-end gap-3 border-t border-slate-200 pt-4 mt-6">
            <button type="button" onClick={() => setIsAddModalOpen(false)} className="rounded-md px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">Hủy</button>
            <button type="submit" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">Lưu khách hàng</button>
          </div>
        </form>
      </Modal>

      {/* Edit Customer Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Sửa thông tin khách hàng">
        {selectedCustomer && (
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setIsEditModalOpen(false); }}>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tên khách hàng / Gara *</label>
              <input type="text" defaultValue={selectedCustomer.name} required className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Loại khách hàng *</label>
              <select required className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
                <option value="Cá nhân" selected={selectedCustomer.type === 'Cá nhân'}>Cá nhân</option>
                <option value="Gara" selected={selectedCustomer.type === 'Gara'}>Gara đối tác</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Số điện thoại *</label>
              <input type="text" defaultValue={selectedCustomer.phone} required className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Địa chỉ</label>
              <textarea rows={2} defaultValue={selectedCustomer.address} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-200 pt-4 mt-6">
              <button type="button" onClick={() => setIsEditModalOpen(false)} className="rounded-md px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">Hủy</button>
              <button type="submit" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">Lưu thay đổi</button>
            </div>
          </form>
        )}
      </Modal>

      {/* Customer Detail Modal */}
      <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title="Chi tiết khách hàng" maxWidth="max-w-2xl">
        {selectedCustomer && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 border-b border-slate-200 pb-4">
              <div className="h-16 w-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                <User className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">{selectedCustomer.name}</h3>
                <p className="text-sm text-slate-500">{selectedCustomer.id} • <span className="font-medium text-slate-700">{selectedCustomer.type}</span></p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Thông tin liên hệ</h4>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Số điện thoại</p>
                  <p className="text-sm font-medium text-slate-900 flex items-center gap-2">
                    <Phone className="h-4 w-4 text-slate-400" /> {selectedCustomer.phone}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Địa chỉ</p>
                  <p className="text-sm font-medium text-slate-900 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-slate-400" /> {selectedCustomer.address}
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Thống kê mua hàng</h4>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <p className="text-xs text-slate-500 mb-1">Tổng số đơn hàng</p>
                  <p className="text-lg font-bold text-indigo-600">{selectedCustomer.totalOrders}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <p className="text-xs text-slate-500 mb-1">Tổng chi tiêu</p>
                  <p className="text-lg font-bold text-emerald-600">{selectedCustomer.totalSpent}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
              <button onClick={() => setIsDetailModalOpen(false)} className="rounded-md px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">Đóng</button>
              <button onClick={() => { setIsDetailModalOpen(false); handleEdit(selectedCustomer); }} className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">
                Sửa thông tin
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

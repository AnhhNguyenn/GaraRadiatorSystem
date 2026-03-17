'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Filter, Printer, CheckCircle, Clock, Truck, AlertTriangle, RefreshCw, Plus, Edit, MessageSquare, MapPin, CreditCard, Package, Store, X } from 'lucide-react';
import { cn } from '@/components/sidebar';
import { Modal } from '@/components/ui/modal';
import { api } from '@/lib/apiClient';

interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

interface OnlineDetails {
  platform: string;
  platformOrderId: string;
  buyerName?: string;
  shippingAddress?: string;
  shippingCode?: string;
  trackingCode?: string;
  labelUrl?: string;
}

interface Order {
  id: string;
  customerName?: string;
  source: string;
  status: string;
  orderDate: string;
  totalAmount: number;
  items: OrderItem[];
  onlineDetails?: OnlineDetails;
}

const tabs = [
  { id: 'offline', name: 'Tại cửa hàng / Gara' },
  { id: 'shopee', name: 'Đơn Shopee' },
  { id: 'tiktok', name: 'Đơn TikTok' },
  { id: 'errors', name: 'Lỗi đồng bộ (DLQ)' },
];

const mockErrors = [
  { id: 'ERR-001', platform: 'Shopee', orderSn: '230311ABC', error: 'Không tìm thấy SKU mapping: SHP-RAD-001', time: '11/03/2026 09:45', retryCount: 5 },
  { id: 'ERR-002', platform: 'TikTok', orderSn: 'TT-998877', error: 'Lỗi kết nối Database (Timeout)', time: '11/03/2026 08:20', retryCount: 5 },
];

const statusConfig: Record<string, { label: string, color: string, icon: any }> = {
  pending: { label: 'Chờ xác nhận', color: 'bg-amber-100 text-amber-800', icon: Clock },
  confirmed: { label: 'Đã xác nhận', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
  printed: { label: 'Đã in mã', color: 'bg-indigo-100 text-indigo-800', icon: Printer },
  shipped: { label: 'Đang giao', color: 'bg-purple-100 text-purple-800', icon: Truck },
  completed: { label: 'Hoàn thành', color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle },
  'pending confirmation': { label: 'Chờ xác nhận', color: 'bg-amber-100 text-amber-800', icon: Clock },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('shopee');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isMappingModalOpen, setIsMappingModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedError, setSelectedError] = useState<any>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await api.orders.list();
      setOrders(data);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredOrders = () => {
    return orders.filter(order => {
      const source = order.source?.toLowerCase();
      if (activeTab === 'offline') return source === 'pos' || source === 'offline';
      if (activeTab === 'shopee') return source === 'shopee';
      if (activeTab === 'tiktok') return source === 'tiktok';
      return false;
    });
  };

  const filteredOrders = getFilteredOrders();

  const getPlatformCount = (tabId: string) => {
    if (tabId === 'errors') return mockErrors.length;
    return orders.filter(order => {
      const source = order.source?.toLowerCase();
      if (tabId === 'offline') return source === 'pos' || source === 'offline';
      if (tabId === 'shopee') return source === 'shopee';
      if (tabId === 'tiktok') return source === 'tiktok';
      return false;
    }).length;
  };

  const handleViewDetails = (order: any) => {
    setSelectedOrder(order);
    setIsDetailModalOpen(true);
  };

  const handleFixMapping = (err: any) => {
    setSelectedError(err);
    setIsMappingModalOpen(true);
  };

  const handleRetry = (err: any) => {
    alert(`Đang thử lại đồng bộ cho đơn ${err.orderSn}...`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Quản lý đơn hàng</h1>
          <p className="text-sm text-slate-500">Xử lý đơn hàng từ các kênh bán hàng và xử lý lỗi đồng bộ.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setIsFilterModalOpen(true)} className="inline-flex items-center justify-center rounded-md bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50">
            <Filter className="mr-2 h-4 w-4 text-slate-400" />
            Lọc
          </button>
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500"
          >
            <Plus className="mr-2 h-4 w-4" />
            Tạo đơn mới
          </button>
        </div>
      </div>

      <div className="border-b border-slate-200 overflow-x-auto scrollbar-hide">
        <nav className="-mb-px flex space-x-6 sm:space-x-8 min-w-max px-1" aria-label="Tabs">
          {tabs.map((tab) => {
            const count = getPlatformCount(tab.id);
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  tab.id === activeTab
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700',
                  'whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors flex items-center'
                )}
              >
                {tab.id === 'errors' && <AlertTriangle className={cn("mr-2 h-4 w-4", tab.id === activeTab ? "text-indigo-600" : "text-rose-500")} />}
                {tab.name}
                {count > 0 && (
                  <span className={cn(
                    "ml-2 rounded-full px-2.5 py-0.5 text-xs font-medium",
                    tab.id === 'errors' ? "bg-rose-100 text-rose-600" : "bg-slate-100 text-slate-600"
                  )}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder={activeTab === 'errors' ? "Tìm mã đơn lỗi..." : "Tìm mã đơn, tên khách hàng..."}
              className="h-9 w-full rounded-md border border-slate-200 bg-slate-50 pl-9 pr-4 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            {activeTab !== 'offline' && activeTab !== 'errors' && (
              <button className="flex-1 sm:flex-none inline-flex items-center justify-center rounded-md bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50">
                <Printer className="mr-2 h-4 w-4 text-slate-400" />
                In hàng loạt
              </button>
            )}
            {activeTab === 'errors' && (
              <button className="flex-1 sm:flex-none inline-flex items-center justify-center rounded-md bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50">
                <RefreshCw className="mr-2 h-4 w-4 text-slate-400" />
                Thử lại tất cả
              </button>
            )}
          </div>
        </div>
        
        <div className="overflow-x-auto">
          {activeTab === 'errors' ? (
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-4 py-3 sm:px-6 sm:py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Nền tảng</th>
                  <th scope="col" className="px-4 py-3 sm:px-6 sm:py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Mã đơn (Platform)</th>
                  <th scope="col" className="px-4 py-3 sm:px-6 sm:py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Chi tiết lỗi</th>
                  <th scope="col" className="px-4 py-3 sm:px-6 sm:py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Thời gian</th>
                  <th scope="col" className="px-4 py-3 sm:px-6 sm:py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">Số lần thử</th>
                  <th scope="col" className="relative px-4 py-3 sm:px-6 sm:py-3"><span className="sr-only">Thao tác</span></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {mockErrors.map((err) => (
                  <tr key={err.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                      <span className={cn("px-2 py-1 rounded text-xs text-white", err.platform === 'Shopee' ? 'bg-[#f97316]' : 'bg-black')}>
                        {err.platform}
                      </span>
                    </td>
                    <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap text-sm font-medium text-slate-900">{err.orderSn}</td>
                    <td className="px-4 py-3 sm:px-6 sm:py-4 text-sm text-rose-600 max-w-md truncate" title={err.error}>{err.error}</td>
                    <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap text-sm text-slate-500">{err.time}</td>
                    <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap text-center text-sm font-medium text-slate-500">{err.retryCount}/5</td>
                    <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => handleFixMapping(err)} className="text-indigo-600 hover:text-indigo-900 mr-3">Sửa Mapping</button>
                      <button onClick={() => handleRetry(err)} className="text-emerald-600 hover:text-emerald-900 flex items-center inline-flex">
                        <RefreshCw className="mr-1 h-3 w-3" /> Thử lại
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-4 py-3 sm:px-6 sm:py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    <input type="checkbox" className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-600" />
                  </th>
                  <th scope="col" className="px-4 py-3 sm:px-6 sm:py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Mã đơn</th>
                  <th scope="col" className="px-4 py-3 sm:px-6 sm:py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Khách hàng</th>
                  <th scope="col" className="px-4 py-3 sm:px-6 sm:py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Thời gian</th>
                  <th scope="col" className="px-4 py-3 sm:px-6 sm:py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Tổng tiền</th>
                  <th scope="col" className="px-4 py-3 sm:px-6 sm:py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Trạng thái</th>
                  <th scope="col" className="relative px-4 py-3 sm:px-6 sm:py-3"><span className="sr-only">Thao tác</span></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-sm text-slate-500">Đang tải dữ liệu...</td>
                  </tr>
                ) : filteredOrders.length > 0 ? filteredOrders.map((order) => {
                  const statusKey = order.status?.toLowerCase() || 'pending';
                  const config = statusConfig[statusKey] || statusConfig['pending'];
                  const StatusIcon = config.icon;
                  return (
                    <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
                        <input type="checkbox" className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-600" />
                      </td>
                      <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap text-sm font-medium text-indigo-600">{order.id.substring(0, 8)}</td>
                      <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap text-sm text-slate-900">{order.customerName || 'Khách lẻ'}</td>
                      <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap text-sm text-slate-500">
                        {new Date(order.orderDate).toLocaleString('vi-VN')}
                      </td>
                      <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.totalAmount)}
                      </td>
                      <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
                        <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', config.color)}>
                          <StatusIcon className="mr-1 h-3 w-3" />
                          {config.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap text-right text-sm font-medium">
                        {statusKey === 'pending' && (
                          <button className="text-indigo-600 hover:text-indigo-900 mr-4">Xác nhận</button>
                        )}
                        {(statusKey === 'confirmed' || statusKey === 'printed') && (
                          <button className="text-indigo-600 hover:text-indigo-900 mr-4">In nhãn</button>
                        )}
                        <button onClick={() => handleViewDetails(order)} className="text-slate-400 hover:text-slate-600">Chi tiết</button>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-sm text-slate-500">
                      Không có đơn hàng nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
        <div className="border-t border-slate-200 px-6 py-3 flex items-center justify-between bg-slate-50 rounded-b-xl">
          <p className="text-sm text-slate-500">Hiển thị <span className="font-medium">{activeTab === 'errors' ? mockErrors.length : filteredOrders.length}</span> kết quả</p>
          <div className="flex gap-1">
            <button className="px-3 py-1 rounded border border-slate-200 bg-white text-sm text-slate-500 hover:bg-slate-50 disabled:opacity-50" disabled>Trước</button>
            <button className="px-3 py-1 rounded border border-slate-200 bg-white text-sm text-slate-500 hover:bg-slate-50 disabled:opacity-50" disabled>Sau</button>
          </div>
        </div>
      </div>

      {/* Filter Modal */}
      <Modal isOpen={isFilterModalOpen} onClose={() => setIsFilterModalOpen(false)} title="Lọc đơn hàng">
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setIsFilterModalOpen(false); }}>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Trạng thái đơn hàng</label>
            <select className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
              <option value="">Tất cả trạng thái</option>
              <option value="pending">Chờ xác nhận</option>
              <option value="confirmed">Đã xác nhận</option>
              <option value="printed">Đã in mã</option>
              <option value="shipped">Đang giao</option>
              <option value="completed">Hoàn thành</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Từ ngày</label>
              <input type="date" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Đến ngày</label>
              <input type="date" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
            </div>
          </div>
          <div className="flex justify-end gap-3 border-t border-slate-200 pt-4 mt-6">
            <button type="button" onClick={() => setIsFilterModalOpen(false)} className="rounded-md px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">Hủy</button>
            <button type="submit" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">Áp dụng lọc</button>
          </div>
        </form>
      </Modal>

      {/* Create Order Modal */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Tạo đơn hàng mới (Offline)" maxWidth="max-w-3xl">
        <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); setIsCreateModalOpen(false); }}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Khách hàng *</label>
              <select required className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
                <option value="">Chọn khách hàng / Gara</option>
                <option value="1">Gara Auto Phát</option>
                <option value="2">Khách lẻ (Không lưu tên)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Ngày bán</label>
              <input type="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
            </div>
          </div>
          
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-sm font-medium text-slate-900">Chi tiết sản phẩm</h3>
              <button type="button" className="text-sm text-indigo-600 font-medium hover:text-indigo-700">+ Thêm sản phẩm</button>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-slate-500 mb-1">Sản phẩm</label>
                  <select className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none">
                    <option>Két nước Toyota Vios 2015-2020 (Tồn: 12)</option>
                  </select>
                </div>
                <div className="w-24">
                  <label className="block text-xs font-medium text-slate-500 mb-1">Số lượng</label>
                  <input type="number" defaultValue="1" min="1" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none" />
                </div>
                <div className="w-32">
                  <label className="block text-xs font-medium text-slate-500 mb-1">Đơn giá</label>
                  <input type="text" defaultValue="1,500,000" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none" />
                </div>
                <button type="button" className="p-2 text-rose-500 hover:bg-rose-50 rounded-md mb-[1px]">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 flex justify-end">
              <div className="text-right">
                <p className="text-sm text-slate-500">Tổng cộng</p>
                <p className="text-xl font-bold text-indigo-600">1,500,000 đ</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
            <button type="button" onClick={() => setIsCreateModalOpen(false)} className="rounded-md px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">Hủy</button>
            <button type="button" className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Lưu & In Hóa Đơn</button>
            <button type="submit" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">Lưu đơn hàng</button>
          </div>
        </form>
      </Modal>

      {/* Order Detail Modal */}
      <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title={`Chi tiết đơn hàng ${selectedOrder?.id || ''}`} maxWidth="max-w-3xl">
        {selectedOrder && (
          <div className="space-y-6">
            <div className="flex justify-between items-start border-b border-slate-200 pb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900">{selectedOrder.customer}</h3>
                <p className="text-sm text-slate-500 mt-1">Ngày đặt: {selectedOrder.date}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-sm text-slate-500">Kênh: <span className="font-medium capitalize">{selectedOrder.type}</span></span>
                  <span className="text-slate-300">•</span>
                  <span className="text-sm text-slate-500">Số lượng: <span className="font-medium">{selectedOrder.itemsCount} sản phẩm</span></span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', statusConfig[selectedOrder.status].color)}>
                  {statusConfig[selectedOrder.status].label}
                </span>
                {selectedOrder.type !== 'offline' && (
                  <Link href="/messages" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center gap-1 mt-1">
                    <MessageSquare className="h-4 w-4" /> Nhắn tin cho khách
                  </Link>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-slate-400" /> Thông tin giao hàng
                </h4>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-2">
                  <p className="text-sm text-slate-700"><span className="text-slate-500 w-24 inline-block">Người nhận:</span> <span className="font-medium">{selectedOrder.customerName || 'Khách lẻ'}</span></p>
                  <p className="text-sm text-slate-700"><span className="text-slate-500 w-24 inline-block">Địa chỉ:</span> {selectedOrder.onlineDetails?.shippingAddress || 'Mua tại cửa hàng'}</p>
                  {selectedOrder.onlineDetails && (
                    <>
                      <p className="text-sm text-slate-700"><span className="text-slate-500 w-24 inline-block">Nền tảng:</span> <span className="font-medium text-indigo-600">{selectedOrder.onlineDetails.platform}</span></p>
                      <p className="text-sm text-slate-700"><span className="text-slate-500 w-24 inline-block">Mã vận đơn:</span> <span className="font-mono text-indigo-600">{selectedOrder.onlineDetails.trackingCode || 'N/A'}</span></p>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-slate-400" /> Thông tin thanh toán
                </h4>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-2">
                  <p className="text-sm text-slate-700"><span className="text-slate-500 w-28 inline-block">Số mặt hàng:</span> {selectedOrder.items.length}</p>
                  <p className="text-sm text-slate-700"><span className="text-slate-500 w-28 inline-block">Tổng thanh toán:</span> <span className="font-bold text-indigo-600">{(selectedOrder.totalAmount || 0).toLocaleString()} đ</span></p>
                </div>
              </div>
            </div>

            {selectedOrder.type !== 'offline' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Store className="h-4 w-4 text-slate-400" /> Thông tin người gửi (Shop)
                  </h4>
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-2">
                    <p className="text-sm text-slate-700"><span className="text-slate-500 w-24 inline-block">Tên shop:</span> <span className="font-medium">Garage Radiator Parts</span></p>
                    <p className="text-sm text-slate-700"><span className="text-slate-500 w-24 inline-block">SĐT:</span> 0901234567</p>
                    <p className="text-sm text-slate-700"><span className="text-slate-500 w-24 inline-block">Địa chỉ:</span> 123 Đường ABC, Quận XYZ, TP.HCM</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-slate-400" /> Ghi chú của khách
                  </h4>
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 h-[104px] overflow-y-auto">
                    <p className="text-sm text-slate-700 italic">"Shop đóng gói cẩn thận giúp mình nhé, cám ơn shop!"</p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Package className="h-4 w-4 text-slate-400" /> Danh sách sản phẩm
              </h4>
              <div className="border border-slate-200 rounded-lg overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Sản phẩm</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-slate-500">SL</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-slate-500">Đơn giá</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-slate-500">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {selectedOrder.items.map((item: OrderItem, idx: number) => (
                      <tr key={idx}>
                        <td className="px-4 py-3 text-sm text-slate-900">
                          {item.productName}<br/>
                          <span className="text-xs text-slate-500">Mã SP: {item.productId.substring(0, 8)}...</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-slate-900">{item.quantity}</td>
                        <td className="px-4 py-3 text-sm text-right text-slate-500">{(item.unitPrice || 0).toLocaleString()} đ</td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-slate-900">{(item.quantity * item.unitPrice).toLocaleString()} đ</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-700">Tổng thanh toán</span>
                  <span className="text-lg font-bold text-indigo-600">{(selectedOrder.totalAmount || 0).toLocaleString()} đ</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 pt-4 mt-6">
              <button onClick={() => setIsDetailModalOpen(false)} className="rounded-md px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">Đóng</button>
              {selectedOrder.source !== 'POS' && (
                <button className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 flex items-center">
                  <Printer className="mr-2 h-4 w-4" /> In nhãn vận chuyển
                </button>
              )}
              {selectedOrder.source === 'POS' && (
                <button className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 flex items-center">
                  <Printer className="mr-2 h-4 w-4" /> In hóa đơn POS
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

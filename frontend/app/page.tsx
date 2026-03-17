'use client';

import { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Package,
  AlertTriangle,
  DollarSign,
  ShoppingCart,
} from 'lucide-react';
import { RevenueChart } from '@/components/dashboard/revenue-chart';
import { PlatformChart } from '@/components/dashboard/platform-chart';
import { api } from '@/lib/apiClient';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any[]>([]);
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

      // Fetch today's profit report
      const report = await api.finance.profitReport(today, today);
      
      // Fetch products to check for low stock
      const products = await api.products.list();
      const lowStock = products
        .filter((p: any) => (p.currentStock || 0) < 10)
        .map((p: any) => ({
          id: p.sku,
          name: p.name,
          stock: p.currentStock || 0,
          min: 10
        }));
      setLowStockItems(lowStock.slice(0, 4));

      // Mock top products for now based on actual products
      setTopProducts(products.slice(0, 4).map((p: any) => ({
        name: p.name,
        sales: Math.floor(Math.random() * 50),
        revenue: new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p.retailPrice * 10)
      })));

      setStats([
        {
          name: 'Doanh thu hôm nay',
          value: new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(report.totalRevenue || 0),
          change: '+0%',
          trend: 'up',
          icon: DollarSign,
        },
        {
          name: 'Chi phí nhập hàng',
          value: new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(report.totalExpenses || 0),
          change: '0%',
          trend: 'down',
          icon: ShoppingCart,
        },
        {
          name: 'Lợi nhuận gộp',
          value: new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(report.grossProfit || 0),
          change: '+0%',
          trend: 'up',
          icon: TrendingUp,
        },
        {
          name: 'Mặt hàng sắp hết',
          value: lowStock.length.toString(),
          change: 'Cần nhập',
          trend: 'down',
          icon: Package,
        },
      ]);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-12">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-slate-500 font-medium">Đang tải dữ liệu hệ thống...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Tổng quan</h1>
        <p className="text-sm text-slate-500">Theo dõi hoạt động kinh doanh và tình trạng kho hàng.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">{stat.name}</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">{stat.value}</p>
              </div>
              <div className="rounded-full bg-indigo-50 p-3">
                <stat.icon className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              {stat.trend === 'up' ? (
                <TrendingUp className="mr-1 h-4 w-4 text-emerald-500" />
              ) : (
                <TrendingDown className="mr-1 h-4 w-4 text-rose-500" />
              )}
              <span
                className={
                  stat.trend === 'up' ? 'text-emerald-600 font-medium' : 'text-rose-600 font-medium'
                }
              >
                {stat.change}
              </span>
              <span className="ml-2 text-slate-500">so với hôm qua</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Doanh thu 7 ngày qua</h2>
          <div className="h-[250px] sm:h-[300px] w-full flex items-center justify-center bg-slate-50 rounded-lg">
            <p className="text-slate-400 text-sm">Thông số biểu đồ sẽ hiển thị khi có dữ liệu bán hàng</p>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Nền tảng phổ biến</h2>
          <div className="h-[250px] sm:h-[300px] w-full flex items-center justify-center bg-slate-50 rounded-lg">
            <p className="text-slate-400 text-sm">Chưa có dữ liệu từ Shopee/TikTok</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-200 px-4 py-3 sm:px-6 sm:py-4 flex justify-between items-center">
            <h2 className="text-base sm:text-lg font-semibold text-slate-900">Sản phẩm bán chạy</h2>
            <button className="text-sm text-indigo-600 font-medium hover:text-indigo-700">Xem tất cả</button>
          </div>
          <div className="divide-y divide-slate-100">
            {topProducts.length === 0 ? (
              <p className="px-6 py-4 text-sm text-slate-500 text-center">Chưa có dữ liệu bán hàng</p>
            ) : (
              topProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
                  <div>
                    <p className="font-medium text-slate-900">{product.name}</p>
                    <p className="text-sm text-slate-500">{product.sales} đã bán</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-slate-900">{product.revenue}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-200 px-4 py-3 sm:px-6 sm:py-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-semibold text-slate-900">Cảnh báo tồn kho</h2>
              <span className="inline-flex items-center rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-medium text-rose-800">
                {lowStockItems.length} mục
              </span>
            </div>
            <button className="text-sm text-indigo-600 font-medium hover:text-indigo-700">Nhập hàng</button>
          </div>
          <div className="divide-y divide-slate-100">
            {lowStockItems.length === 0 ? (
              <p className="px-6 py-4 text-sm text-slate-500 text-center">Tồn kho hiện tại đang ở mức an toàn</p>
            ) : (
              lowStockItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      <AlertTriangle className="h-5 w-5 text-amber-500" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{item.name}</p>
                      <p className="text-sm text-slate-500">Mã: {item.id}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-rose-600">{item.stock}</p>
                    <p className="text-xs text-slate-500">Tối thiểu: {item.min}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

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
import { cn } from '@/lib/utils';

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
    <div className="space-y-8 pb-10">
      <div className="flex flex-col gap-1 px-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Tổng quan</h1>
        <p className="text-sm font-medium text-slate-500">Chào mừng trở lại! Đây là tình hình kinh doanh của bạn hôm nay.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 px-1">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="ios-card p-6 transition-all hover:shadow-md hover:-translate-y-1 duration-300 group"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">{stat.name}</p>
                <p className="text-2xl font-extrabold text-slate-900 tracking-tight">{stat.value}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3 group-hover:bg-primary/10 transition-colors">
                <stat.icon className="h-6 w-6 text-primary group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <div className="mt-6 flex items-center text-[13px]">
              <div className={cn(
                "flex items-center rounded-full px-2 py-0.5 font-bold mr-2",
                stat.trend === 'up' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
              )}>
                {stat.trend === 'up' ? (
                  <TrendingUp className="mr-1 h-3.5 w-3.5" />
                ) : (
                  <TrendingDown className="mr-1 h-3.5 w-3.5" />
                )}
                {stat.change}
              </div>
              <span className="text-slate-400 font-medium italic">hôm nay</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 px-1">
        <div className="lg:col-span-2 ios-card p-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">Doanh thu tuần này</h2>
            <div className="flex gap-2">
              <span className="h-2 w-2 rounded-full bg-primary" />
              <span className="h-2 w-2 rounded-full bg-slate-200" />
            </div>
          </div>
          <div className="h-[300px] w-full flex items-center justify-center bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-100 italic transition-all hover:bg-slate-50">
            <p className="text-slate-400 text-sm font-medium">Dữ liệu biểu đồ đang được tổng hợp...</p>
          </div>
        </div>
        <div className="ios-card p-6">
          <h2 className="text-lg font-extrabold text-slate-900 tracking-tight mb-8">Tỷ lệ Nền tảng</h2>
          <div className="h-[300px] w-full flex items-center justify-center bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-100 italic transition-all hover:bg-slate-50">
            <p className="text-slate-400 text-sm font-medium">Chưa có kết nối thực tế</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 px-1">
        <div className="ios-card overflow-hidden">
          <div className="px-6 py-5 flex justify-between items-center border-b border-slate-50">
            <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">Sản phẩm bán chạy</h2>
            <button className="text-xs font-bold text-primary uppercase tracking-widest hover:underline px-3 py-1 bg-primary/5 rounded-full transition-colors">Tất cả</button>
          </div>
          <div className="divide-y divide-slate-50">
            {topProducts.length === 0 ? (
              <div className="px-8 py-12 text-center">
                <p className="text-sm font-medium text-slate-400 italic">Chưa phát sinh giao dịch</p>
              </div>
            ) : (
              topProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors cursor-default">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{product.name}</p>
                      <p className="text-xs font-bold text-emerald-500 uppercase tracking-tight">{product.sales} đơn đã giao</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-extrabold text-slate-900">{product.revenue}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="ios-card overflow-hidden">
          <div className="px-6 py-5 flex justify-between items-center border-b border-slate-50 bg-rose-50/10">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">Cảnh báo tồn kho</h2>
              <span className="inline-flex items-center rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-black text-white uppercase tracking-tighter shadow-sm shadow-rose-200">
                {lowStockItems.length} MỤC
              </span>
            </div>
            <button className="text-xs font-bold text-rose-600 uppercase tracking-widest hover:underline px-3 py-1 bg-rose-50 rounded-full transition-colors">Nhập kho</button>
          </div>
          <div className="divide-y divide-slate-50">
            {lowStockItems.length === 0 ? (
              <div className="px-8 py-12 text-center">
                <p className="text-sm font-medium text-slate-400 italic">Hệ thống đang ở mức an toàn</p>
              </div>
            ) : (
              lowStockItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between px-6 py-5 hover:bg-rose-50/30 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="mt-1 bg-amber-50 p-2 rounded-xl">
                      <AlertTriangle className="h-5 w-5 text-amber-500" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{item.name}</p>
                      <p className="text-xs font-bold text-slate-400 uppercase">Mã: {item.id}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="inline-block px-3 py-1 bg-rose-100 rounded-xl mb-1">
                      <p className="text-xl font-black text-rose-600 leading-none">{item.stock}</p>
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tối thiểu: {item.min}</p>
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

'use client';

import { useState, useEffect } from 'react';
import { Download, Filter, FileText, Calculator, TrendingUp, DollarSign, PieChart, BarChart3, ArrowUpRight, ArrowDownRight } from 'lucide-react';
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

const tabs = [
  { id: 'financial', name: 'Báo cáo tài chính' },
  { id: 'tax', name: 'Tính thuế (VN)' },
];

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('financial');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<any>(null);

  useEffect(() => {
    loadReport();
  }, []);

  const loadReport = async () => {
    try {
      setLoading(true);
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const lastDay = new Date().toISOString();
      const data = await api.finance.profitReport(firstDay, lastDay);
      setReport(data);
    } catch (error) {
      console.error('Failed to load profit report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    alert('Đang kết xuất báo cáo đa nền tảng...');
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 px-2">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Báo cáo & Thống kê</h1>
          <p className="text-sm font-medium text-slate-500">Phân tích dòng tiền, tối ưu lợi nhuận và đối soát thuế hộ kinh doanh.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => setIsFilterModalOpen(true)} className="rounded-xl border-slate-200">
            <Filter className="mr-2 h-4 w-4 text-slate-400" />
            Lọc thời gian
          </Button>
          <Button size="sm" onClick={handleExport} className="rounded-xl shadow-lg shadow-primary/20 bg-primary/90">
            <Download className="mr-2 h-4 w-4" />
            Xuất báo cáo
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-2xl w-fit">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-6 py-2 text-sm font-bold rounded-xl transition-all duration-300",
                isActive ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              {tab.name}
            </button>
          );
        })}
      </div>

      {activeTab === 'financial' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 px-1">
            <div className="ios-card p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-blue-50 rounded-2xl">
                  <DollarSign className="h-6 w-6 text-blue-500" />
                </div>
                <Badge className="bg-emerald-50 text-emerald-600 border-none font-black text-[10px]">+12.5%</Badge>
              </div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Doanh thu</p>
              <p className="text-2xl font-black text-slate-900 tracking-tighter">{(report?.totalRevenue || 0).toLocaleString()} <span className="text-xs font-bold text-slate-400">đ</span></p>
            </div>

            <div className="ios-card p-6 border-l-4 border-l-slate-200">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-slate-50 rounded-2xl">
                  <Calculator className="h-6 w-6 text-slate-500" />
                </div>
              </div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Giá vốn (COGS)</p>
              <p className="text-2xl font-black text-slate-900 tracking-tighter">{(report?.totalCost || 0).toLocaleString()} <span className="text-xs font-bold text-slate-400">đ</span></p>
            </div>

            <div className="ios-card p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-rose-50 rounded-2xl">
                  <ArrowDownRight className="h-6 w-6 text-rose-500" />
                </div>
                <Badge className="bg-rose-50 text-rose-600 border-none font-black text-[10px]">+5.2%</Badge>
              </div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Chi phí</p>
              <p className="text-2xl font-black text-slate-900 tracking-tighter">{(report?.totalExpense || 0).toLocaleString()} <span className="text-xs font-bold text-slate-400">đ</span></p>
            </div>

            <div className="ios-card p-6 bg-primary shadow-2xl shadow-primary/25 border-none">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-white/20 rounded-2xl">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <Badge className="bg-white/20 text-white border-none font-black text-[10px]">TỐT</Badge>
              </div>
              <p className="text-xs font-black text-white/60 uppercase tracking-widest mb-1">Lợi nhuận ròng</p>
              <p className="text-2xl font-black text-white tracking-tighter">{(report?.netProfit || 0).toLocaleString()} <span className="text-xs font-bold text-white/50">đ</span></p>
            </div>
          </div>

          <div className="ios-card overflow-hidden">
            <div className="px-6 py-5 bg-slate-50/50 border-b border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 rounded-xl">
                  <BarChart3 className="h-5 w-5 text-indigo-500" />
                </div>
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">Chi tiết theo nguồn doanh thu</h2>
              </div>
            </div>
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nguồn bán hàng</TableHead>
                  <TableHead className="text-right">Số đơn</TableHead>
                  <TableHead className="text-right">Doanh thu</TableHead>
                  <TableHead className="text-right">Lợi nhuận gộp</TableHead>
                  <TableHead className="text-right">Tỷ trọng</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-extrabold text-slate-900">Tại quầy / Gara</TableCell>
                  <TableCell className="text-right font-bold text-slate-500">142</TableCell>
                  <TableCell className="text-right font-black text-slate-900">45,000,000 đ</TableCell>
                  <TableCell className="text-right font-black text-emerald-600">12,400,000 đ</TableCell>
                  <TableCell className="text-right font-black text-slate-400 italic">45%</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-extrabold text-slate-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#f97316]"></span> Shopee Mall
                  </TableCell>
                  <TableCell className="text-right font-bold text-slate-500">88</TableCell>
                  <TableCell className="text-right font-black text-slate-900">32,200,000 đ</TableCell>
                  <TableCell className="text-right font-black text-emerald-600">8,100,000 đ</TableCell>
                  <TableCell className="text-right font-black text-slate-400 italic">32%</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-extrabold text-slate-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-black"></span> TikTok Shop
                  </TableCell>
                  <TableCell className="text-right font-bold text-slate-500">65</TableCell>
                  <TableCell className="text-right font-black text-slate-900">22,800,000 đ</TableCell>
                  <TableCell className="text-right font-black text-emerald-600">5,500,000 đ</TableCell>
                  <TableCell className="text-right font-black text-slate-400 italic">23%</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {activeTab === 'tax' && (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 px-1">
          <div className="ios-card overflow-hidden border-l-4 border-l-primary">
            <div className="p-6 bg-slate-50 border-b border-slate-100">
              <h2 className="text-lg font-black text-slate-900 tracking-tight">Hộ kinh doanh cá thể</h2>
              <p className="text-[10px] font-black text-primary uppercase tracking-widest mt-1">Phương pháp Thuế khoán</p>
            </div>
            <div className="p-8 space-y-6">
              <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Tổng doanh thu tính thuế</span>
                <span className="text-xl font-black text-slate-900 tracking-tighter">450,000,000 đ</span>
              </div>
              <div className="space-y-4 px-2">
                <div className="flex justify-between items-center text-sm font-bold text-slate-600">
                  <span>Thuế GTGT (1.0%)</span>
                  <span className="text-slate-900 uppercase">4,500,000 đ</span>
                </div>
                <div className="flex justify-between items-center text-sm font-bold text-slate-600">
                  <span>Thuế TNCN (0.5%)</span>
                  <span className="text-slate-900 uppercase">2,250,000 đ</span>
                </div>
              </div>
              <div className="p-6 rounded-3xl bg-rose-50 border border-rose-100 flex justify-between items-center">
                <span className="text-sm font-black text-rose-600 uppercase tracking-widest">Phải nộp ngân sách</span>
                <span className="text-3xl font-black text-rose-600 tracking-tighter">6,750,000 đ</span>
              </div>
            </div>
          </div>

          <div className="ios-card overflow-hidden opacity-60 grayscale-[0.5] relative cursor-not-allowed group">
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/40 backdrop-blur-[1px]">
               <div className="px-4 py-1 rounded-full bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest shadow-xl">Chờ kích hoạt</div>
            </div>
            <div className="p-6 bg-slate-50 border-b border-slate-100">
              <h2 className="text-lg font-black text-slate-900 tracking-tight">Mô hình Doanh nghiệp</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Khấu trừ & TNDN 20%</p>
            </div>
            <div className="p-8 space-y-6">
              <div className="flex justify-between items-center border-b border-slate-50 pb-4">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Lợi nhuận thực</span>
                <span className="font-black text-slate-900">125,000,000 đ</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-50 pb-4">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Thuế suất TNDN</span>
                <span className="font-black text-slate-900">20.0%</span>
              </div>
              <div className="p-6 rounded-3xl bg-slate-100 flex justify-between items-center">
                <span className="text-sm font-black text-slate-400 uppercase tracking-widest">Dự kiến thuế</span>
                <span className="text-2xl font-black text-slate-500 tracking-tighter">25,000,000 đ</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter Modal */}
      <Modal isOpen={isFilterModalOpen} onClose={() => setIsFilterModalOpen(false)} title="Lọc dữ liệu báo cáo">
        <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); setIsFilterModalOpen(false); }}>
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Kỳ kế toán</label>
            <Select defaultValue="this-month">
              <SelectTrigger className="w-full h-12 rounded-2xl border border-slate-100 bg-slate-50 px-4 text-sm font-bold text-slate-600">
                <SelectValue placeholder="Chọn kỳ kế toán" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="this-month">Tháng hiện tại</SelectItem>
                <SelectItem value="last-month">Tháng trước</SelectItem>
                <SelectItem value="this-quarter">Quý hiện tại</SelectItem>
                <SelectItem value="this-year">Năm nay</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Từ ngày</label>
              <Input type="date" />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Đến ngày</label>
              <Input type="date" />
            </div>
          </div>
          <div className="pt-6 border-t border-slate-50 flex justify-end gap-3">
            <Button variant="ghost" type="button" onClick={() => setIsFilterModalOpen(false)} className="rounded-xl">Hủy</Button>
            <Button type="submit" className="rounded-xl bg-primary px-8 font-bold">Cập nhật báo cáo</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

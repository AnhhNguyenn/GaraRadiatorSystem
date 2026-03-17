import { useState, useEffect } from 'react';
import { Download, Filter, FileText, Calculator, TrendingUp, DollarSign } from 'lucide-react';
import { cn } from '@/components/sidebar';
import { Modal } from '@/components/ui/modal';
import { api } from '@/lib/apiClient';

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
      // For now using current month
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
    alert('Đang xuất báo cáo ra file Excel...');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Báo cáo & Thống kê</h1>
          <p className="text-sm text-slate-500">Xem báo cáo doanh thu, lợi nhuận và tính toán thuế.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setIsFilterModalOpen(true)} className="inline-flex items-center justify-center rounded-md bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50">
            <Filter className="mr-2 h-4 w-4 text-slate-400" />
            Lọc thời gian
          </button>
          <button onClick={handleExport} className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500">
            <Download className="mr-2 h-4 w-4" />
            Xuất Excel
          </button>
        </div>
      </div>

      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto scrollbar-hide" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                tab.id === activeTab
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700',
                'whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors'
              )}
            >
              <div className="flex items-center gap-2">
                {tab.id === 'financial' ? <TrendingUp className="h-4 w-4" /> : <Calculator className="h-4 w-4" />}
                {tab.name}
              </div>
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'financial' && (
        <div className="space-y-6">
          {loading ? (
            <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4 animate-pulse">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-32 rounded-xl bg-slate-100 border border-slate-200"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
                <p className="text-sm font-medium text-slate-500">Tổng doanh thu</p>
                <p className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">{(report?.totalRevenue || 0).toLocaleString()} đ</p>
                <p className="mt-1 text-sm text-emerald-600">+12% so với tháng trước</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
                <p className="text-sm font-medium text-slate-500">Giá vốn hàng bán (COGS)</p>
                <p className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">{(report?.totalCost || 0).toLocaleString()} đ</p>
                <p className="mt-1 text-sm text-slate-500">Tính theo FIFO</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
                <p className="text-sm font-medium text-slate-500">Chi phí vận hành</p>
                <p className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">{(report?.totalExpense || 0).toLocaleString()} đ</p>
                <p className="mt-1 text-sm text-rose-600">+5% so với tháng trước</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm border-l-4 border-l-indigo-500">
                <p className="text-sm font-medium text-slate-500">Lợi nhuận ròng</p>
                <p className="mt-2 text-2xl sm:text-3xl font-bold text-indigo-600">{(report?.netProfit || 0).toLocaleString()} đ</p>
                <p className="mt-1 text-sm text-emerald-600">Biên lợi nhuận: {report?.totalRevenue ? ((report.netProfit / report.totalRevenue) * 100).toFixed(1) : 0}%</p>
              </div>
            </div>
          )}

          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">Chi tiết doanh thu theo nguồn</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Nguồn bán hàng</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Số đơn hàng</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Doanh thu</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Tỷ trọng</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">Cửa hàng / Gara (Offline)</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-slate-500">--</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-slate-900">--</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-slate-500">--</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">Shopee</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-slate-500">--</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-slate-900">--</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-slate-500">--</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">TikTok Shop</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-slate-500">--</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-slate-900">--</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-slate-500">--</td>
                </tr>
                <tr className="bg-slate-50 font-bold">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">Tổng cộng</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-slate-900">--</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-indigo-600">{(report?.totalRevenue || 0).toLocaleString()} đ</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-slate-900">100%</td>
                </tr>
              </tbody>
            </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'tax' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-200 bg-slate-50">
                <h2 className="text-lg font-semibold text-slate-900">Hộ kinh doanh (Household Business)</h2>
                <p className="text-sm text-slate-500">Áp dụng thuế khoán trên doanh thu</p>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                  <span className="text-sm text-slate-600">Doanh thu tính thuế</span>
                  <span className="font-medium text-slate-900">450,000,000 đ</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                  <span className="text-sm text-slate-600">Thuế GTGT (VAT) - 1%</span>
                  <span className="font-medium text-slate-900">4,500,000 đ</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                  <span className="text-sm text-slate-600">Thuế TNCN - 0.5%</span>
                  <span className="font-medium text-slate-900">2,250,000 đ</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="font-bold text-slate-900">Tổng thuế phải nộp</span>
                  <span className="text-xl font-bold text-rose-600">6,750,000 đ</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden opacity-50 relative">
              <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center">
                <span className="bg-slate-800 text-white px-3 py-1 rounded-full text-sm font-medium">Chưa kích hoạt</span>
              </div>
              <div className="p-4 border-b border-slate-200 bg-slate-50">
                <h2 className="text-lg font-semibold text-slate-900">Doanh nghiệp (Company Mode)</h2>
                <p className="text-sm text-slate-500">Áp dụng phương pháp khấu trừ</p>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                  <span className="text-sm text-slate-600">Lợi nhuận trước thuế</span>
                  <span className="font-medium text-slate-900">125,000,000 đ</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                  <span className="text-sm text-slate-600">Thuế TNDN (20%)</span>
                  <span className="font-medium text-slate-900">25,000,000 đ</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="font-bold text-slate-900">Tổng thuế phải nộp</span>
                  <span className="text-xl font-bold text-rose-600">25,000,000 đ</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Filter Modal */}
      <Modal isOpen={isFilterModalOpen} onClose={() => setIsFilterModalOpen(false)} title="Lọc thời gian báo cáo">
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setIsFilterModalOpen(false); }}>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Kỳ báo cáo</label>
            <select className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
              <option value="this-month">Tháng này</option>
              <option value="last-month">Tháng trước</option>
              <option value="this-quarter">Quý này</option>
              <option value="this-year">Năm nay</option>
              <option value="custom">Tùy chỉnh</option>
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
            <button type="submit" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">Áp dụng</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

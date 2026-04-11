import { Bell, Search, Menu, Package, FileText, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';

export function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  // Mock notifications array
  const notifications = [
    { id: 1, title: 'Đơn hàng mới', message: 'Khách hàng Nguyễn Văn A vừa đặt 2 két nước', type: 'order', time: '5 phút trước' },
    { id: 2, title: 'Cập nhật hệ thống', message: 'Hệ thống sẽ bảo trì vào 22:00 tối nay', type: 'system', time: '1 giờ trước' },
    { id: 3, title: 'Thanh toán thành công', message: 'Hóa đơn #INV-001 đã được thanh toán', type: 'success', time: '2 giờ trước' }
  ];

  return (
    <header className="flex h-20 items-center justify-between bg-transparent px-6 sm:px-8 relative">
      <div className="flex items-center gap-6">
        {onMenuClick && (
          <button 
            onClick={onMenuClick}
            className="lg:hidden text-slate-500 hover:text-primary p-2 -ml-2 transition-colors active:scale-90"
          >
            <Menu className="h-7 w-7" />
          </button>
        )}
        <div className="relative hidden sm:block group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Tìm kiếm..."
            className="h-11 w-72 md:w-96 rounded-full border border-slate-200 bg-slate-100/50 pl-11 pr-6 text-sm outline-none focus:bg-white focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-slate-400"
          />
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-4">
        <button className="sm:hidden relative text-slate-500 hover:text-primary p-2 transition-colors active:scale-95">
          <Search className="h-6 w-6" />
        </button>
        <div className="relative">
          <button
            onClick={() => setIsNotificationOpen(!isNotificationOpen)}
            className="relative text-slate-500 hover:text-primary p-2 bg-slate-100/50 rounded-full transition-all active:scale-95 group"
          >
            <Bell className="h-5 w-5 group-hover:rotate-12 transition-transform" />
            <span className="absolute top-1 right-1 block h-2.5 w-2.5 rounded-full bg-red-500 ring-4 ring-white shadow-sm" />
          </button>

          {/* Notification Dropdown */}
          {isNotificationOpen && (
            <>
              {/* Invisible overlay to catch clicks outside */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsNotificationOpen(false)}
              ></div>
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl shadow-slate-900/10 border border-slate-100 z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                  <h3 className="font-bold text-sm text-slate-900">Thông báo</h3>
                  <button className="text-[10px] uppercase tracking-widest font-bold text-primary hover:text-primary/80 transition-colors">
                    Đánh dấu đã đọc
                  </button>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.map((notif) => (
                    <div key={notif.id} className="px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer border-b border-slate-50 last:border-none flex gap-3">
                      <div className={`mt-1 h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                        notif.type === 'order' ? 'bg-blue-100 text-blue-600' :
                        notif.type === 'system' ? 'bg-purple-100 text-purple-600' :
                        'bg-emerald-100 text-emerald-600'
                      }`}>
                        {notif.type === 'order' && <Package className="h-4 w-4" />}
                        {notif.type === 'system' && <FileText className="h-4 w-4" />}
                        {notif.type === 'success' && <CheckCircle2 className="h-4 w-4" />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{notif.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{notif.message}</p>
                        <p className="text-[10px] text-slate-400 mt-1 font-medium">{notif.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 text-center">
                  <button className="text-xs font-bold text-slate-500 hover:text-primary transition-colors">
                    Xem tất cả thông báo
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Warehouse,
  ShoppingCart,
  Receipt,
  Users,
  BarChart3,
  Settings,
  MessageSquare,
  X
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { name: 'Tổng quan', href: '/', icon: LayoutDashboard },
  { name: 'Bán hàng (POS)', href: '/pos', icon: ShoppingCart },
  { name: 'Sản phẩm', href: '/products', icon: Package },
  { name: 'Kho', href: '/inventory', icon: Warehouse },
  { name: 'Đơn hàng', href: '/orders', icon: Receipt },
  { name: 'Tin nhắn', href: '/messages', icon: MessageSquare },
  { name: 'Khách hàng', href: '/customers', icon: Users },
  { name: 'Báo cáo', href: '/reports', icon: BarChart3 },
  { name: 'Cài đặt', href: '/settings', icon: Settings },
];

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-full flex-col bg-white print:hidden border-r border-border/10">
      <div className="flex h-20 items-center justify-between px-6 font-bold text-slate-900 text-xl tracking-tight">
        <div className="flex items-center gap-3">
          <div className="bg-primary p-2 rounded-2xl shadow-sm">
            <Package className="w-6 h-6 text-white" />
          </div>
          <span className="font-bold">Garage ERP</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-slate-600 p-1 -mr-2">
            <X className="w-6 h-6" />
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto py-2">
        <nav className="space-y-1.5 px-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'group flex items-center rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-300',
                  isActive
                    ? 'bg-primary text-white shadow-md shadow-primary/20 translate-x-1'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-primary active:scale-95'
                )}
              >
                <item.icon
                  className={cn(
                    'mr-3 h-5 w-5 transition-transform group-hover:scale-110',
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-primary'
                  )}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="p-6 mt-auto">
        <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-3xl border border-slate-100">
          <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shadow-inner">
            AD
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-slate-900 leading-none mb-1">Anh Nguyễn</span>
            <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Chủ cửa hàng</span>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { api } from '@/lib/apiClient';
import { usePathname, useRouter } from 'next/navigation';
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
  X,
  LogOut
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useEffect, useState } from 'react';
import { api } from '@/lib/apiClient';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { name: 'Tổng quan', href: '/', icon: LayoutDashboard, roles: ['TenantAdmin', 'Staff'] },
  { name: 'Bán hàng (POS)', href: '/pos', icon: ShoppingCart, roles: ['TenantAdmin', 'Staff'] },
  { name: 'Sản phẩm', href: '/products', icon: Package, roles: ['TenantAdmin', 'Staff'] },
  { name: 'Kho', href: '/inventory', icon: Warehouse, roles: ['TenantAdmin', 'Staff'] },
  { name: 'Đơn hàng', href: '/orders', icon: Receipt, roles: ['TenantAdmin', 'Staff'] },
  { name: 'Tin nhắn', href: '/messages', icon: MessageSquare, roles: ['TenantAdmin', 'Staff'] },
  { name: 'Khách hàng', href: '/customers', icon: Users, roles: ['TenantAdmin', 'Staff'] },
  { name: 'Báo cáo', href: '/reports', icon: BarChart3, roles: ['TenantAdmin'] },
  { name: 'Cài đặt', href: '/settings', icon: Settings, roles: ['TenantAdmin'] },
];

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<string>('Staff'); // Default restrictive
  const [userName, setUserName] = useState<string>('Đang tải...');
  const [userRoleDisplay, setUserRoleDisplay] = useState<string>('Nhân viên');

  useEffect(() => {
    let isMounted = true;
    api.auth.me()
      .then((data: any) => {
        if (!isMounted) return;
        const role = data.role || 'Staff';
        setUserRole(role);

        const emailPrefix = data.email ? data.email.split('@')[0] : 'Người dùng';
        setUserName(emailPrefix);

        if (role === 'TenantAdmin') {
          setUserRoleDisplay('Chủ cửa hàng');
        } else if (role === 'SuperAdmin') {
          setUserRoleDisplay('Quản trị hệ thống');
        } else {
          setUserRoleDisplay('Nhân viên');
        }
      })
      .catch(() => {
        if (isMounted) {
          setUserName('Khách');
          setUserRoleDisplay('Chưa đăng nhập');
        }
      });
    return () => { isMounted = false; };
  }, []);

  const visibleNavItems = navItems.filter(item => {
    if (!item.roles) return true;
    return item.roles.includes(userRole) || userRole === 'SuperAdmin';
  });
  const router = useRouter();
  const [user, setUser] = useState<{ email: string, role: string } | null>(null);

  useEffect(() => {
    api.auth.me().then(data => {
      setUser(data);
    }).catch(err => console.error("Failed to fetch user profile", err));
  }, []);

  const handleLogout = async () => {
    try {
      await api.auth.logout();
    } catch (e) {
      console.error(e);
    } finally {
      router.push('/login');
    }
  };

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
          {visibleNavItems.map((item) => {
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
          <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shadow-inner uppercase">
            {userName.substring(0, 2)}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-slate-900 leading-none mb-1 truncate max-w-[120px]">{userName}</span>
            <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">{userRoleDisplay}</span>
      <div className="p-4 sm:p-6 mt-auto">
        <div className="flex items-center justify-between gap-2 bg-slate-50 p-2 sm:p-3 rounded-3xl border border-slate-100 group">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shadow-inner shrink-0">
              {user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="flex flex-col truncate max-w-[100px] sm:max-w-[120px]">
              <span className="text-sm font-bold text-slate-900 leading-none mb-1 truncate" title={user?.email || 'Người dùng'}>{user?.email || 'Người dùng'}</span>
              <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 truncate">{user?.role || 'Vai trò'}</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
            title="Đăng xuất"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

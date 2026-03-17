'use client';

import { Save, Store, Printer, Link as LinkIcon, Users, Shield } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Cài đặt hệ thống</h1>
        <p className="text-sm text-slate-500">Cấu hình thông tin cửa hàng, máy in và kết nối nền tảng.</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-200 px-6 py-4 flex items-center gap-3 bg-slate-50">
          <Store className="h-5 w-5 text-slate-500" />
          <h2 className="text-lg font-semibold text-slate-900">Thông tin cửa hàng</h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tên cửa hàng</label>
              <input type="text" defaultValue="Garage Radiator Parts" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Số điện thoại</label>
              <input type="text" defaultValue="0901234567" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Địa chỉ</label>
              <input type="text" defaultValue="123 Đường ABC, Quận XYZ, TP.HCM" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Mã số thuế</label>
              <input type="text" defaultValue="0312345678" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-200 px-6 py-4 flex items-center gap-3 bg-slate-50">
          <LinkIcon className="h-5 w-5 text-slate-500" />
          <h2 className="text-lg font-semibold text-slate-900">Kết nối nền tảng (Webhook)</h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 bg-[#f97316] rounded-md flex items-center justify-center text-white font-bold text-xl">S</div>
              <div>
                <p className="font-medium text-slate-900">Shopee</p>
                <p className="text-sm text-emerald-600 flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                  Đã kết nối
                </p>
              </div>
            </div>
            <button className="px-3 py-1.5 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50">Cấu hình</button>
          </div>
          <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 bg-black rounded-md flex items-center justify-center text-white font-bold text-xl">T</div>
              <div>
                <p className="font-medium text-slate-900">TikTok Shop</p>
                <p className="text-sm text-emerald-600 flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                  Đã kết nối
                </p>
              </div>
            </div>
            <button className="px-3 py-1.5 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50">Cấu hình</button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-200 px-6 py-4 flex items-center gap-3 bg-slate-50">
          <Printer className="h-5 w-5 text-slate-500" />
          <h2 className="text-lg font-semibold text-slate-900">Cấu hình máy in</h2>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Máy in hóa đơn POS (80mm)</label>
            <select className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none">
              <option>Xprinter XP-N160II (USB)</option>
              <option>Epson TM-T82III (LAN)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Máy in mã vạch / Vận đơn</label>
            <select className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none">
              <option>Xprinter XP-420B (USB)</option>
              <option>Godex G500 (LAN)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500">
          <Save className="mr-2 h-4 w-4" />
          Lưu thay đổi
        </button>
      </div>
    </div>
  );
}

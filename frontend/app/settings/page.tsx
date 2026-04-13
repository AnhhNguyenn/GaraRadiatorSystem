'use client';

import { useState, useEffect } from 'react';
import { Save, Store, Printer, Link as LinkIcon, Users, Shield, CheckCircle2, Globe, Bell, History, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { api, BASE_URL } from '@/lib/apiClient';
import toast from 'react-hot-toast';
import { Modal } from '@/components/ui/modal';

export default function SettingsPage() {
  const [storeName, setStoreName] = useState("Garage Radiator Parts");
  const [saving, setSaving] = useState(false);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);

  useEffect(() => {
    // Để mock, ta bỏ việc lấy từ localStorage
  }, []);

  const handleSave = () => {
    setSaving(true);
    // Bỏ lưu dữ liệu không cần thiết vào localStorage, có thể sau này gọi API cập nhật db.
    setTimeout(() => {
      setSaving(false);
      toast.success("Đã lưu cấu hình thành công!");
    }, 500);
  };

  const handleConnectShopee = () => {
    window.location.href = `${BASE_URL}/platforms/auth/generate-oauth-url/shopee`;
  };

  const handleConnectTikTok = () => {
    window.location.href = `${BASE_URL}/platforms/auth/generate-oauth-url/tiktok`;
  };

  const handleCreateStaff = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
      password: formData.get('password'),
      role: formData.get('role'),
    };

    try {
      await api.auth.createStaff(data);
      toast.success('Tạo tài khoản nhân viên thành công!');
      setIsStaffModalOpen(false);
    } catch (error) {
      toast.error('Có lỗi xảy ra khi tạo tài khoản nhân viên.');
    }
  };

  return (
    <div className="space-y-10 max-w-5xl pb-10">
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md mx-2">
        <div className="flex">
          <div className="flex-shrink-0">
            <Shield className="h-5 w-5 text-yellow-400" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700 font-bold">
              Thông tin cấu hình Pháp lý (Dành cho Hóa đơn & Thuế) được quản lý bởi Super Admin.
              <br />
              Loại hình kinh doanh: <span className="text-black font-black">Chưa xác định (Liên hệ Admin)</span> | Phương pháp Thuế: <span className="text-black font-black">Chưa xác định (Liên hệ Admin)</span>
            </p>
          </div>
        </div>
      </div>
      <div className="px-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Cài đặt hệ thống</h1>
        <p className="text-sm font-medium text-slate-500">Cấu hình thông tin cửa hàng, máy in và kết nối nền tảng thương mại.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-1">
        <div className="md:col-span-2 space-y-8">
          {/* Thông tin cửa hàng */}
          <div className="ios-card overflow-hidden">
            <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-50 flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl">
                <Store className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">Thông tin cửa hàng</h2>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Tên cửa hàng</label>
                  <Input value={storeName} onChange={(e) => setStoreName(e.target.value)} />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Số điện thoại</label>
                  <Input defaultValue="0901234567" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Địa chỉ</label>
                  <Input defaultValue="123 Đường ABC, Quận XYZ, TP.HCM" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Mã số thuế</label>
                  <Input defaultValue="0312345678" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Email hỗ trợ</label>
                  <Input defaultValue="support@radiatorerp.com" />
                </div>
              </div>
            </div>
          </div>

          {/* Cấu hình máy in */}
          <div className="ios-card overflow-hidden">
            <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-50 flex items-center gap-3">
              <div className="p-2 bg-indigo-50 rounded-xl">
                <Printer className="h-5 w-5 text-indigo-500" />
              </div>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">Cấu hình máy in</h2>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Máy in hóa đơn (Bill)</label>
                  <Select defaultValue="xprinter">
                    <SelectTrigger className="w-full h-12 rounded-2xl border border-slate-100 bg-slate-50 px-4 text-sm font-bold text-slate-600">
                      <SelectValue placeholder="Chọn máy in" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="xprinter">Xprinter XP-N160II (80mm)</SelectItem>
                      <SelectItem value="epson">Epson TM-T82III (80mm)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Máy in nhãn (Shipping)</label>
                  <Select defaultValue="xp420b">
                    <SelectTrigger className="w-full h-12 rounded-2xl border border-slate-100 bg-slate-50 px-4 text-sm font-bold text-slate-600">
                      <SelectValue placeholder="Chọn máy in nhãn" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="xp420b">Xprinter XP-420B (A6)</SelectItem>
                      <SelectItem value="zebra">Zebra ZD230 (A6)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Kết nối nền tảng */}
          <div className="ios-card overflow-hidden">
            <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-50 flex items-center gap-3">
              <div className="p-2 bg-emerald-50 rounded-xl">
                <LinkIcon className="h-5 w-5 text-emerald-500" />
              </div>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">Đa kênh</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-4 rounded-2xl border border-slate-100 bg-white shadow-sm flex items-center justify-between group hover:border-primary/20 transition-all">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-[#f97316] rounded-xl flex items-center justify-center text-white font-black text-lg shadow-lg shadow-[#f97316]/20">S</div>
                  <div>
                    <p className="text-xs font-black text-slate-900 tracking-tight">Shopee</p>
                    <div className="flex items-center gap-1">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500"></div>
                      <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-tight">Đang hoạt động</p>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="xs" onClick={handleConnectShopee} className="rounded-lg font-black text-[10px] uppercase text-primary hover:bg-primary/5">Refresh</Button>
              </div>

              <div className="p-4 rounded-2xl border border-slate-100 bg-white shadow-sm flex items-center justify-between group hover:border-primary/20 transition-all">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-black rounded-xl flex items-center justify-center text-white font-black text-lg shadow-lg shadow-black/20">T</div>
                  <div>
                    <p className="text-xs font-black text-slate-900 tracking-tight">TikTok Shop</p>
                    <div className="flex items-center gap-1">
                      <div className="h-1.5 w-1.5 rounded-full bg-slate-300"></div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Chưa kết nối</p>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="xs" onClick={handleConnectTikTok} className="rounded-lg font-black text-[10px] uppercase text-slate-900 hover:bg-slate-100">Kết nối</Button>
              </div>
            </div>
          </div>

          {/* Bảo mật & Phân quyền */}
          <div className="ios-card overflow-hidden">
            <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-rose-50 rounded-xl">
                  <Shield className="h-5 w-5 text-rose-500" />
                </div>
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">Bảo mật & Phân quyền</h2>
              </div>
              <Button onClick={() => setIsStaffModalOpen(true)} size="sm" className="rounded-xl bg-primary text-white shadow-lg shadow-primary/20">
                <Plus className="mr-2 h-4 w-4" />
                Thêm nhân viên
              </Button>
            </div>
            <div className="p-6 space-y-4">
              <Button variant="outline" className="w-full justify-start rounded-xl text-xs font-bold gap-3 border-slate-100 hover:bg-slate-50">
                <History className="h-4 w-4 text-slate-400" />
                Lịch sử đăng nhập
              </Button>
              <Button variant="outline" className="w-full justify-start rounded-xl text-xs font-bold gap-3 border-slate-100 hover:bg-slate-50">
                <Bell className="h-4 w-4 text-slate-400" />
                Cấu hình thông báo
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Staff Account Creation Modal */}
      <Modal isOpen={isStaffModalOpen} onClose={() => setIsStaffModalOpen(false)} title="Thêm tài khoản nhân viên">
        <form onSubmit={handleCreateStaff} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Tên nhân viên *</label>
              <Input name="name" required placeholder="Nguyễn Văn A" />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Email *</label>
              <Input name="email" type="email" required placeholder="nhanvien@gara.com" />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Mật khẩu khởi tạo *</label>
              <Input name="password" type="password" required placeholder="********" />
              <p className="text-xs text-slate-500 mt-1">Nhân viên sẽ được yêu cầu đổi mật khẩu ở lần đăng nhập đầu tiên.</p>
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Vai trò *</label>
              <Select name="role" required defaultValue="Staff">
                <SelectTrigger className="w-full h-12 rounded-2xl border border-slate-100 bg-slate-50 px-4 text-sm font-bold text-slate-600">
                  <SelectValue placeholder="Chọn vai trò" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Staff">Nhân viên</SelectItem>
                  <SelectItem value="Cashier">Thu ngân</SelectItem>
                  <SelectItem value="Mechanic">Thợ máy</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-8 flex justify-end gap-3 border-t border-slate-50 pt-6">
            <Button variant="ghost" type="button" onClick={() => setIsStaffModalOpen(false)} className="rounded-xl">Hủy</Button>
            <Button type="submit" className="rounded-xl bg-primary px-8">Tạo tài khoản</Button>
          </div>
        </form>
      </Modal>

      <div className="flex justify-end pt-4 px-1">
        <Button onClick={handleSave} disabled={saving} className="rounded-2xl px-12 h-14 bg-primary shadow-xl shadow-primary/25 text-lg">
          <Save className="mr-3 h-5 w-5" />
          {saving ? 'Đang lưu hệ thống...' : 'Lưu tất cả thay đổi'}
        </Button>
      </div>
    </div>
  );
}

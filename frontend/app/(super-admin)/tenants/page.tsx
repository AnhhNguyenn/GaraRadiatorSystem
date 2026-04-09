'use client';
import { useState } from 'react';
import { ShieldAlert, Plus, Lock, Unlock, RefreshCw, Key, ArrowRightCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import toast from 'react-hot-toast';

export default function TenantsPage() {
  const [isOnboardModalOpen, setIsOnboardModalOpen] = useState(false);
  const [tenants, setTenants] = useState([
    { id: '1', storeName: 'Gara Tiến Phát Auto', owner: 'tienphat@gmail.com', phone: '0988777666', plan: 'Enterprise', endDate: '15/04/2026', isActive: true },
    { id: '2', storeName: 'Đại lý Két nước Quốc Hùng', owner: 'quochung@gmail.com', phone: '0912111222', plan: 'Pro', endDate: '10/05/2026', isActive: false },
  ]);
  const [newCredentials, setNewCredentials] = useState<{email:string, password:string} | null>(null);

  const handleOnboard = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;

    // API Onboard Call Mock (In reality: call POST /api/v1/system-admin/tenants/onboard)
    setTimeout(() => {
      setNewCredentials({ email, password: 'GaraPass@' + Math.floor(Math.random()*1000) + '!' });
      toast.success('Tạo Gara thành công!');
    }, 1000);
  };

  const toggleStatus = (id: string, current: boolean) => {
    if (confirm(`Bạn muốn ${current ? 'Khóa' : 'Mở khóa'} Gara này?`)) {
      setTenants(tenants.map(t => t.id === id ? { ...t, isActive: !current } : t));
      toast.success('Cập nhật trạng thái thành công');
    }
  };

  const handleRenew = (id: string) => {
    const months = prompt('Nhập số tháng gia hạn (VD: 6, 12):', '12');
    if (months && !isNaN(Number(months))) {
      toast.success(`Đã gia hạn thêm ${months} tháng cho Gara ID: ${id}`);
    }
  };

  const handleImpersonate = (id: string) => {
    toast.success('Đang sinh JWT Read-Only... Cửa hậu đã mở', { icon: '🚪' });
    setTimeout(() => {
      window.open('/dashboard?impersonate=' + id, '_blank');
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-white flex items-center gap-2"><ShieldAlert className="h-6 w-6 text-primary" /> Quản trị Gara (Tenants)</h2>
        <Button onClick={() => setIsOnboardModalOpen(true)} className="bg-primary hover:bg-primary/90 text-white rounded-xl shadow-lg shadow-primary/30">
          <Plus className="mr-2 h-4 w-4" /> Tạo Gara Mới (Onboard)
        </Button>
      </div>

      <div className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-900 text-xs uppercase font-black text-slate-500">
            <tr>
              <th className="px-6 py-4">Tên Gara</th>
              <th className="px-6 py-4">Chủ sở hữu (Owner)</th>
              <th className="px-6 py-4 text-center">Gói cước</th>
              <th className="px-6 py-4 text-center">Hết hạn</th>
              <th className="px-6 py-4 text-center">Trạng thái</th>
              <th className="px-6 py-4 text-right">Thao tác Quyền lực</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700 font-medium">
            {tenants.map(t => (
              <tr key={t.id} className="hover:bg-slate-800/50 transition-colors">
                <td className="px-6 py-4 font-bold text-white">{t.storeName}</td>
                <td className="px-6 py-4">
                  <div className="flex flex-col"><span className="text-slate-300">{t.owner}</span><span className="text-[10px] font-black text-slate-500">{t.phone}</span></div>
                </td>
                <td className="px-6 py-4 text-center"><span className="px-2 py-1 bg-blue-900/50 text-blue-400 font-black rounded text-[10px] uppercase">{t.plan}</span></td>
                <td className="px-6 py-4 text-center text-rose-400 font-bold">{t.endDate}</td>
                <td className="px-6 py-4 text-center">
                  {t.isActive ? <span className="px-2 py-1 bg-emerald-900/50 text-emerald-400 font-black rounded text-[10px] uppercase">Active</span> : <span className="px-2 py-1 bg-rose-900/50 text-rose-400 font-black rounded text-[10px] uppercase">Locked</span>}
                </td>
                <td className="px-6 py-4 text-right flex gap-2 justify-end">
                  <Button variant="outline" size="sm" onClick={() => toggleStatus(t.id, t.isActive)} className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600">
                    {t.isActive ? <Lock className="h-4 w-4 mr-1 text-rose-400" /> : <Unlock className="h-4 w-4 mr-1 text-emerald-400" />} {t.isActive ? 'Khóa' : 'Mở Khóa'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleRenew(t.id)} className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600">
                    <RefreshCw className="h-4 w-4 mr-1 text-blue-400" /> Gia hạn
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleImpersonate(t.id)} className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600">
                    <ArrowRightCircle className="h-4 w-4 mr-1 text-orange-400" /> Hỗ trợ
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isOnboardModalOpen} onClose={() => { setIsOnboardModalOpen(false); setNewCredentials(null); }} title="Tạo Gara Khách Hàng Mới">
        {!newCredentials ? (
          <form className="space-y-4" onSubmit={handleOnboard}>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase mb-1">Tên Gara (Store Name) *</label>
              <Input name="storeName" required className="bg-slate-50 border-slate-200 text-slate-900 font-bold" />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase mb-1">Email Chủ Gara *</label>
              <Input name="email" type="email" required className="bg-slate-50 border-slate-200 text-slate-900 font-bold" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-1">Gói cước *</label>
                <select name="plan" className="w-full h-10 rounded-lg bg-slate-50 border-slate-200 text-slate-900 font-bold px-3 outline-none focus:ring-2 focus:ring-primary/20">
                  <option value="Basic">Basic (Tối đa 5 users)</option>
                  <option value="Pro">Pro (Tối đa 20 users)</option>
                  <option value="Enterprise">Enterprise (Không giới hạn)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-1">Thời hạn (Tháng) *</label>
                <Input name="months" type="number" defaultValue="12" required className="bg-slate-50 border-slate-200 text-slate-900 font-bold" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-1">Loại hình KD *</label>
                <select name="businessModel" className="w-full h-10 rounded-lg bg-slate-50 border-slate-200 text-slate-900 font-bold px-3 outline-none focus:ring-2 focus:ring-primary/20">
                  <option value="Corporate">Công ty / Doanh nghiệp</option>
                  <option value="Household">Hộ Kinh Doanh</option>
                  <option value="Personal">Cá nhân</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-1">Phương pháp thuế *</label>
                <select name="taxMethod" className="w-full h-10 rounded-lg bg-slate-50 border-slate-200 text-slate-900 font-bold px-3 outline-none focus:ring-2 focus:ring-primary/20">
                  <option value="Deduction">Khấu trừ</option>
                  <option value="Direct">Trực tiếp</option>
                </select>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-slate-100">
              <Button type="button" variant="ghost" onClick={() => setIsOnboardModalOpen(false)} className="text-slate-500">Hủy</Button>
              <Button type="submit" className="bg-primary text-white font-bold px-6">Tạo Gara (Khởi tạo DB)</Button>
            </div>
          </form>
        ) : (
          <div className="space-y-6 text-center py-6">
             <div className="mx-auto w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
               <Key className="h-8 w-8" />
             </div>
             <h3 className="text-xl font-black text-slate-900">Gara đã được tạo thành công!</h3>
             <p className="text-sm text-slate-500 font-medium">Vui lòng gửi thông tin đăng nhập này cho Chủ Gara. Họ sẽ bị bắt buộc đổi mật khẩu ở lần đăng nhập đầu tiên.</p>

             <div className="bg-slate-100 p-4 rounded-xl text-left border border-slate-200 mt-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Email đăng nhập</p>
                <p className="text-lg font-black text-slate-900 mb-4 select-all">{newCredentials.email}</p>

                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Mật khẩu khởi tạo</p>
                <p className="text-lg font-black text-slate-900 select-all">{newCredentials.password}</p>
             </div>

             <Button onClick={() => { setIsOnboardModalOpen(false); setNewCredentials(null); }} className="w-full bg-slate-900 text-white h-12 rounded-xl mt-4">Hoàn tất</Button>
          </div>
        )}
      </Modal>
    </div>
  );
}

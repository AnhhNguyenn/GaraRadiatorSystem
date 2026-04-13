"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Shield, Lock, ArrowRight, Eye, EyeOff } from "lucide-react";
import { BASE_URL } from "@/lib/apiClient";

export default function ChangePasswordPage() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const storedUserId = sessionStorage.getItem("change_password_user_id");
    if (!storedUserId) {
      toast.error("Không tìm thấy thông tin phiên đăng nhập. Vui lòng đăng nhập lại.");
      router.push("/login");
    } else {
      setUserId(storedUserId);
    }
  }, [router]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.error("Vui lòng nhập đầy đủ thông tin.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Mật khẩu mới và xác nhận mật khẩu không khớp.");
      return;
    }

    if (!userId) {
       toast.error("Lỗi phiên đăng nhập.");
       return;
    }

    setLoading(true);
    const toastId = toast.loading("Đang cập nhật mật khẩu...");

    try {
      const response = await fetch(`${BASE_URL}/auth/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userId, oldPassword, newPassword }),
      });

      if (response.ok) {
        toast.success("Đổi mật khẩu thành công! Chào mừng đến hệ thống.", { id: toastId });
        sessionStorage.removeItem("change_password_user_id");
        router.push("/");
      } else {
        let errText = "Đổi mật khẩu thất bại.";
        try {
          const errJson = await response.json();
          if (errJson.message) errText = errJson.message;
          else if (Array.isArray(errJson) && errJson.length > 0 && errJson[0].description) {
             errText = errJson[0].description;
          }
        } catch {
           errText = await response.text() || errText;
        }
        toast.error(`Lỗi: ${errText}`, { id: toastId });
      }
    } catch (err: any) {
      console.error("Change Password Network Error:", err);
      toast.error("Mất kết nối máy chủ. Vui lòng kiểm tra lại mạng hoặc liên hệ quản trị viên.", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  if (!userId) return null; // Prevent rendering before effect redirect

  return (
    <div className="min-h-screen w-full flex bg-slate-50 font-sans">
      {/* Left Panel - Branding (Hidden on mobile) */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 flex-col justify-between relative overflow-hidden">
        {/* Background Decorative Patterns */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
           <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-emerald-500 blur-3xl"></div>
           <div className="absolute bottom-12 right-12 w-64 h-64 rounded-full bg-blue-500 blur-3xl"></div>
        </div>

        <div className="p-12 relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-widest">GARA <span className="text-emerald-400">ERP</span></h1>
          </div>

          <div className="space-y-6 max-w-lg">
            <h2 className="text-5xl font-black text-white leading-tight tracking-tight">
              Bảo mật <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Tài khoản.</span>
            </h2>
            <p className="text-lg text-slate-400 font-medium leading-relaxed">
              Vui lòng thay đổi mật khẩu mặc định để bảo vệ tài khoản của bạn. Mật khẩu mới cần có độ phức tạp cao, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt.
            </p>
          </div>
        </div>

        <div className="p-12 relative z-10">
          <div className="flex items-center gap-4 text-sm font-bold text-slate-500">
             <span>© 2024 Garage Radiator Solutions.</span>
             <span>|</span>
             <a href="#" className="hover:text-emerald-400 transition-colors">Privacy</a>
             <span>|</span>
             <a href="#" className="hover:text-emerald-400 transition-colors">Terms</a>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-24 relative">
        <div className="w-full max-w-md space-y-10 relative z-10">
          {/* Mobile Logo */}
          <div className="flex lg:hidden items-center gap-3 justify-center mb-12">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-xl font-black text-slate-900 tracking-widest">GARA <span className="text-emerald-500">ERP</span></h1>
          </div>

          <div className="space-y-3">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Đổi mật khẩu khởi tạo</h2>
            <p className="text-sm font-medium text-slate-500">Vì lý do bảo mật, bạn cần đổi mật khẩu trước khi tiếp tục.</p>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">Mật khẩu hiện tại</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type={showOldPassword ? "text" : "password"}
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-14 rounded-2xl border-2 border-slate-100 bg-white pl-12 pr-12 text-sm font-bold text-slate-900 placeholder:font-medium placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowOldPassword(!showOldPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showOldPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">Mật khẩu mới</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-14 rounded-2xl border-2 border-slate-100 bg-white pl-12 pr-12 text-sm font-bold text-slate-900 placeholder:font-medium placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">Xác nhận mật khẩu mới</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-14 rounded-2xl border-2 border-slate-100 bg-white pl-12 pr-12 text-sm font-bold text-slate-900 placeholder:font-medium placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-xl shadow-emerald-600/20 transition-all disabled:opacity-70 flex items-center justify-center gap-2 group mt-8"
            >
              {loading ? (
                <>
                  <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <>
                  <span>Xác nhận đổi mật khẩu</span>
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="pt-8 text-center border-t border-slate-100">
            <p className="text-xs font-medium text-slate-500">
              Hệ thống được bảo vệ bởi chứng chỉ SSL 256-bit và nền tảng hạ tầng bảo mật cấp doanh nghiệp. Mọi nỗ lực xâm nhập trái phép sẽ bị ghi nhận IP.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

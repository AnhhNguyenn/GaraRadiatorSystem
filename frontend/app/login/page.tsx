"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Vui lòng nhập đầy đủ Email và Mật khẩu!");
      return;
    }

    setLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5248";
      const response = await fetch(`${apiUrl}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Cần thiết để lưu HttpOnly cookie nếu API set trực tiếp cho domain con
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.requirePasswordChange) {
           toast.success(data.message || "Bạn cần đổi mật khẩu khởi tạo!");
           // Trong thực tế sẽ chuyển sang form đổi pass, ở đây tạm redirect hoặc để Admin tự xử lý
           router.push("/change-password");
        } else {
           toast.success("Đăng nhập thành công!");
           router.push("/dashboard"); // Chuyển thẳng vào dashboard
        }
      } else {
        let errText = "Sai tài khoản hoặc mật khẩu";
        try {
          const errJson = await response.json();
          if (errJson.message) errText = errJson.message;
        } catch {
           errText = await response.text() || errText;
        }
        toast.error("Lỗi đăng nhập: " + errText);
      }
    } catch (err: any) {
      console.error("Login Error:", err);
      toast.error("Hệ thống đang bảo trì hoặc mất kết nối. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-slate-100">
      <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Garage Radiator ERP</h1>
          <p className="text-sm font-medium text-slate-500 mt-2">Hệ thống quản lý kho & đa kênh</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Mật khẩu</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all disabled:opacity-50"
          >
            {loading ? "Đang xác thực..." : "Đăng nhập hệ thống"}
          </button>
        </form>
      </div>
    </div>
  );
}

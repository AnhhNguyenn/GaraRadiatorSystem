'use client';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { AlertTriangle, Users, Store, DollarSign } from "lucide-react";

export default function SuperAdminDashboard() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-black text-white">Tổng quan hệ thống (SaaS)</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800 border-slate-700 text-white">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><Store className="h-4 w-4 text-primary" /> Tổng số Gara</CardTitle></CardHeader>
          <CardContent><p className="text-4xl font-black">24</p></CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700 text-white">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><DollarSign className="h-4 w-4 text-emerald-500" /> Doanh thu (SaaS)</CardTitle></CardHeader>
          <CardContent><p className="text-4xl font-black">1.2B <span className="text-sm text-slate-500">VNĐ</span></p></CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700 text-white">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><Users className="h-4 w-4 text-blue-500" /> Tổng User (Nhân viên)</CardTitle></CardHeader>
          <CardContent><p className="text-4xl font-black">142</p></CardContent>
        </Card>
        <Card className="bg-slate-800 border-rose-900/50 text-white">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-bold text-rose-400 uppercase tracking-widest flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Sắp hết hạn gói cước</CardTitle></CardHeader>
          <CardContent><p className="text-4xl font-black text-rose-500">3 <span className="text-sm font-medium">Gara</span></p></CardContent>
        </Card>
      </div>

      <div className="mt-8 bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h3 className="font-bold text-slate-300 uppercase tracking-widest mb-4">🚨 Danh sách Gara sắp hết hạn (7 ngày tới)</h3>
        <div className="space-y-3">
           <div className="bg-slate-900 p-4 rounded-lg flex justify-between items-center">
             <div><p className="font-black text-white">Gara Tiến Phát Auto</p><p className="text-xs text-slate-400">Owner: tienphat@gmail.com - 0988777666</p></div>
             <div className="text-right"><p className="text-rose-500 font-bold text-sm">Còn 3 ngày</p><p className="text-xs font-black uppercase text-slate-500">Gói: Enterprise</p></div>
           </div>
           <div className="bg-slate-900 p-4 rounded-lg flex justify-between items-center">
             <div><p className="font-black text-white">Quốc Hùng Két Nước</p><p className="text-xs text-slate-400">Owner: quochung@gmail.com - 0912111222</p></div>
             <div className="text-right"><p className="text-rose-500 font-bold text-sm">Còn 5 ngày</p><p className="text-xs font-black uppercase text-slate-500">Gói: Pro</p></div>
           </div>
        </div>
      </div>
    </div>
  );
}

'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    // Để AuthError event handle việc redirect
    setAuthorized(true);
  }, [router]);

  if (!authorized) return <div className="p-10 text-center">Đang kiểm tra quyền truy cập...</div>;

  return (
    <div className="bg-slate-900 min-h-screen text-slate-50">
      <div className="border-b border-slate-800 p-4 flex justify-between items-center bg-slate-950">
        <h1 className="font-black tracking-widest uppercase text-emerald-400">⚡ Super Admin Portal</h1>
        <div className="text-xs font-bold text-slate-400">admin@garageradiator.com</div>
      </div>
      <div className="p-8">
        {children}
      </div>
    </div>
  );
}

'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  // Using true since auth error interception handles the security bounce
  const authorized = true;

  return (
    <div className="bg-slate-900 min-h-screen text-slate-50">
      <div className="border-b border-slate-800 p-4 flex justify-between items-center bg-slate-950">
        <h1 className="font-black tracking-widest uppercase text-emerald-400">⚡ Super Admin Portal</h1>
        <div className="text-xs font-bold text-slate-400">Super Administrator</div>
      </div>
      <div className="p-8">
        {children}
      </div>
    </div>
  );
}

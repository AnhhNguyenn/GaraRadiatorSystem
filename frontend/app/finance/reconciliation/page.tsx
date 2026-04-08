'use client';

import { useState, useEffect } from 'react';
import { FileSearch, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/apiClient';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function ReconciliationPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await api.finance.reconciliation();
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 px-2">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Đối soát Tài chính (TMĐT)</h1>
          <p className="text-sm font-medium text-slate-500">So khớp doanh thu thực nhận và phí sàn để phát hiện chênh lệch.</p>
        </div>
      </div>

      <div className="ios-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã đơn</TableHead>
              <TableHead>Nền tảng</TableHead>
              <TableHead className="text-right">Giá bán (Khách trả)</TableHead>
              <TableHead className="text-right">Phí sàn + Ship</TableHead>
              <TableHead className="text-right">Thực nhận (Sàn trả)</TableHead>
              <TableHead className="text-right">Biên lợi nhuận</TableHead>
              <TableHead className="text-center">Trạng thái</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7}><Skeleton className="h-20 w-full" /></TableCell></TableRow>
            ) : data.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-10 italic">Chưa có dữ liệu đơn hàng hoàn thành để đối soát</TableCell></TableRow>
            ) : data.map((item) => {
              const isWarning = item.platformFee + item.shippingFee > item.totalAmount * 0.2;
              return (
                <TableRow key={item.id} className={isWarning ? 'bg-rose-50/50' : ''}>
                  <TableCell className="font-bold text-slate-900">{item.id.substring(0, 8).toUpperCase()}</TableCell>
                  <TableCell className="font-black text-[10px] uppercase text-slate-500">{item.source}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(item.totalAmount)}</TableCell>
                  <TableCell className="text-right font-medium text-rose-600">-{formatCurrency(item.platformFee + item.shippingFee)}</TableCell>
                  <TableCell className="text-right font-bold text-slate-900">{formatCurrency(item.actualReceived)}</TableCell>
                  <TableCell className="text-right font-black text-emerald-600">{formatCurrency(item.actualProfit)}</TableCell>
                  <TableCell className="text-center">
                     {isWarning ? (
                       <span className="inline-flex items-center gap-1 text-[10px] uppercase font-black text-rose-600 bg-rose-100 px-2 py-1 rounded"><AlertTriangle className="h-3 w-3" /> Phí &gt; 20%</span>
                     ) : (
                       <span className="inline-flex items-center gap-1 text-[10px] uppercase font-black text-emerald-600 bg-emerald-100 px-2 py-1 rounded"><CheckCircle2 className="h-3 w-3" /> Bình thường</span>
                     )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

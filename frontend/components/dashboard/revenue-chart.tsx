'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const data = [
  { name: 'T2', offline: 4000000, shopee: 2400000, tiktok: 2400000 },
  { name: 'T3', offline: 3000000, shopee: 1398000, tiktok: 2210000 },
  { name: 'T4', offline: 2000000, shopee: 9800000, tiktok: 2290000 },
  { name: 'T5', offline: 2780000, shopee: 3908000, tiktok: 2000000 },
  { name: 'T6', offline: 1890000, shopee: 4800000, tiktok: 2181000 },
  { name: 'T7', offline: 2390000, shopee: 3800000, tiktok: 2500000 },
  { name: 'CN', offline: 3490000, shopee: 4300000, tiktok: 2100000 },
];

export function RevenueChart() {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} tickFormatter={(value) => `${value / 1000000}M`} />
        <Tooltip
          cursor={{ fill: '#f1f5f9' }}
          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          formatter={(value: any) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)}
        />
        <Bar dataKey="offline" name="Cửa hàng" stackId="a" fill="#3b82f6" radius={[0, 0, 4, 4]} />
        <Bar dataKey="shopee" name="Shopee" stackId="a" fill="#f97316" />
        <Bar dataKey="tiktok" name="TikTok" stackId="a" fill="#000000" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

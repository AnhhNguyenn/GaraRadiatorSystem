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
        <CartesianGrid strokeDasharray="0" vertical={false} stroke="oklch(0.95 0 0)" />
        <XAxis 
          dataKey="name" 
          axisLine={false} 
          tickLine={false} 
          tick={{ fill: 'oklch(0.6 0 0)', fontSize: 12, fontWeight: 600 }} 
          dy={10}
        />
        <YAxis 
          axisLine={false} 
          tickLine={false} 
          tick={{ fill: 'oklch(0.6 0 0)', fontSize: 11, fontWeight: 600 }} 
          tickFormatter={(value) => `${value / 1000000}M`}
          dx={-10}
        />
        <Tooltip
          cursor={{ fill: 'oklch(0.98 0 0)' }}
          contentStyle={{ 
            borderRadius: '24px', 
            border: 'none', 
            boxShadow: '0 12px 48px rgba(0, 0, 0, 0.12)',
            padding: '12px 16px',
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(16px)'
          }}
          itemStyle={{ fontWeight: 700, fontSize: '12px' }}
          formatter={(value: any) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)}
        />
        <Bar dataKey="offline" name="Cửa hàng" stackId="a" fill="oklch(0.55 0.2 250)" radius={[0, 0, 4, 4]} />
        <Bar dataKey="shopee" name="Shopee" stackId="a" fill="oklch(0.65 0.2 40)" />
        <Bar dataKey="tiktok" name="TikTok" stackId="a" fill="oklch(0.2 0 0)" radius={[10, 10, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const data = [
  { name: 'Cửa hàng', value: 45 },
  { name: 'Shopee', value: 35 },
  { name: 'TikTok', value: 20 },
];

const COLORS = ['oklch(0.55 0.2 250)', 'oklch(0.65 0.2 40)', 'oklch(0.2 0 0)'];

export function PlatformChart() {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="45%"
          innerRadius={70}
          outerRadius={100}
          paddingAngle={8}
          dataKey="value"
          stroke="none"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ 
            borderRadius: '24px', 
            border: 'none', 
            boxShadow: '0 12px 48px rgba(0, 0, 0, 0.12)',
            padding: '12px 16px',
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(16px)'
          }}
          itemStyle={{ fontWeight: 700, fontSize: '12px' }}
          formatter={(value: any) => `${value}%`}
        />
        <Legend 
          verticalAlign="bottom" 
          height={36} 
          iconType="circle" 
          formatter={(value) => <span className="text-[12px] font-bold text-slate-500 uppercase tracking-widest px-2">{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

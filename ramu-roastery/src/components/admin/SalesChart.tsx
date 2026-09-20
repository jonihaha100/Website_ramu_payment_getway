"use client";

import { useState, useMemo, useEffect } from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";

type Period = 'Day' | 'Month' | 'Year';

export default function SalesChart() {
  const [period, setPeriod] = useState<Period>('Month');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/orders')
      .then(res => res.json())
      .then(data => {
        setOrders(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch orders for chart", err);
        setLoading(false);
      });
  }, []);

  const chartData = useMemo(() => {
    // Only include paid orders for revenue calculation
    const validOrders = orders.filter(o => 
      o.status !== 'Cancelled' && o.status !== 'Pending'
    );
    const aggregated: Record<string, number> = {};

    validOrders.forEach(order => {
      const date = new Date(order.date);
      let key = '';

      if (period === 'Day') {
        key = date.toLocaleDateString('id-ID'); // e.g. "25/8/2026"
      } else if (period === 'Month') {
        const month = date.toLocaleString('id-ID', { month: 'short' });
        const year = date.getFullYear();
        key = `${month} ${year}`; // e.g. "Agu 2026"
      } else if (period === 'Year') {
        key = date.getFullYear().toString(); // e.g. "2026"
      }

      if (aggregated[key]) {
        aggregated[key] += order.total;
      } else {
        aggregated[key] = order.total;
      }
    });

    // Convert to array and sort chronologically (simple sort for this demo)
    return Object.keys(aggregated).map(key => ({
      name: key,
      revenue: aggregated[key]
    })).sort((a, b) => {
      if (period === 'Year') return Number(a.name) - Number(b.name);
      return 0; // Keeping simple, in a real app you'd parse dates properly for exact sorting
    });
  }, [period, orders]);

  return (
    <div style={{ backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 style={{ margin: 0, color: '#374151' }}>Sales Analytics</h3>
        
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {['Day', 'Month', 'Year'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p as Period)}
              style={{
                padding: '0.25rem 0.75rem',
                borderRadius: '0.25rem',
                border: '1px solid #d1d5db',
                backgroundColor: period === p ? '#111827' : '#ffffff',
                color: period === p ? '#ffffff' : '#374151',
                cursor: 'pointer',
                fontSize: '0.875rem'
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div style={{ width: '100%', height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        {loading ? (
          <p style={{ color: '#6b7280' }}>Loading chart data...</p>
        ) : (
          <ResponsiveContainer>
            <BarChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280'}} />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{fill: '#6b7280'}}
              tickFormatter={(value) => `Rp ${(value / 1000)}k`}
            />
            <Tooltip 
              formatter={(value) => [`Rp ${Number(value || 0).toLocaleString('id-ID')}`, 'Revenue']}
              cursor={{fill: '#f3f4f6'}}
            />
            <Bar dataKey="revenue" fill="#111827" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

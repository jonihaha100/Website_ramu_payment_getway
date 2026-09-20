"use client";

import { useEffect, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

// Simulated live server data
const generateInitialData = () => {
  const data = [];
  let time = new Date().getTime() - 60000 * 20; // past 20 minutes
  for (let i = 0; i < 20; i++) {
    data.push({
      time: new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      cpu: Math.floor(Math.random() * 30) + 20, // 20% to 50%
      memory: Math.floor(Math.random() * 20) + 40, // 40% to 60%
    });
    time += 60000; // +1 minute
  }
  return data;
};

export default function SystemChart() {
  const [data, setData] = useState(generateInitialData());

  // Simulate real-time updates every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setData((prev) => {
        const newData = [...prev];
        newData.shift(); // remove oldest
        
        // Add new reading
        const now = new Date();
        newData.push({
          time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          cpu: Math.floor(Math.random() * 40) + 20,
          memory: Math.floor(Math.random() * 15) + 45,
        });
        
        return newData;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ width: '100%', height: 350, backgroundColor: 'white', padding: '1rem', borderRadius: '0.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
      <h3 style={{ margin: '0 0 1rem 0', color: '#374151', fontSize: '1rem' }}>Live Resource Usage (%)</h3>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorMemory" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
          <XAxis dataKey="time" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
          />
          <Area type="monotone" dataKey="cpu" stroke="#ef4444" fillOpacity={1} fill="url(#colorCpu)" name="CPU Usage" />
          <Area type="monotone" dataKey="memory" stroke="#3b82f6" fillOpacity={1} fill="url(#colorMemory)" name="Memory Usage" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

import React, { useState } from 'react';

interface Subscription {
  id: string;
  userEmail: string;
  productName: string;
  nextDelivery: string;
  status: string;
}

export default function SubscriptionCalendar({ subscriptions }: { subscriptions: Subscription[] }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const getDeliveriesForDay = (day: number) => {
    const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();
    return subscriptions.filter(sub => 
      new Date(sub.nextDelivery).toDateString() === targetDate && sub.status === 'Active'
    );
  };

  return (
    <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e5e7eb', marginBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold' }}>Jadwal Sangrai & Pengiriman Langganan</h3>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button onClick={prevMonth} style={{ background: 'none', border: '1px solid #d1d5db', padding: '0.25rem 0.75rem', borderRadius: '4px', cursor: 'pointer' }}>&larr; Prev</button>
          <span style={{ fontWeight: 'bold' }}>
            {currentDate.toLocaleString('id-ID', { month: 'long', year: 'numeric' })}
          </span>
          <button onClick={nextMonth} style={{ background: 'none', border: '1px solid #d1d5db', padding: '0.25rem 0.75rem', borderRadius: '4px', cursor: 'pointer' }}>Next &rarr;</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem', textAlign: 'center', marginBottom: '0.5rem' }}>
        {['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'].map(d => (
          <div key={d} style={{ fontWeight: 'bold', fontSize: '0.875rem', color: '#6b7280' }}>{d}</div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem' }}>
        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
          <div key={`empty-${i}`} style={{ padding: '2rem', backgroundColor: '#f9fafb', borderRadius: '4px' }} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const deliveries = getDeliveriesForDay(day);
          const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();
          
          return (
            <div key={day} style={{ padding: '0.5rem', minHeight: '80px', border: isToday ? '2px solid #3b82f6' : '1px solid #e5e7eb', borderRadius: '4px', backgroundColor: isToday ? '#eff6ff' : 'white' }}>
              <div style={{ fontWeight: 'bold', fontSize: '0.875rem', color: isToday ? '#1d4ed8' : '#374151', marginBottom: '0.5rem' }}>{day}</div>
              {deliveries.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {deliveries.map(sub => (
                    <div key={sub.id} style={{ fontSize: '0.7rem', padding: '0.25rem', backgroundColor: '#dcfce7', color: '#166534', borderRadius: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      📦 {sub.userEmail.split('@')[0]}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

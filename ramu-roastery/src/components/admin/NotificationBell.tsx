"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NotificationBell() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch("/api/notifications?userEmail=admin@ramuroastery.com");
        if (res.ok) {
          const data = await res.json();
          setNotifications(data);
        }
      } catch (e) {
        console.error("Failed to fetch admin notifications", e);
      }
    };
    
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsReadAndNavigate = async (notification: any) => {
    try {
      if (!notification.read) {
        await fetch('/api/notifications', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: notification.id })
        });
        setNotifications(notifications.map(n => 
          n.id === notification.id ? { ...n, read: true } : n
        ));
      }
    } catch (e) {}
    
    setIsOpen(false);
    if (notification.href && notification.href !== '#') {
      router.push(notification.href);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllAsRead: true, userEmail: 'admin@ramuroastery.com' })
      });
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch (e) {}
  };

  const getIconForTitle = (title: string) => {
    if (title.toLowerCase().includes('pesanan')) return '🛍️';
    if (title.toLowerCase().includes('custom sourcing')) return '☕';
    if (title.toLowerCase().includes('stock')) return '📦';
    if (title.toLowerCase().includes('review')) return '⭐';
    return '🔔';
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          position: 'relative',
          padding: '0.5rem',
          fontSize: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        🔔
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '0',
            right: '0',
            backgroundColor: '#ef4444',
            color: 'white',
            fontSize: '0.65rem',
            fontWeight: 'bold',
            borderRadius: '9999px',
            width: '18px',
            height: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: 'translate(25%, -25%)'
          }}>
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: '0',
          marginTop: '0.5rem',
          width: '350px',
          backgroundColor: '#ffffff',
          borderRadius: '0.5rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          border: '1px solid #e5e7eb',
          zIndex: 50,
          maxHeight: '400px',
          overflowY: 'auto'
        }}>
          <div style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', color: '#111827' }}>Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: '0.75rem', cursor: 'pointer' }}
              >
                Mark all read
              </button>
            )}
          </div>
          
          <div>
            {notifications.length > 0 ? (
              notifications.map(notification => (
                <div 
                  key={notification.id}
                  onClick={() => markAsReadAndNavigate(notification)}
                  style={{ 
                    padding: '1rem', 
                    borderBottom: '1px solid #f3f4f6',
                    backgroundColor: notification.read ? '#ffffff' : '#eff6ff',
                    cursor: 'pointer',
                    display: 'flex',
                    gap: '1rem',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (notification.read) e.currentTarget.style.backgroundColor = '#f9fafb';
                  }}
                  onMouseLeave={(e) => {
                    if (notification.read) e.currentTarget.style.backgroundColor = '#ffffff';
                  }}
                >
                  <div style={{ fontSize: '1.5rem' }}>
                    {getIconForTitle(notification.title)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <strong style={{ fontSize: '0.875rem', color: '#111827' }}>{notification.title}</strong>
                      <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>
                        {new Date(notification.time).toLocaleString('id-ID')}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: '#4b5563' }}>{notification.desc}</p>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280', fontSize: '0.875rem' }}>
                Tidak ada notifikasi.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

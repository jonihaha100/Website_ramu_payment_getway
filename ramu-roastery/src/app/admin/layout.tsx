"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import "./admin.css"; 
import NotificationBell from "../../components/admin/NotificationBell";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pendingReturnsCount, setPendingReturnsCount] = useState(0);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const [pendingSubscriptionsCount, setPendingSubscriptionsCount] = useState(0);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    // If we're not on the login page, check for admin token via secure verification endpoint
    if (pathname !== '/admin/login') {
      fetch('/api/admin/verify')
        .then(res => {
          if (!res.ok) {
            router.push('/admin/login');
            return null;
          }
          return res.json();
        })
        .then(data => {
          if (data?.authenticated) {
            setIsAuthenticated(true);
            
            fetch('/api/returns').then(res => res.json()).then(returnsData => {
              if (Array.isArray(returnsData)) {
                const pending = returnsData.filter((r: any) => r.status === 'Pending').length;
                setPendingReturnsCount(pending);
              }
            }).catch(err => console.error(err));

            fetch('/api/orders').then(res => res.json()).then(ordersData => {
              if (Array.isArray(ordersData)) {
                const pending = ordersData.filter((o: any) => o.status === 'Pending').length;
                setPendingOrdersCount(pending);
              }
            }).catch(err => console.error(err));

            fetch('/api/admin/subscriptions').then(res => res.json()).then(subsData => {
              if (Array.isArray(subsData)) {
                const now = new Date();
                const due = subsData.filter((s: any) => s.status === 'Active' && new Date(s.nextDelivery) <= now).length;
                setPendingSubscriptionsCount(due);
              }
            }).catch(err => console.error(err));
          }
        })
        .catch(() => {
          router.push('/admin/login');
        });
    }
  }, [pathname, router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
    } catch (_e) {}
    router.push("/admin/login");
  };

  // If the user is on the login page, bypass layout entirely
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  // Prevent flashing content while checking auth
  if (!isAuthenticated) {
    return null; 
  }

  return (
    <div className="admin-container">
      {/* Sidebar Navigation */}
      <aside className={`admin-sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="admin-logo" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '1rem 0', borderBottom: '1px solid #374151', marginBottom: '1rem', position: 'relative' }}>
          <img src="/ramu_logo.png" alt="Ramu Admin Logo" style={{ width: '120px', height: '120px', borderRadius: '16px', objectFit: 'cover', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)' }} />
          <h2 style={{ margin: 0, fontSize: '1.25rem', textAlign: 'center', fontWeight: 'bold', color: '#f3f4f6' }}>Ramu Admin</h2>
        </div>
        <nav className="admin-nav">
          <Link href="/admin" className={`admin-nav-link ${pathname === '/admin' ? 'active' : ''}`}>
            <span className="nav-icon">📊</span> <span className="link-text">Dashboard</span>
          </Link>
          <Link href="/admin/orders" className={`admin-nav-link ${pathname === '/admin/orders' ? 'active' : ''}`} style={{ display: 'flex', justifyContent: isSidebarCollapsed ? 'center' : 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="nav-icon">🛒</span> <span className="link-text">Orders</span>
            </div>
            {pendingOrdersCount > 0 && !isSidebarCollapsed && (
              <span className="link-text" style={{ 
                backgroundColor: '#ef4444', 
                color: 'white', 
                fontSize: '0.75rem', 
                padding: '0.1rem 0.5rem', 
                borderRadius: '9999px',
                fontWeight: 'bold'
              }}>
                {pendingOrdersCount}
              </span>
            )}
          </Link>
          <Link href="/admin/products" className={`admin-nav-link ${pathname === '/admin/products' ? 'active' : ''}`}>
            <span className="nav-icon">☕</span> <span className="link-text">Products</span>
          </Link>
          <Link href="/admin/subscriptions" className={`admin-nav-link ${pathname === '/admin/subscriptions' ? 'active' : ''}`} style={{ display: 'flex', justifyContent: isSidebarCollapsed ? 'center' : 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="nav-icon">🔄</span> <span className="link-text">Subscriptions</span>
            </div>
            {pendingSubscriptionsCount > 0 && !isSidebarCollapsed && (
              <span className="link-text" style={{ 
                backgroundColor: '#ef4444', 
                color: 'white', 
                fontSize: '0.75rem', 
                padding: '0.1rem 0.5rem', 
                borderRadius: '9999px',
                fontWeight: 'bold'
              }}>
                {pendingSubscriptionsCount}
              </span>
            )}
          </Link>
          <Link href="/admin/users" className={`admin-nav-link ${pathname === '/admin/users' ? 'active' : ''}`}>
            <span className="nav-icon">👥</span> <span className="link-text">Customers</span>
          </Link>
          <Link href="/admin/reviews" className={`admin-nav-link ${pathname === '/admin/reviews' ? 'active' : ''}`}>
            <span className="nav-icon">⭐</span> <span className="link-text">Reviews</span>
          </Link>
          <Link href="/admin/returns" className={`admin-nav-link ${pathname === '/admin/returns' ? 'active' : ''}`} style={{ display: 'flex', justifyContent: isSidebarCollapsed ? 'center' : 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="nav-icon">🔄</span> <span className="link-text">Returns</span>
            </div>
            {pendingReturnsCount > 0 && !isSidebarCollapsed && (
              <span className="link-text" style={{ 
                  backgroundColor: '#ef4444', 
                  color: 'white', 
                  fontSize: '0.75rem', 
                  padding: '0.1rem 0.5rem', 
                  borderRadius: '9999px',
                  fontWeight: 'bold'
                }}>
                  {pendingReturnsCount}
              </span>
            )}
          </Link>
          <Link href="/admin/custom-sourcing" className={`admin-nav-link ${pathname === '/admin/custom-sourcing' ? 'active' : ''}`}>
            <span className="nav-icon">🏢</span> <span className="link-text">B2B / Custom Sourcing</span>
          </Link>
          <Link href="/admin/reports" className={`admin-nav-link ${pathname === '/admin/reports' ? 'active' : ''}`}>
            <span className="nav-icon">📈</span> <span className="link-text">Reports</span>
          </Link>
          <Link href="/admin/promos" className={`admin-nav-link ${pathname === '/admin/promos' ? 'active' : ''}`}>
            <span className="nav-icon">🎟️</span> <span className="link-text">Promo Codes</span>
          </Link>
          <Link href="/admin/settings" className={`admin-nav-link ${pathname === '/admin/settings' ? 'active' : ''}`}>
            <span className="nav-icon">⚙️</span> <span className="link-text">Store Settings</span>
          </Link>
          <Link href="/admin/system" className={`admin-nav-link ${pathname === '/admin/system' ? 'active' : ''}`} style={{ borderTop: '1px solid #e5e7eb', marginTop: '0.5rem', paddingTop: '0.5rem' }}>
            <span className="nav-icon">🖥️</span> <span className="link-text">System Monitor</span>
          </Link>
          <Link href="/catalog" className="admin-nav-link" target="_blank">
            <span className="nav-icon">🌐</span> <span className="link-text">View Store</span>
          </Link>
          <div style={{ marginTop: 'auto', paddingTop: '2rem' }}>
            <button 
              onClick={handleLogout}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: 'transparent',
                color: '#ef4444',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 'bold',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              <span className="nav-icon">🚪</span> <span className="link-text">Log Out</span>
            </button>
          </div>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="admin-main">
        <header className="admin-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button 
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', padding: '0.5rem', borderRadius: '0.25rem', backgroundColor: '#f3f4f6' }}
            >
              ☰
            </button>
            <h1>Welcome, Admin</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <NotificationBell />
            <button 
              onClick={handleLogout}
              style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', textDecoration: 'underline', fontSize: '0.875rem' }}
            >
              Sign Out
            </button>
          </div>
        </header>
        <div className="admin-content">
          {children}
        </div>
      </main>
    </div>
  );
}

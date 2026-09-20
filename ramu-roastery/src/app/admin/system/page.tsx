import SystemChart from "../../../components/admin/SystemChart";

export default function SystemMonitorPage() {
  return (
    <div>
      <div style={{
          backgroundColor: '#eff6ff',
          borderLeft: '4px solid #3b82f6',
          padding: '1rem',
          marginBottom: '2rem',
          borderRadius: '0.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
        <span style={{ fontSize: '1.25rem' }}>ℹ️</span>
        <div>
          <h3 style={{ margin: 0, color: '#1e40af', fontSize: '1rem' }}>Server Status: Normal</h3>
          <p style={{ margin: '0.25rem 0 0 0', color: '#1d4ed8', fontSize: '0.875rem' }}>
            All systems are fully operational. No major issues detected.
          </p>
        </div>
      </div>

      <h2 style={{ marginTop: 0, marginBottom: '2rem', color: '#111827' }}>System Monitor</h2>
      
      <div className="admin-stats-grid" style={{ marginBottom: '2rem' }}>
        <div className="admin-stat-card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }}></span>
            Live Visitors
          </h3>
          <p>1,245</p>
        </div>
        <div className="admin-stat-card">
          <h3>Server Latency</h3>
          <p>42ms</p>
        </div>
        <div className="admin-stat-card">
          <h3>Error Rate</h3>
          <p>0.02%</p>
        </div>
        <div className="admin-stat-card">
          <h3>Uptime</h3>
          <p>99.98%</p>
        </div>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <SystemChart />
      </div>

      <div>
        <h3 style={{ color: '#374151', marginBottom: '1rem' }}>Server Instances</h3>
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Instance ID</th>
                <th>Region</th>
                <th>Status</th>
                <th>CPU Usage</th>
                <th>Memory</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>node-sg-01</strong></td>
                <td>Singapore</td>
                <td><span className="status-badge delivered">Healthy</span></td>
                <td>34%</td>
                <td>1.2 GB / 2 GB</td>
              </tr>
              <tr>
                <td><strong>node-sg-02</strong></td>
                <td>Singapore</td>
                <td><span className="status-badge delivered">Healthy</span></td>
                <td>28%</td>
                <td>0.9 GB / 2 GB</td>
              </tr>
              <tr>
                <td><strong>db-primary-sg</strong></td>
                <td>Singapore</td>
                <td><span className="status-badge delivered">Healthy</span></td>
                <td>45%</td>
                <td>3.4 GB / 8 GB</td>
              </tr>
              <tr>
                <td><strong>cache-redis-01</strong></td>
                <td>Singapore</td>
                <td><span className="status-badge delivered">Healthy</span></td>
                <td>12%</td>
                <td>150 MB / 1 GB</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

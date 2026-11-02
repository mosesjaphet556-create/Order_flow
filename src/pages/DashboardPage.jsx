import { Link } from 'react-router-dom'
import { useApp } from '../context/useApp.js'
import StatusBadge from '../components/StatusBadge.jsx'
import { EXCEPTION_STATUSES } from '../models/delivery.js'

const fmtDate = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

const statCards = (stats) => [
  { label: 'Total Deliveries', value: stats.total, sub: 'all time', color: 'var(--color-neutral-800)' },
  { label: 'Active', value: stats.active, sub: 'in transit', color: 'var(--color-info-600)' },
  { label: 'Delivered', value: stats.delivered, sub: 'completed', color: 'var(--color-success-600)' },
  { label: 'Exceptions', value: stats.exceptions, sub: 'require action', color: stats.exceptions > 0 ? 'var(--color-danger-600)' : 'var(--color-neutral-400)' },
  { label: 'Unassigned', value: stats.unassigned, sub: 'awaiting courier', color: stats.unassigned > 0 ? 'var(--color-warning-600)' : 'var(--color-neutral-400)' },
]

export default function DashboardPage() {
  const { deliveries, stats, currentUser } = useApp()

  if (!stats) return <div className="loading-page"><div className="spinner" />Loading…</div>

  const exceptions = deliveries.filter(d => EXCEPTION_STATUSES.has(d.status))
  const recent = [...deliveries]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 6)

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            Welcome back, {currentUser?.name ?? 'there'}.
            Here&rsquo;s what&rsquo;s happening today.
          </p>
        </div>
        <Link to="/create" className="btn btn-primary">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
          New Delivery
        </Link>
      </div>

      {/* Stat cards */}
      <div className="stat-grid">
        {statCards(stats).map(s => (
          <div className="stat-card" key={s.label}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            <div className="stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-5)', alignItems: 'start' }}>
        {/* Exceptions panel */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              Exceptions
              {exceptions.length > 0 && (
                <span className="badge badge-danger" style={{ marginLeft: 8 }}>{exceptions.length}</span>
              )}
            </h2>
            <Link to="/exceptions" className="btn btn-ghost btn-sm">View all</Link>
          </div>
          {exceptions.length === 0 ? (
            <div className="empty-state" style={{ padding: 'var(--space-6) 0' }}>
              <p className="empty-state-title">No exceptions</p>
              <p className="empty-state-text">All deliveries are on track.</p>
            </div>
          ) : (
            <ul style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {exceptions.slice(0, 4).map(d => (
                <li key={d.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-3)' }}>
                  <div style={{ minWidth: 0 }}>
                    <Link to={`/deliveries/${d.id}`} className="table-link" style={{ fontSize: 'var(--text-sm)' }}>
                      {d.reference}
                    </Link>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {d.recipient.name}
                    </p>
                  </div>
                  <StatusBadge status={d.status} />
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent activity */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Recent Deliveries</h2>
            <Link to="/deliveries" className="btn btn-ghost btn-sm">View all</Link>
          </div>
          {recent.length === 0 ? (
            <div className="empty-state" style={{ padding: 'var(--space-6) 0' }}>
              <p className="empty-state-title">No deliveries yet</p>
              <Link to="/create" className="btn btn-primary btn-sm">Create first delivery</Link>
            </div>
          ) : (
            <ul style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {recent.map(d => (
                <li key={d.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-3)' }}>
                  <div style={{ minWidth: 0 }}>
                    <Link to={`/deliveries/${d.id}`} className="table-link" style={{ fontSize: 'var(--text-sm)' }}>
                      {d.reference}
                    </Link>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)', marginTop: 2 }}>
                      {fmtDate(d.createdAt)} · {d.recipient.name}
                    </p>
                  </div>
                  <StatusBadge status={d.status} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="card" style={{ marginTop: 'var(--space-5)' }}>
        <h2 className="card-title" style={{ marginBottom: 'var(--space-4)' }}>Quick Actions</h2>
        <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          <Link to="/create" className="btn btn-primary">Create Delivery</Link>
          <Link to="/deliveries" className="btn btn-secondary">Browse Deliveries</Link>
          <Link to="/exceptions" className="btn btn-secondary">
            Review Exceptions
            {stats.exceptions > 0 && (
              <span className="badge badge-danger" style={{ marginLeft: 4 }}>{stats.exceptions}</span>
            )}
          </Link>
          <Link to="/settings" className="btn btn-secondary">Settings</Link>
        </div>
      </div>

    </div>
  )
}

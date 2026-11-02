import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useApp } from '../context/useApp.js'
import { ROLE_LABELS } from '../models/delivery.js'

/* ── Icons (inline SVG) ──────────────────────────────────────────────────────── */
const Icon = ({ d, ...props }) => (
  <svg className="sidebar-link-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true" {...props}>
    <path d={d} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const icons = {
  dashboard:   'M3 7l7-4 7 4v9a1 1 0 01-1 1H4a1 1 0 01-1-1V7zm4 10V10h6v7',
  deliveries:  'M2 6h16M2 10h16M2 14h16',
  create:      'M10 4v12M4 10h12',
  exceptions:  'M10 3l7 14H3L10 3zm0 5v4m0 2h.01',
  courier:     'M4 9l6-6 6 6v7a1 1 0 01-1 1H5a1 1 0 01-1-1V9z',
  pod:         'M5 13l4 4L15 7',
  tracking:    'M10 18a8 8 0 100-16 8 8 0 000 16zm0-4a4 4 0 110-8 4 4 0 010 8z',
  settings:    'M10 13a3 3 0 100-6 3 3 0 000 6zm7-3c0 3.866-3.134 7-7 7s-7-3.134-7-7 3.134-7 7-7 7 3.134 7 7z',
  signout:     'M15 3h2a1 1 0 011 1v12a1 1 0 01-1 1h-2M10 7l-5 3 5 3M5 10h10',
}

/* ── Role-based nav config ───────────────────────────────────────────────────── */
const ALL_NAV = [
  { to: '/dashboard',    label: 'Dashboard',       icon: icons.dashboard,   roles: ['admin', 'dispatcher'] },
  { to: '/deliveries',   label: 'Deliveries',       icon: icons.deliveries,  roles: ['admin', 'dispatcher'] },
  { to: '/create',       label: 'Create Delivery',  icon: icons.create,      roles: ['admin', 'dispatcher'] },
  { to: '/exceptions',   label: 'Exceptions',       icon: icons.exceptions,  roles: ['admin', 'dispatcher'], badge: true },
  { to: '/courier',      label: 'My Jobs',          icon: icons.courier,     roles: ['courier'] },
  { to: '/pod',          label: 'Proof of Delivery',icon: icons.pod,         roles: ['courier'] },
  { to: '/tracking',     label: 'Track Delivery',   icon: icons.tracking,    roles: ['recipient'] },
  { to: '/settings',     label: 'Settings',         icon: icons.settings,    roles: ['admin', 'dispatcher', 'courier'] },
]

export default function Layout({ children }) {
  const { currentUser, stats, signOut } = useApp()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleSignOut = () => {
    signOut()
    navigate('/signin')
  }

  const role = currentUser?.role ?? 'dispatcher'
  const navItems = ALL_NAV.filter(n => n.roles.includes(role))
  const exceptionCount = stats?.exceptions ?? 0

  const closeSidebar = () => setSidebarOpen(false)

  return (
    <div className="app-shell">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={closeSidebar} aria-hidden="true" />
      )}

      {/* Sidebar */}
      <aside className={`app-sidebar${sidebarOpen ? ' open' : ''}`} aria-label="Main navigation">
        {/* Logo */}
        <NavLink to="/dashboard" className="sidebar-logo" onClick={closeSidebar}>
          <div className="sidebar-logo-mark">OF</div>
          <span className="sidebar-logo-text">Order Flow</span>
        </NavLink>

        {/* Nav */}
        <nav className="sidebar-nav">
          <p className="sidebar-section-label">Navigation</p>
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
              onClick={closeSidebar}
            >
              <Icon d={item.icon} />
              {item.label}
              {item.badge && exceptionCount > 0 && (
                <span className="sidebar-badge" aria-label={`${exceptionCount} exceptions`}>
                  {exceptionCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar" aria-hidden="true">
              {currentUser?.avatar ?? '?'}
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{currentUser?.name ?? ''}</div>
              <div className="sidebar-user-role">{ROLE_LABELS[role] ?? role}</div>
            </div>
          </div>
          <button
            className="sidebar-link"
            style={{ marginTop: 'var(--space-3)' }}
            onClick={handleSignOut}
            aria-label="Sign out"
          >
            <Icon d={icons.signout} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="app-main">
        {/* Top bar */}
        <header className="app-topbar">
          {/* Hamburger (mobile) */}
          <button
            className="btn btn-ghost btn-icon topbar-hamburger"
            onClick={() => setSidebarOpen(o => !o)}
            aria-label="Toggle navigation menu"
            aria-expanded={sidebarOpen}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>

          <span
            style={{
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--font-medium)',
              color: 'var(--color-neutral-700)',
            }}
          >
            {/* Breadcrumb area — can be extended */}
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            {currentUser && (
              <div className="sidebar-user-avatar" style={{ width: 30, height: 30 }}>
                {currentUser.avatar}
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="app-content" id="main-content">
          {children}
        </main>
      </div>
    </div>
  )
}

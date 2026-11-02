import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider } from './context/AppContext.jsx'
import { useApp } from './context/useApp.js'
import Layout from './components/Layout.jsx'

// Pages
import SignInPage            from './pages/SignInPage.jsx'
import SignUpPage            from './pages/SignUpPage.jsx'
import ForgotPasswordPage    from './pages/ForgotPasswordPage.jsx'
import DashboardPage         from './pages/DashboardPage.jsx'
import DeliveriesPage        from './pages/DeliveriesPage.jsx'
import CreateDeliveryPage    from './pages/CreateDeliveryPage.jsx'
import DeliveryDetailPage    from './pages/DeliveryDetailPage.jsx'
import ExceptionsPage        from './pages/ExceptionsPage.jsx'
import CourierJobsPage       from './pages/CourierJobsPage.jsx'
import ProofOfDeliveryPage   from './pages/ProofOfDeliveryPage.jsx'
import RecipientTrackingPage from './pages/RecipientTrackingPage.jsx'
import SettingsPage          from './pages/SettingsPage.jsx'

/** Full-screen loading spinner shown while Firebase resolves the session */
function AuthLoading() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: '1rem',
      background: 'var(--color-neutral-50)',
    }}>
      <div style={{
        width: 40, height: 40,
        background: 'var(--color-brand-600)',
        borderRadius: 8,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 700, color: 'white', fontSize: 14,
      }}>OF</div>
      <div className="spinner" style={{ width: 24, height: 24 }} />
      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-400)' }}>Loading…</p>
    </div>
  )
}

/** Redirects unauthenticated users to sign-in. Waits for auth to resolve. */
function RequireAuth({ children }) {
  const { currentUser, authLoading } = useApp()
  if (authLoading) return <AuthLoading />
  if (!currentUser) return <Navigate to="/signin" replace />
  return children
}

/** Redirects to role-appropriate home if role doesn't match. */
function RequireRole({ roles, children }) {
  const { currentUser, authLoading } = useApp()
  if (authLoading) return <AuthLoading />
  if (!currentUser) return <Navigate to="/signin" replace />
  if (roles && !roles.includes(currentUser.role)) {
    const defaults = { admin: '/dashboard', dispatcher: '/dashboard', courier: '/courier', recipient: '/tracking' }
    return <Navigate to={defaults[currentUser.role] ?? '/dashboard'} replace />
  }
  return children
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public — no auth required */}
      <Route path="/signin"           element={<SignInPage />} />
      <Route path="/signup"           element={<SignUpPage />} />
      <Route path="/forgot-password"  element={<ForgotPasswordPage />} />

      {/* Recipient tracking */}
      <Route path="/tracking" element={
        <RequireAuth><Layout><RecipientTrackingPage /></Layout></RequireAuth>
      } />

      {/* Courier */}
      <Route path="/courier" element={
        <RequireRole roles={['courier', 'admin', 'dispatcher']}>
          <Layout><CourierJobsPage /></Layout>
        </RequireRole>
      } />
      <Route path="/pod" element={
        <RequireRole roles={['courier', 'admin', 'dispatcher']}>
          <Layout><ProofOfDeliveryPage /></Layout>
        </RequireRole>
      } />

      {/* Dispatcher / Admin */}
      <Route path="/dashboard" element={
        <RequireRole roles={['admin', 'dispatcher']}>
          <Layout><DashboardPage /></Layout>
        </RequireRole>
      } />
      <Route path="/deliveries" element={
        <RequireRole roles={['admin', 'dispatcher']}>
          <Layout><DeliveriesPage /></Layout>
        </RequireRole>
      } />
      <Route path="/deliveries/:id" element={
        <RequireRole roles={['admin', 'dispatcher', 'courier']}>
          <Layout><DeliveryDetailPage /></Layout>
        </RequireRole>
      } />
      <Route path="/create" element={
        <RequireRole roles={['admin', 'dispatcher']}>
          <Layout><CreateDeliveryPage /></Layout>
        </RequireRole>
      } />
      <Route path="/exceptions" element={
        <RequireRole roles={['admin', 'dispatcher']}>
          <Layout><ExceptionsPage /></Layout>
        </RequireRole>
      } />

      {/* Shared */}
      <Route path="/settings" element={
        <RequireAuth><Layout><SettingsPage /></Layout></RequireAuth>
      } />

      {/* Fallback */}
      <Route path="/" element={<Navigate to="/signin" replace />} />
      <Route path="*" element={<Navigate to="/signin" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppProvider>
  )
}

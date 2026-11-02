import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../context/useApp.js'
import { ROLE_LABELS } from '../models/delivery.js'
import { isFirebaseConfigured } from '../lib/firebaseClient.js'
import { signInWithEmail } from '../services/authService.js'
import {
  ClipboardCheck,
  Truck,
  GearFill,
  BoxSeam,
  ExclamationTriangle,
} from 'react-bootstrap-icons'

// ─── Demo role configs ────────────────────────────────────────────────────────

const ROLE_CONFIGS = [
  {
    key: 'dispatcher',
    label: ROLE_LABELS.dispatcher,
    description: 'Create deliveries, assign couriers, monitor status, handle exceptions.',
    Icon: ClipboardCheck,
    accent: 'var(--color-brand-600)',
  },
  {
    key: 'courier',
    label: ROLE_LABELS.courier,
    description: 'View assigned jobs, update delivery status, and submit proof of delivery.',
    Icon: Truck,
    accent: 'var(--color-success-600)',
  },
  {
    key: 'admin',
    label: ROLE_LABELS.admin,
    description: 'Manage organisation settings, users, delivery policies, and reporting.',
    Icon: GearFill,
    accent: 'var(--color-neutral-700)',
  },
  {
    key: 'recipient',
    label: ROLE_LABELS.recipient,
    description: 'Track your delivery and view handoff instructions.',
    Icon: BoxSeam,
    accent: 'var(--color-warning-600)',
  },
]

const ROLE_REDIRECT = {
  dispatcher: '/dashboard',
  admin: '/dashboard',
  courier: '/courier',
  recipient: '/tracking',
}

// ─── Real sign-in form ────────────────────────────────────────────────────────

function RealSignInForm() {
  const navigate = useNavigate()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState(null)
  const [loading, setLoading]   = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error: authError } = await signInWithEmail(email, password)
    setLoading(false)
    if (authError) {
      setError(authError.message)
      return
    }
    // AppContext's onAuthStateChange will update currentUser and role,
    // then redirect based on role. Navigate to dashboard as default.
    navigate('/dashboard')
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 400, width: '100%' }} noValidate>
      <div className="card card-lg">
        <div className="form-group">
          <label className="form-label form-label-required" htmlFor="email">Email address</label>
          <input
            id="email"
            type="email"
            className="form-control"
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label form-label-required" htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            className="form-control"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>

        {error && (
          <div className="alert alert-danger" role="alert" style={{ marginBottom: 'var(--space-4)' }}>
            <ExclamationTriangle size={14} aria-hidden="true" style={{ flexShrink: 0 }} />
            {error}
          </div>
        )}

        <button
          type="submit"
          className="btn btn-primary btn-lg"
          style={{ width: '100%', marginBottom: 'var(--space-4)' }}
          disabled={loading || !email || !password}
        >
          {loading ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Signing in…</> : 'Sign In'}
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)' }}>
          <Link to="/forgot-password" style={{ color: 'var(--color-brand-600)' }}>
            Forgot password?
          </Link>
          <Link to="/signup" style={{ color: 'var(--color-brand-600)', fontWeight: 'var(--font-medium)' }}>
            Create account
          </Link>
        </div>
      </div>
    </form>
  )
}

// ─── Demo role card ───────────────────────────────────────────────────────────

function RoleCard({ role, onSelect }) {
  const { Icon } = role
  return (
    <button
      onClick={() => onSelect(role.key)}
      style={{
        background: 'var(--color-neutral-0)',
        border: '2px solid var(--color-neutral-200)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-5)',
        textAlign: 'left',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-3)',
        transition: 'border-color 150ms, box-shadow 150ms',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = role.accent
        e.currentTarget.style.boxShadow = 'var(--shadow-md)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--color-neutral-200)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      <Icon size={28} color={role.accent} aria-hidden="true" />
      <div>
        <div style={{ fontWeight: 'var(--font-semibold)', fontSize: 'var(--text-base)', color: 'var(--color-neutral-900)', marginBottom: 'var(--space-1)' }}>
          {role.label}
        </div>
        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', lineHeight: 'var(--leading-normal)' }}>
          {role.description}
        </div>
      </div>
      <span style={{ fontSize: 'var(--text-sm)', color: role.accent, fontWeight: 'var(--font-medium)' }}>
        Enter as {role.label} →
      </span>
    </button>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SignInPage() {
  const { signIn } = useApp()
  const navigate = useNavigate()

  const handleDemoSelect = (roleKey) => {
    signIn(roleKey)
    navigate(ROLE_REDIRECT[roleKey] ?? '/dashboard')
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--color-neutral-50)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--space-6)',
    }}>
      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
        <div style={{
          width: 52, height: 52,
          background: 'var(--color-brand-600)',
          borderRadius: 'var(--radius-lg)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 'var(--text-xl)', fontWeight: 'var(--font-bold)', color: 'white',
          margin: '0 auto var(--space-4)',
        }}>OF</div>
        <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--font-bold)' }}>Order Flow</h1>
        <p style={{ color: 'var(--color-neutral-500)', marginTop: 'var(--space-2)' }}>
          Delivery management &amp; proof of delivery
        </p>
      </div>

      {isFirebaseConfigured ? (
        /* ── Real sign-in ── */
        <RealSignInForm />
      ) : (
        /* ── Demo mode ── */
        <>
          <div className="alert alert-warning" style={{ maxWidth: 540, width: '100%', marginBottom: 'var(--space-6)' }}>
            <ExclamationTriangle size={18} aria-hidden="true" style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <strong>Demo mode only.</strong> Firebase is not configured. This is a demonstration
              using entirely fictional data. There is no real authentication, backend, or personal data.
              Do not enter real credentials or sensitive information.
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 'var(--space-4)',
            maxWidth: 720,
            width: '100%',
          }}>
            {ROLE_CONFIGS.map(role => (
              <RoleCard key={role.key} role={role} onSelect={handleDemoSelect} />
            ))}
          </div>
        </>
      )}

      <p style={{ marginTop: 'var(--space-8)', fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)', textAlign: 'center' }}>
        Order Flow · {isFirebaseConfigured ? 'Connected to Firebase' : 'Demo v0.1 · All personal data is fictional'}
      </p>
    </div>
  )
}

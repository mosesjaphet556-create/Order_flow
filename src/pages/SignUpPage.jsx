import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { isFirebaseConfigured } from '../lib/firebaseClient.js'
import { signUp } from '../services/authService.js'
import { ExclamationTriangle, CheckCircleFill } from 'react-bootstrap-icons'

export default function SignUpPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ displayName: '', email: '', password: '', confirmPassword: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState(null)
  const [success, setSuccess] = useState(false)

  const set = (field, value) => {
    setForm(f => ({ ...f, [field]: value }))
    setErrors(e => { const n = { ...e }; delete n[field]; return n })
  }

  const validate = () => {
    const e = {}
    if (!form.displayName.trim())           e.displayName     = 'Name is required.'
    if (!form.email.includes('@'))           e.email           = 'Enter a valid email address.'
    if (form.password.length < 8)           e.password        = 'Password must be at least 8 characters.'
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match.'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setServerError(null)
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    const { error } = await signUp(form.email, form.password, form.displayName.trim())
    setLoading(false)

    if (error) {
      // Map Firebase error codes to friendly messages
      const msg = {
        'auth/email-already-in-use': 'An account with this email already exists.',
        'auth/invalid-email':        'That email address is not valid.',
        'auth/weak-password':        'Password is too weak. Use at least 8 characters.',
      }[error.code] ?? error.message
      setServerError(msg)
      return
    }

    setSuccess(true)
    setTimeout(() => navigate('/dashboard'), 2000)
  }

  // If Firebase isn't configured, sign-up has no backend — show a notice
  if (!isFirebaseConfigured) {
    return (
      <AuthShell title="Create Account">
        <div className="alert alert-warning">
          <ExclamationTriangle size={18} aria-hidden="true" style={{ flexShrink: 0 }} />
          <div>
            <strong>Demo mode.</strong> Account creation requires Firebase to be configured.
            Use the <Link to="/signin">demo role selector</Link> to explore the app without an account.
          </div>
        </div>
      </AuthShell>
    )
  }

  if (success) {
    return (
      <AuthShell title="Account Created">
        <div style={{ textAlign: 'center', padding: 'var(--space-6) 0' }}>
          <CheckCircleFill size={48} color="var(--color-success-600)" style={{ margin: '0 auto var(--space-4)' }} aria-hidden="true" />
          <p style={{ fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-2)' }}>Account created successfully!</p>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)' }}>
            Redirecting to your dashboard…
          </p>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)', marginTop: 'var(--space-4)' }}>
            Note: an admin must assign you to an organisation before you can access deliveries.
          </p>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell title="Create Account">
      <form onSubmit={handleSubmit} noValidate>
        <Field
          id="displayName" label="Full Name" type="text"
          value={form.displayName} onChange={v => set('displayName', v)}
          error={errors.displayName} placeholder="Jane Smith"
          autoComplete="name" required
        />
        <Field
          id="email" label="Email Address" type="email"
          value={form.email} onChange={v => set('email', v)}
          error={errors.email} placeholder="jane@company.com"
          autoComplete="email" required
        />
        <Field
          id="password" label="Password" type="password"
          value={form.password} onChange={v => set('password', v)}
          error={errors.password} placeholder="At least 8 characters"
          autoComplete="new-password" required
          hint="Minimum 8 characters."
        />
        <Field
          id="confirmPassword" label="Confirm Password" type="password"
          value={form.confirmPassword} onChange={v => set('confirmPassword', v)}
          error={errors.confirmPassword} placeholder="Repeat your password"
          autoComplete="new-password" required
        />

        {serverError && (
          <div className="alert alert-danger" role="alert" style={{ marginBottom: 'var(--space-4)' }}>
            <ExclamationTriangle size={14} aria-hidden="true" style={{ flexShrink: 0 }} />
            {serverError}
          </div>
        )}

        <button
          type="submit"
          className="btn btn-primary btn-lg"
          style={{ width: '100%', marginBottom: 'var(--space-4)' }}
          disabled={loading}
        >
          {loading
            ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Creating account…</>
            : 'Create Account'
          }
        </button>

        <p style={{ textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)' }}>
          Already have an account?{' '}
          <Link to="/signin" style={{ color: 'var(--color-brand-600)', fontWeight: 'var(--font-medium)' }}>
            Sign in
          </Link>
        </p>
      </form>
    </AuthShell>
  )
}

// ─── Shared auth page shell ───────────────────────────────────────────────────

function AuthShell({ title, children }) {
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
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
        <Link to="/signin" style={{ textDecoration: 'none' }}>
          <div style={{
            width: 48, height: 48,
            background: 'var(--color-brand-600)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 'var(--text-lg)', fontWeight: 'var(--font-bold)', color: 'white',
            margin: '0 auto var(--space-3)',
          }}>OF</div>
        </Link>
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)' }}>{title}</h1>
      </div>
      <div className="card card-lg" style={{ width: '100%', maxWidth: 420 }}>
        {children}
      </div>
    </div>
  )
}

// ─── Reusable field ───────────────────────────────────────────────────────────

function Field({ id, label, type, value, onChange, error, placeholder, autoComplete, required, hint }) {
  return (
    <div className="form-group">
      <label className={`form-label${required ? ' form-label-required' : ''}`} htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        type={type}
        className={`form-control${error ? ' error' : ''}`}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined}
        required={required}
      />
      {hint && !error && <p className="form-hint" id={`${id}-hint`}>{hint}</p>}
      {error && <p className="form-error" id={`${id}-err`} role="alert">{error}</p>}
    </div>
  )
}

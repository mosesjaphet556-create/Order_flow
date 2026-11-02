import { useState } from 'react'
import { Link } from 'react-router-dom'
import { isFirebaseConfigured } from '../lib/firebaseClient.js'
import { sendPasswordReset } from '../services/authService.js'
import { ExclamationTriangle, CheckCircleFill } from 'react-bootstrap-icons'

export default function ForgotPasswordPage() {
  const [email, setEmail]         = useState('')
  const [loading, setLoading]     = useState(false)
  const [sent, setSent]           = useState(false)
  const [error, setError]         = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    if (!email.includes('@')) { setError('Enter a valid email address.'); return }

    setLoading(true)
    const { error: err } = await sendPasswordReset(email)
    setLoading(false)

    if (err) {
      // Don't reveal whether the email exists — show generic message for
      // user-not-found to prevent account enumeration.
      const code = err.code
      if (code === 'auth/user-not-found' || code === 'auth/invalid-email') {
        // Still show "sent" to avoid leaking account existence
        setSent(true)
        return
      }
      setError(err.message)
      return
    }
    setSent(true)
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
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)' }}>Reset Password</h1>
        <p style={{ color: 'var(--color-neutral-500)', marginTop: 'var(--space-1)', fontSize: 'var(--text-sm)' }}>
          Enter your email and we&rsquo;ll send a reset link.
        </p>
      </div>

      <div className="card card-lg" style={{ width: '100%', maxWidth: 420 }}>
        {!isFirebaseConfigured ? (
          <div className="alert alert-warning">
            <ExclamationTriangle size={18} aria-hidden="true" style={{ flexShrink: 0 }} />
            <div>
              <strong>Demo mode.</strong> Password reset requires Firebase to be configured.{' '}
              <Link to="/signin">Back to sign in</Link>.
            </div>
          </div>
        ) : sent ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-4) 0' }}>
            <CheckCircleFill size={40} color="var(--color-success-600)" style={{ margin: '0 auto var(--space-4)' }} aria-hidden="true" />
            <p style={{ fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-2)' }}>
              Check your inbox
            </p>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', marginBottom: 'var(--space-5)' }}>
              If an account exists for <strong>{email}</strong>, a password reset link has been sent.
              Check your spam folder if you don&rsquo;t see it.
            </p>
            <Link to="/signin" className="btn btn-primary" style={{ width: '100%' }}>
              Back to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="form-label form-label-required" htmlFor="reset-email">
                Email Address
              </label>
              <input
                id="reset-email"
                type="email"
                className={`form-control${error ? ' error' : ''}`}
                value={email}
                onChange={e => { setEmail(e.target.value); setError(null) }}
                placeholder="jane@company.com"
                autoComplete="email"
                required
                aria-describedby={error ? 'reset-email-err' : undefined}
              />
              {error && (
                <p className="form-error" id="reset-email-err" role="alert">
                  <ExclamationTriangle size={12} aria-hidden="true" /> {error}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: '100%', marginBottom: 'var(--space-4)' }}
              disabled={loading || !email}
            >
              {loading
                ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Sending…</>
                : 'Send Reset Link'
              }
            </button>

            <p style={{ textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)' }}>
              <Link to="/signin" style={{ color: 'var(--color-brand-600)', fontWeight: 'var(--font-medium)' }}>
                Back to Sign In
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}

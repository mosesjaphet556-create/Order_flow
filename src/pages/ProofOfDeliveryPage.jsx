import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useApp } from '../context/useApp.js'
import StatusBadge from '../components/StatusBadge.jsx'
import { getDeliveryById, submitProofEvidence } from '../services/deliveryService.js'
import { ProofType, PROOF_TYPE_LABELS, DeliveryStatus } from '../models/delivery.js'
import {
  ExclamationTriangle,
  CheckLg,
  CheckCircleFill,
  Camera,
} from 'react-bootstrap-icons'

const fmtDate = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function DemoSimNotice({ children }) {
  return (
    <div style={{
      background: 'var(--color-demo-bg)',
      border: '1px dashed var(--color-demo-border)',
      borderRadius: 'var(--radius-md)',
      padding: 'var(--space-3)',
      fontSize: 'var(--text-xs)',
      color: 'var(--color-demo-text)',
      marginBottom: 'var(--space-3)',
      display: 'flex',
      alignItems: 'flex-start',
      gap: 6,
    }}>
      <ExclamationTriangle size={12} style={{ flexShrink: 0, marginTop: 1 }} aria-hidden="true" />
      <span><strong>Demo simulation:</strong> {children}</span>
    </div>
  )
}

function TimestampCapture({ onCapture, captured }) {
  return (
    <div>
      <DemoSimNotice>This timestamp is generated from the browser clock. No real device integration.</DemoSimNotice>
      {captured
        ? <p style={{ color: 'var(--color-success-700)', fontWeight: 'var(--font-medium)', fontSize: 'var(--text-sm)', display: 'flex', alignItems: 'center', gap: 6 }}><CheckLg size={14} aria-hidden="true" /> Captured: {captured.value}</p>
        : <button className="btn btn-secondary" onClick={() => onCapture({ value: new Date().toLocaleString('en-GB') })}>Capture Timestamp</button>
      }
    </div>
  )
}

function PhotoCapture({ onCapture, captured }) {
  return (
    <div>
      <DemoSimNotice>No camera is accessed. This simulates a photo upload with a placeholder image.</DemoSimNotice>
      {captured ? (
        <div>
          <div className="demo-photo-placeholder" style={{ marginBottom: 'var(--space-2)' }}>
            <Camera size={32} style={{ margin: '0 auto 8px' }} aria-hidden="true" />
            <p>Demo photo captured</p>
            <p style={{ fontSize: 11, marginTop: 4, color: 'var(--color-neutral-400)' }}>No actual camera used — simulated capture only</p>
          </div>
          <p style={{ color: 'var(--color-success-700)', fontWeight: 'var(--font-medium)', fontSize: 'var(--text-sm)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <CheckLg size={14} aria-hidden="true" /> Photo evidence recorded (demo)
          </p>
        </div>
      ) : (
        <button className="btn btn-secondary" onClick={() => onCapture({ value: 'Photo evidence recorded (simulated — no camera used)' })}>
          Simulate Photo Capture
        </button>
      )}
    </div>
  )
}

function SignatureCapture({ onCapture, captured }) {
  const [name, setName] = useState('')
  return (
    <div>
      <DemoSimNotice>No real signature pad is connected. Enter a name to simulate a signature.</DemoSimNotice>
      {captured ? (
        <p style={{ color: 'var(--color-success-700)', fontWeight: 'var(--font-medium)', fontSize: 'var(--text-sm)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <CheckLg size={14} aria-hidden="true" /> Signed by: {captured.value}
        </p>
      ) : (
        <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
            <label className="form-label" htmlFor="sig-name">Recipient Name</label>
            <input
              id="sig-name"
              type="text"
              className="form-control"
              placeholder="e.g. Morgan Wells"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>
          <button
            className="btn btn-secondary"
            disabled={!name.trim()}
            onClick={() => onCapture({ value: `${name.trim()} (simulated signature)` })}
          >
            Confirm Signature
          </button>
        </div>
      )}
    </div>
  )
}

function RecipientConfirmation({ onCapture, captured }) {
  const [name, setName] = useState('')
  return (
    <div>
      <DemoSimNotice>Simulated recipient confirmation. In production, this could be a QR scan or OTP.</DemoSimNotice>
      {captured ? (
        <p style={{ color: 'var(--color-success-700)', fontWeight: 'var(--font-medium)', fontSize: 'var(--text-sm)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <CheckLg size={14} aria-hidden="true" /> Confirmed by: {captured.value}
        </p>
      ) : (
        <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
            <label className="form-label" htmlFor="recip-name">Recipient Name</label>
            <input
              id="recip-name"
              type="text"
              className="form-control"
              placeholder="e.g. Morgan Wells"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>
          <button
            className="btn btn-secondary"
            disabled={!name.trim()}
            onClick={() => onCapture({ value: `Confirmed by ${name.trim()}` })}
          >
            Confirm Receipt
          </button>
        </div>
      )}
    </div>
  )
}

function OtpCapture({ onCapture, captured }) {
  const [otp, setOtp] = useState('')
  const DEMO_OTP = '482917'
  return (
    <div>
      <DemoSimNotice>
        No real OTP system. Demo code is: <strong>{DEMO_OTP}</strong>
      </DemoSimNotice>
      {captured ? (
        <p style={{ color: 'var(--color-success-700)', fontWeight: 'var(--font-medium)', fontSize: 'var(--text-sm)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <CheckLg size={14} aria-hidden="true" /> One-time code verified (demo)
        </p>
      ) : (
        <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
            <label className="form-label" htmlFor="otp-input">Enter Code</label>
            <input
              id="otp-input"
              type="text"
              className="form-control"
              placeholder={`Demo code: ${DEMO_OTP}`}
              value={otp}
              onChange={e => setOtp(e.target.value)}
              maxLength={6}
            />
          </div>
          <button
            className="btn btn-secondary"
            disabled={otp !== DEMO_OTP}
            onClick={() => onCapture({ value: `OTP verified: ${otp}` })}
          >
            Verify Code
          </button>
        </div>
      )}
    </div>
  )
}

const CAPTURE_COMPONENTS = {
  [ProofType.TIMESTAMP]: TimestampCapture,
  [ProofType.PHOTO]: PhotoCapture,
  [ProofType.SIGNATURE]: SignatureCapture,
  [ProofType.RECIPIENT_CONFIRMATION]: RecipientConfirmation,
  [ProofType.OTP]: OtpCapture,
}

export default function ProofOfDeliveryPage() {
  const [searchParams] = useSearchParams()
  const deliveryId = searchParams.get('delivery')
  const { currentUser, deliveries, refresh, orgId } = useApp()

  const [delivery, setDelivery] = useState(null)
  const [captured, setCaptured] = useState({}) // type -> evidence item
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!deliveryId) return
    getDeliveryById(deliveryId).then(d => {
      if (d) {
        setDelivery(d)
        const existing = {}
        d.proofEvidence.forEach(e => { existing[e.type] = e })
        setCaptured(existing)
        if (d.status === DeliveryStatus.DELIVERED) setSubmitted(true)
      }
    })
  }, [deliveryId, deliveries])

  if (!deliveryId || !delivery) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">Proof of Delivery</h1>
        </div>
        {!deliveryId ? (
          <div className="card">
            <div className="empty-state">
              <p className="empty-state-title">No delivery selected</p>
              <p className="empty-state-text">Open this page from a specific delivery or your active jobs.</p>
              <Link to="/courier" className="btn btn-primary">View My Jobs</Link>
            </div>
          </div>
        ) : (
          <div className="card">
            <div className="empty-state">
              <p className="empty-state-title">Delivery not found</p>
              <Link to="/deliveries" className="btn btn-secondary">Back to Deliveries</Link>
            </div>
          </div>
        )}
      </div>
    )
  }

  const requirements = delivery.proofRequirements
  const allCaptured = requirements.every(type => !!captured[type])
  const actor = currentUser?.name ?? 'Courier'

  const handleCapture = (type, data) => {
    setCaptured(prev => ({
      ...prev,
      [type]: {
        type,
        capturedAt: new Date().toISOString(),
        value: data.value,
        isDemo: true,
      },
    }))
  }

  const handleSubmit = async () => {
    if (!allCaptured) { setError('Please capture all required evidence before submitting.'); return }
    setError(null)
    try {
      const evidenceItems = Object.values(captured)
      await submitProofEvidence(delivery.id, evidenceItems, actor, orgId)
      setSubmitted(true)
      refresh()
    } catch (e) {
      setError(`Failed to submit: ${e.message}`)
    }
  }

  if (submitted) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">Proof of Delivery</h1>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-10)' }}>
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <CheckCircleFill size={48} color="var(--color-success-600)" aria-hidden="true" />
          </div>
          <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-2)' }}>
            Delivery confirmed
          </h2>
          <p style={{ color: 'var(--color-neutral-500)', marginBottom: 'var(--space-6)' }}>
            All required proof of delivery evidence has been recorded (demo).
          </p>
          <StatusBadge status={DeliveryStatus.DELIVERED} />
          <div style={{ marginTop: 'var(--space-6)', display: 'flex', gap: 'var(--space-3)', justifyContent: 'center' }}>
            <Link to={`/deliveries/${delivery.id}`} className="btn btn-primary">View Delivery Details</Link>
            <Link to="/courier" className="btn btn-secondary">Back to My Jobs</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 640 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Proof of Delivery</h1>
          <p className="page-subtitle">
            {delivery.reference} · {delivery.recipient.name}
          </p>
        </div>
        <StatusBadge status={delivery.status} />
      </div>

      <div className="alert alert-warning" style={{ marginBottom: 'var(--space-5)' }}>
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
          <path d="M10 3l7 14H3L10 3zm0 5v4m0 2h.01" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span>
          <strong>Note:</strong> No camera, GPS, or signature pad is connected in this version.
          Photo and signature features use simulated capture flows.
          Do not use this to record legally binding proof without a verified capture integration.
        </span>
      </div>

      {/* Delivery summary */}
      <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
        <h2 className="card-title" style={{ marginBottom: 'var(--space-3)' }}>Delivery Summary</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', fontSize: 'var(--text-sm)' }}>
          <div>
            <p style={{ color: 'var(--color-neutral-500)', marginBottom: 2 }}>Recipient</p>
            <p style={{ fontWeight: 'var(--font-medium)' }}>{delivery.recipient.name}</p>
          </div>
          <div>
            <p style={{ color: 'var(--color-neutral-500)', marginBottom: 2 }}>Address</p>
            <p>{delivery.dropoff.line1}, {delivery.dropoff.city}</p>
          </div>
          <div>
            <p style={{ color: 'var(--color-neutral-500)', marginBottom: 2 }}>Package</p>
            <p>{delivery.packageNotes || '—'}</p>
          </div>
          <div>
            <p style={{ color: 'var(--color-neutral-500)', marginBottom: 2 }}>Scheduled</p>
            <p>{fmtDate(delivery.scheduledFor)}</p>
          </div>
        </div>
      </div>

      {/* Evidence items */}
      {requirements.map(type => {
        const CaptureComponent = CAPTURE_COMPONENTS[type]
        const capturedItem = captured[type]
        return (
          <div className="card" key={type} style={{ marginBottom: 'var(--space-4)', borderLeft: capturedItem ? '4px solid var(--color-success-600)' : '4px solid var(--color-neutral-200)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)' }}>
                {PROOF_TYPE_LABELS[type]}
              </span>
              {capturedItem
                ? <span className="badge badge-success">Captured</span>
                : <span className="badge badge-neutral">Required</span>
              }
            </div>
            {CaptureComponent
              ? <CaptureComponent onCapture={(data) => handleCapture(type, data)} captured={capturedItem} />
              : <p style={{ color: 'var(--color-neutral-400)', fontSize: 'var(--text-sm)' }}>No capture UI for this type.</p>
            }
          </div>
        )
      })}

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: 'var(--space-4)' }} role="alert">
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
        <button
          className="btn btn-primary btn-lg"
          onClick={handleSubmit}
          disabled={!allCaptured}
        >
          Submit Proof of Delivery
        </button>
        <Link to={`/deliveries/${delivery.id}`} className="btn btn-secondary btn-lg">
          Cancel
        </Link>
      </div>

      {!allCaptured && (
        <p style={{ marginTop: 'var(--space-3)', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-400)' }}>
          {requirements.filter(t => !captured[t]).length} evidence item(s) still required.
        </p>
      )}
    </div>
  )
}

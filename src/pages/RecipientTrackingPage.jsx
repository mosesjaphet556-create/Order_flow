import { useState } from 'react'
import StatusBadge from '../components/StatusBadge.jsx'
import Timeline from '../components/Timeline.jsx'
import { DeliveryStatus, EXCEPTION_STATUSES, SERVICE_LEVEL_LABELS } from '../models/delivery.js'
import { getDeliveryByTrackingToken } from '../services/deliveryService.js'
import { CheckCircleFill } from 'react-bootstrap-icons'

const fmtDate = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// Only show recipient-safe information — no courier details, no internal notes
const RECIPIENT_SAFE_STATUSES = {
  [DeliveryStatus.CREATED]:   { label: 'Order Received',     msg: 'Your delivery has been registered and is being prepared.' },
  [DeliveryStatus.ASSIGNED]:  { label: 'Courier Assigned',   msg: 'A courier has been assigned to your delivery.' },
  [DeliveryStatus.PICKED_UP]: { label: 'Collected',          msg: 'Your package has been collected and is on its way.' },
  [DeliveryStatus.EN_ROUTE]:  { label: 'Out for Delivery',   msg: 'Your package is on its way to you.' },
  [DeliveryStatus.DELIVERED]: { label: 'Delivered',          msg: 'Your package has been delivered. Thank you!' },
  [DeliveryStatus.DELAYED]:   { label: 'Slight Delay',       msg: 'Your delivery is experiencing a short delay. We\'re working on it.' },
  [DeliveryStatus.ATTEMPTED]: { label: 'Delivery Attempted', msg: 'We tried to deliver your package but couldn\'t complete it. We\'ll try again or contact you shortly.' },
  [DeliveryStatus.FAILED]:    { label: 'Unable to Deliver',  msg: 'We were unable to complete your delivery. Please contact the sender.' },
  [DeliveryStatus.CANCELLED]: { label: 'Order Cancelled',    msg: 'This delivery has been cancelled. Please contact the sender for more information.' },
  [DeliveryStatus.RETURNED]:  { label: 'Returned to Sender', msg: 'Your package has been returned to the sender. Please contact them directly.' },
}

// Filter timeline to only show recipient-appropriate events (no internal actor names)
const recipientTimeline = (events) =>
  events.map(evt => ({
    ...evt,
    // Replace internal actor with a neutral label
    actor: 'Order Flow',
    // Strip internal notes from the event visible to recipient
    note: null,
  }))

export default function RecipientTrackingPage() {
  const [tokenInput, setTokenInput] = useState('')
  const [delivery, setDelivery] = useState(null)
  const [notFound, setNotFound] = useState(false)

  const handleSearch = async (e) => {
    e.preventDefault()
    setNotFound(false)
    setDelivery(null)
    const d = await getDeliveryByTrackingToken(tokenInput.trim())
    if (d) {
      setDelivery(d)
    } else {
      setNotFound(true)
    }
  }

  const statusInfo = delivery ? (RECIPIENT_SAFE_STATUSES[delivery.status] ?? { label: delivery.status, msg: '' }) : null
  const isException = delivery && EXCEPTION_STATUSES.has(delivery.status)

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
        <div style={{
          width: 48, height: 48,
          background: 'var(--color-brand-600)',
          borderRadius: 'var(--radius-lg)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 'var(--text-lg)', fontWeight: 'var(--font-bold)', color: 'white',
          margin: '0 auto var(--space-4)',
        }}>OF</div>
        <h1 className="page-title">Track Your Delivery</h1>
        <p style={{ color: 'var(--color-neutral-500)', marginTop: 'var(--space-2)' }}>
          Enter your tracking reference to see your delivery status.
        </p>
      </div>

      {/* Search form */}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
        <div style={{ flex: 1 }}>
          <label htmlFor="track-input" className="form-label">Tracking Reference</label>
          <input
            id="track-input"
            type="text"
            className="form-control"
            placeholder="Enter your tracking reference"
            value={tokenInput}
            onChange={e => setTokenInput(e.target.value)}
            aria-required="true"
          />
        </div>
        <div style={{ alignSelf: 'flex-end' }}>
          <button type="submit" className="btn btn-primary" disabled={!tokenInput.trim()}>
            Track
          </button>
        </div>
      </form>

      {notFound && (
        <div className="alert alert-danger" style={{ marginBottom: 'var(--space-5)' }}>
          No delivery found for that reference. Please check the token and try again.
        </div>
      )}

      {/* Delivery status */}
      {delivery && statusInfo && (
        <div>
          <div className="card" style={{ marginBottom: 'var(--space-5)', textAlign: 'center', padding: 'var(--space-8)' }}>
            <div style={{ marginBottom: 'var(--space-3)' }}>
              <StatusBadge status={delivery.status} />
            </div>
            <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-bold)', marginBottom: 'var(--space-2)' }}>
              {statusInfo.label}
            </h2>
            <p style={{ color: 'var(--color-neutral-600)', maxWidth: 400, margin: '0 auto' }}>
              {statusInfo.msg}
            </p>
            {delivery.status === DeliveryStatus.DELIVERED && (
              <div style={{ marginTop: 'var(--space-4)' }}>
                <CheckCircleFill size={40} color="var(--color-success-600)" aria-hidden="true" />
              </div>
            )}
          </div>

          {/* Delivery info (recipient-safe only) */}
          <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
            <h2 className="card-title" style={{ marginBottom: 'var(--space-4)' }}>Your Delivery</h2>
            <div style={{ display: 'grid', gap: 'var(--space-3)', fontSize: 'var(--text-sm)' }}>
              <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
                <span style={{ width: 140, flexShrink: 0, color: 'var(--color-neutral-500)' }}>Reference</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>{delivery.reference}</span>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
                <span style={{ width: 140, flexShrink: 0, color: 'var(--color-neutral-500)' }}>Service</span>
                <span>{SERVICE_LEVEL_LABELS[delivery.serviceLevel]}</span>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
                <span style={{ width: 140, flexShrink: 0, color: 'var(--color-neutral-500)' }}>Scheduled For</span>
                <span>{fmtDate(delivery.scheduledFor)}</span>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
                <span style={{ width: 140, flexShrink: 0, color: 'var(--color-neutral-500)' }}>Delivering To</span>
                <span>{delivery.dropoff.line1}, {delivery.dropoff.city}</span>
              </div>
            </div>

            {isException && (
              <div className="alert alert-warning" style={{ marginTop: 'var(--space-4)' }}>
                There is an update on your delivery. If you have questions, please contact the sender.
              </div>
            )}
          </div>

          {/* Status timeline (recipient-safe) */}
          <div className="card">
            <h2 className="card-title" style={{ marginBottom: 'var(--space-5)' }}>Delivery History</h2>
            <Timeline events={recipientTimeline(delivery.timeline)} />
            <p style={{ marginTop: 'var(--space-4)', fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>
              All times are in your local timezone.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

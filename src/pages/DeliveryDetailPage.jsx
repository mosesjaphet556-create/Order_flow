import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useApp } from '../context/useApp.js'
import StatusBadge from '../components/StatusBadge.jsx'
import Timeline from '../components/Timeline.jsx'
import Modal from '../components/Modal.jsx'
import {
  getDeliveryById,
  updateDeliveryStatus,
  assignCourier,
  getCouriers,
} from '../services/deliveryService.js'
import {
  DeliveryStatus,
  STATUS_LABELS,
  SERVICE_LEVEL_LABELS,
  PROOF_TYPE_LABELS,
  EXCEPTION_STATUSES,
} from '../models/delivery.js'

const fmtDate = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// Which status transitions are valid from a given status (dispatcher)
const NEXT_STATUSES = {
  [DeliveryStatus.CREATED]: [DeliveryStatus.ASSIGNED, DeliveryStatus.CANCELLED],
  [DeliveryStatus.ASSIGNED]: [DeliveryStatus.PICKED_UP, DeliveryStatus.CANCELLED],
  [DeliveryStatus.PICKED_UP]: [DeliveryStatus.EN_ROUTE, DeliveryStatus.DELAYED],
  [DeliveryStatus.EN_ROUTE]: [DeliveryStatus.DELIVERED, DeliveryStatus.ATTEMPTED, DeliveryStatus.DELAYED, DeliveryStatus.FAILED],
  [DeliveryStatus.DELAYED]: [DeliveryStatus.EN_ROUTE, DeliveryStatus.FAILED, DeliveryStatus.RETURNED],
  [DeliveryStatus.ATTEMPTED]: [DeliveryStatus.EN_ROUTE, DeliveryStatus.RETURNED, DeliveryStatus.FAILED],
  [DeliveryStatus.DELIVERED]: [],
  [DeliveryStatus.FAILED]: [DeliveryStatus.RETURNED],
  [DeliveryStatus.CANCELLED]: [],
  [DeliveryStatus.RETURNED]: [],
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', gap: 'var(--space-4)', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--color-neutral-100)', fontSize: 'var(--text-sm)' }}>
      <span style={{ width: 160, flexShrink: 0, color: 'var(--color-neutral-500)', fontWeight: 'var(--font-medium)' }}>{label}</span>
      <span style={{ color: 'var(--color-neutral-800)' }}>{value ?? '—'}</span>
    </div>
  )
}

function AddressBlock({ address }) {
  if (!address) return null
  return (
    <address style={{ fontStyle: 'normal', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-700)', lineHeight: 'var(--leading-normal)' }}>
      {address.name && <strong>{address.name}<br /></strong>}
      {address.line1}<br />
      {address.line2 && <>{address.line2}<br /></>}
      {address.city}, {address.postcode}<br />
      <span style={{ color: 'var(--color-neutral-500)' }}>
        {address.contactName} · {address.contactPhone}
      </span>
    </address>
  )
}

export default function DeliveryDetailPage() {
  const { id } = useParams()
  const { currentUser, refresh } = useApp()
  const navigate = useNavigate()
  const [delivery, setDelivery] = useState(null)
  const [loading, setLoading] = useState(true)
  const [couriers, setCouriers] = useState([])

  // Modals
  const [statusModal, setStatusModal] = useState(false)
  const [assignModal, setAssignModal] = useState(false)
  const [nextStatus, setNextStatus] = useState('')
  const [statusNote, setStatusNote] = useState('')
  const [selectedCourier, setSelectedCourier] = useState('')
  const [actionMsg, setActionMsg] = useState(null)

  const load = async () => {
    const d = await getDeliveryById(id)
    if (!d) { navigate('/deliveries'); return }
    setDelivery(d)
    setLoading(false)
  }

  useEffect(() => {
    load()
    getCouriers().then(setCouriers)
  }, [id]) // eslint-disable-line

  const actor = currentUser?.name ?? 'Dispatcher'

  const handleStatusUpdate = async () => {
    if (!nextStatus) return
    try {
      await updateDeliveryStatus(id, nextStatus, actor, statusNote || null)
      setStatusModal(false)
      setStatusNote('')
      setNextStatus('')
      setActionMsg(`Status updated to "${STATUS_LABELS[nextStatus]}".`)
      await load()
      refresh()
      setTimeout(() => setActionMsg(null), 3000)
    } catch (e) {
      setActionMsg(`Error: ${e.message}`)
      setTimeout(() => setActionMsg(null), 5000)
    }
  }

  const handleAssign = async () => {
    if (!selectedCourier) return
    try {
      await assignCourier(id, selectedCourier, actor)
      setAssignModal(false)
      setSelectedCourier('')
      setActionMsg('Courier assigned.')
      await load()
      refresh()
      setTimeout(() => setActionMsg(null), 3000)
    } catch (e) {
      setActionMsg(`Error: ${e.message}`)
      setTimeout(() => setActionMsg(null), 5000)
    }
  }

  if (loading) return <div className="loading-page"><div className="spinner" />Loading delivery…</div>
  if (!delivery) return null

  const nextOptions = NEXT_STATUSES[delivery.status] ?? []
  const isException = EXCEPTION_STATUSES.has(delivery.status)
  const assignedCourier = couriers.find(c => c.id === delivery.assignedCourierId)

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <nav style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', marginBottom: 'var(--space-2)' }}>
            <Link to="/deliveries" style={{ color: 'var(--color-brand-600)' }}>Deliveries</Link>
            {' / '}
            {delivery.reference}
          </nav>
          <h1 className="page-title">{delivery.reference}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
            <StatusBadge status={delivery.status} />
            {isException && (
              <span className="badge badge-warning">Exception</span>
            )}
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)' }}>
              {SERVICE_LEVEL_LABELS[delivery.serviceLevel]} · Created {fmtDate(delivery.createdAt)}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          {delivery.status === DeliveryStatus.CREATED && !delivery.assignedCourierId && (
            <button className="btn btn-primary" onClick={() => setAssignModal(true)}>Assign Courier</button>
          )}
          {nextOptions.length > 0 && (
            <button className="btn btn-secondary" onClick={() => setStatusModal(true)}>Update Status</button>
          )}
          <Link to={`/pod?delivery=${id}`} className="btn btn-secondary">Proof of Delivery</Link>
        </div>
      </div>

      {/* Action feedback */}
      {actionMsg && (
        <div className="alert alert-success" style={{ marginBottom: 'var(--space-4)' }} role="status">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
            <path d="M3 8l4 4 6-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {actionMsg}
        </div>
      )}

      {/* Exception banner */}
      {isException && delivery.exceptionReason && (
        <div className="alert alert-warning" style={{ marginBottom: 'var(--space-5)' }}>
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true" style={{ flexShrink: 0, marginTop: 1 }}>
            <path d="M10 3l7 14H3L10 3zm0 5v4m0 2h.01" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <div><strong>Exception:</strong> {delivery.exceptionReason}</div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-5)', alignItems: 'start' }}>
        {/* Delivery info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          {/* Addresses */}
          <div className="card">
            <h2 className="card-title" style={{ marginBottom: 'var(--space-4)' }}>Locations</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-5)' }}>
              <div>
                <p style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-neutral-500)', marginBottom: 'var(--space-2)' }}>Pickup</p>
                <AddressBlock address={delivery.pickup} />
              </div>
              <div>
                <p style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-neutral-500)', marginBottom: 'var(--space-2)' }}>Drop-off</p>
                <AddressBlock address={delivery.dropoff} />
              </div>
            </div>
          </div>

          {/* Delivery details */}
          <div className="card">
            <h2 className="card-title" style={{ marginBottom: 'var(--space-3)' }}>Delivery Details</h2>
            <InfoRow label="Reference" value={delivery.reference} />
            <InfoRow label="Service Level" value={SERVICE_LEVEL_LABELS[delivery.serviceLevel]} />
            <InfoRow label="Scheduled" value={fmtDate(delivery.scheduledFor)} />
            <InfoRow label="Package Notes" value={delivery.packageNotes || '—'} />
            <InfoRow label="Provider" value="Human Courier" />
            <InfoRow label="Tracking Token" value={delivery.trackingToken} />
          </div>

          {/* Courier */}
          <div className="card">
            <h2 className="card-title" style={{ marginBottom: 'var(--space-3)' }}>Assigned Courier</h2>
            {assignedCourier ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <div className="sidebar-user-avatar">{assignedCourier.avatar}</div>
                <div>
                  <p style={{ fontWeight: 'var(--font-medium)', fontSize: 'var(--text-sm)' }}>{assignedCourier.name}</p>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)' }}>{assignedCourier.email}</p>
                </div>
              </div>
            ) : (
              <p style={{ color: 'var(--color-neutral-400)', fontSize: 'var(--text-sm)' }}>
                No courier assigned.{' '}
                {delivery.status === DeliveryStatus.CREATED && (
                  <button className="table-link" style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }} onClick={() => setAssignModal(true)}>Assign now</button>
                )}
              </p>
            )}
          </div>

          {/* Proof of delivery */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Proof of Delivery</h2>
              <Link to={`/pod?delivery=${id}`} className="btn btn-ghost btn-sm">Manage</Link>
            </div>
            <div style={{ marginBottom: 'var(--space-3)' }}>
              <p style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)', color: 'var(--color-neutral-500)', textTransform: 'uppercase', marginBottom: 'var(--space-2)' }}>Required</p>
              {delivery.proofRequirements.map(type => {
                const captured = delivery.proofEvidence.find(e => e.type === type)
                return (
                  <div key={type} className="proof-item">
                    <div className={`proof-status-icon ${captured ? 'complete' : 'pending'}`}>
                      {captured
                        ? <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-label="Complete"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        : <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-label="Pending"><circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1.5"/></svg>
                      }
                    </div>
                    <div>
                      <p className="proof-label">{PROOF_TYPE_LABELS[type]}</p>
                      {captured
                        ? <p className="proof-value">{captured.value} · {new Date(captured.capturedAt).toLocaleString('en-GB')}</p>
                        : <p className="proof-value" style={{ color: 'var(--color-neutral-400)' }}>Not yet captured</p>
                      }
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="card">
          <h2 className="card-title" style={{ marginBottom: 'var(--space-5)' }}>Status Timeline</h2>
          <Timeline events={delivery.timeline} />
        </div>
      </div>

      {/* Update status modal */}
      <Modal
        isOpen={statusModal}
        onClose={() => { setStatusModal(false); setStatusNote(''); setNextStatus('') }}
        title="Update Delivery Status"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setStatusModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleStatusUpdate} disabled={!nextStatus}>Confirm</button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label form-label-required" htmlFor="next-status">New Status</label>
          <select
            id="next-status"
            className="form-control"
            value={nextStatus}
            onChange={e => setNextStatus(e.target.value)}
          >
            <option value="">Select status…</option>
            {nextOptions.map(s => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="status-note">Note (optional)</label>
          <textarea
            id="status-note"
            className="form-control"
            placeholder="Add a note about this status change…"
            value={statusNote}
            onChange={e => setStatusNote(e.target.value)}
          />
        </div>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>
          This will add an event to the delivery timeline. Past events are never modified.
        </p>
      </Modal>

      {/* Assign courier modal */}
      <Modal
        isOpen={assignModal}
        onClose={() => { setAssignModal(false); setSelectedCourier('') }}
        title="Assign Courier"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setAssignModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleAssign} disabled={!selectedCourier}>Assign</button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label form-label-required" htmlFor="courier-select">Select Courier</label>
          <select
            id="courier-select"
            className="form-control"
            value={selectedCourier}
            onChange={e => setSelectedCourier(e.target.value)}
          >
            <option value="">Choose courier…</option>
            {couriers.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>
          Only couriers who are members of your organisation are shown.
        </p>
      </Modal>
    </div>
  )
}

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/useApp.js'
import StatusBadge from '../components/StatusBadge.jsx'
import Modal from '../components/Modal.jsx'
import { DeliveryStatus, STATUS_LABELS, ACTIVE_STATUSES } from '../models/delivery.js'
import { updateDeliveryStatus } from '../services/deliveryService.js'
import { BoxSeam } from 'react-bootstrap-icons'

const fmtDate = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

// Status transitions a courier can make
const COURIER_NEXT = {
  [DeliveryStatus.ASSIGNED]:  [DeliveryStatus.PICKED_UP],
  [DeliveryStatus.PICKED_UP]: [DeliveryStatus.EN_ROUTE],
  [DeliveryStatus.EN_ROUTE]:  [DeliveryStatus.DELIVERED, DeliveryStatus.ATTEMPTED, DeliveryStatus.DELAYED],
  [DeliveryStatus.DELAYED]:   [DeliveryStatus.EN_ROUTE],
}

export default function CourierJobsPage() {
  const { deliveries, currentUser, refresh } = useApp()
  const [actionDelivery, setActionDelivery] = useState(null)
  const [nextStatus, setNextStatus] = useState('')
  const [note, setNote] = useState('')
  const [toast, setToast] = useState(null)

  const courierId = currentUser?.id
  const myJobs = deliveries.filter(d => d.assignedCourierId === courierId)
  const activeJobs = myJobs.filter(d => ACTIVE_STATUSES.has(d.status))
  const completedJobs = myJobs.filter(d => !ACTIVE_STATUSES.has(d.status))

  const handleConfirm = async () => {
    if (!nextStatus || !actionDelivery) return
    try {
      await updateDeliveryStatus(actionDelivery.id, nextStatus, currentUser?.name ?? 'Courier', note || null)
      setActionDelivery(null)
      setToast(`Updated to "${STATUS_LABELS[nextStatus]}".`)
      setTimeout(() => setToast(null), 3000)
      refresh()
    } catch (e) {
      setToast(`Error: ${e.message}`)
      setTimeout(() => setToast(null), 5000)
    }
  }

  const priorityOrder = [
    DeliveryStatus.EN_ROUTE,
    DeliveryStatus.PICKED_UP,
    DeliveryStatus.ASSIGNED,
    DeliveryStatus.DELAYED,
    DeliveryStatus.ATTEMPTED,
  ]

  const sorted = [...activeJobs].sort((a, b) =>
    (priorityOrder.indexOf(a.status) ?? 99) - (priorityOrder.indexOf(b.status) ?? 99)
  )

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Jobs</h1>
          <p className="page-subtitle">
            {currentUser?.name ?? 'Courier'} · {activeJobs.length} active job{activeJobs.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {toast && (
        <div className="alert alert-success" style={{ marginBottom: 'var(--space-4)' }} role="status">
          {toast}
        </div>
      )}

      {/* Active jobs */}
      <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-semibold)', color: 'var(--color-neutral-700)', marginBottom: 'var(--space-3)' }}>
        Active Jobs
      </h2>

      {sorted.length === 0 ? (
        <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
          <div className="empty-state">
            <p className="empty-state-title">No active jobs</p>
            <p className="empty-state-text">Check back when deliveries are assigned to you.</p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
          {sorted.map(d => {
            const nextOptions = COURIER_NEXT[d.status] ?? []
            return (
              <div className="card" key={d.id} style={{ borderLeft: '4px solid var(--color-brand-600)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                      <Link to={`/deliveries/${d.id}`} className="table-link">{d.reference}</Link>
                      <StatusBadge status={d.status} />
                    </div>

                    {/* Route info — big and clear for mobile */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-3)' }}>
                      <div>
                        <p style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)', color: 'var(--color-neutral-500)', textTransform: 'uppercase', marginBottom: 4 }}>Pickup</p>
                        <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)' }}>{d.pickup.name}</p>
                        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-600)' }}>{d.pickup.line1}</p>
                        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-600)' }}>{d.pickup.city}, {d.pickup.postcode}</p>
                        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)', marginTop: 4 }}>{d.pickup.contactPhone}</p>
                      </div>
                      <div>
                        <p style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)', color: 'var(--color-neutral-500)', textTransform: 'uppercase', marginBottom: 4 }}>Drop-off</p>
                        <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)' }}>{d.dropoff.contactName}</p>
                        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-600)' }}>{d.dropoff.line1}{d.dropoff.line2 ? `, ${d.dropoff.line2}` : ''}</p>
                        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-600)' }}>{d.dropoff.city}, {d.dropoff.postcode}</p>
                        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)', marginTop: 4 }}>{d.dropoff.contactPhone}</p>
                      </div>
                    </div>

                    {d.packageNotes && (
                      <div className="alert alert-info" style={{ fontSize: 'var(--text-sm)', marginBottom: 'var(--space-3)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <BoxSeam size={14} aria-hidden="true" /> {d.packageNotes}
                      </div>
                    )}

                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>
                      Scheduled: {fmtDate(d.scheduledFor)}
                    </p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', minWidth: 140 }}>
                    {nextOptions.map(s => (
                      <button
                        key={s}
                        className={`btn btn-sm ${s === DeliveryStatus.DELIVERED ? 'btn-primary' : s === DeliveryStatus.ATTEMPTED || s === DeliveryStatus.DELAYED ? 'btn-secondary' : 'btn-secondary'}`}
                        onClick={() => { setActionDelivery(d); setNextStatus(s); setNote('') }}
                      >
                        {STATUS_LABELS[s]}
                      </button>
                    ))}
                    <Link to={`/pod?delivery=${d.id}`} className="btn btn-ghost btn-sm">Submit POD</Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Completed jobs */}
      {completedJobs.length > 0 && (
        <>
          <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-semibold)', color: 'var(--color-neutral-700)', marginBottom: 'var(--space-3)' }}>
            Completed / Closed
          </h2>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Reference</th>
                  <th scope="col">Recipient</th>
                  <th scope="col">Status</th>
                  <th scope="col">Last Update</th>
                  <th scope="col"><span className="sr-only">View</span></th>
                </tr>
              </thead>
              <tbody>
                {completedJobs.map(d => (
                  <tr key={d.id}>
                    <td><Link to={`/deliveries/${d.id}`} className="table-link">{d.reference}</Link></td>
                    <td>{d.recipient.name}</td>
                    <td><StatusBadge status={d.status} /></td>
                    <td>{fmtDate(d.timeline[d.timeline.length - 1]?.timestamp)}</td>
                    <td><Link to={`/deliveries/${d.id}`} className="btn btn-ghost btn-sm">View</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Confirm action modal */}
      <Modal
        isOpen={!!actionDelivery && !!nextStatus}
        onClose={() => { setActionDelivery(null); setNextStatus('') }}
        title={`Mark as: ${STATUS_LABELS[nextStatus] ?? nextStatus}`}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => { setActionDelivery(null); setNextStatus('') }}>Cancel</button>
            <button className="btn btn-primary" onClick={handleConfirm}>Confirm</button>
          </>
        }
      >
        {actionDelivery && (
          <div>
            <p style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-600)' }}>
              Delivery <strong>{actionDelivery.reference}</strong> will be marked as <strong>{STATUS_LABELS[nextStatus]}</strong>.
            </p>
            <div className="form-group">
              <label className="form-label" htmlFor="courier-note">Note (optional)</label>
              <textarea
                id="courier-note"
                className="form-control"
                placeholder="e.g. Left with neighbour, no answer at door…"
                value={note}
                onChange={e => setNote(e.target.value)}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

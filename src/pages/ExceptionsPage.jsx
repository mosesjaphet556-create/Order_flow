import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/useApp.js'
import StatusBadge from '../components/StatusBadge.jsx'
import Modal from '../components/Modal.jsx'
import { EXCEPTION_STATUSES, DeliveryStatus } from '../models/delivery.js'
import { updateDeliveryStatus, rescheduleDelivery } from '../services/deliveryService.js'

const fmtDate = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

const EXCEPTION_ACTIONS = {
  [DeliveryStatus.DELAYED]:   ['reschedule', 'markFailed'],
  [DeliveryStatus.ATTEMPTED]: ['reschedule', 'returnToSender'],
  [DeliveryStatus.FAILED]:    ['returnToSender'],
  [DeliveryStatus.CANCELLED]: [],
  [DeliveryStatus.RETURNED]:  [],
}

export default function ExceptionsPage() {
  const { deliveries, currentUser, refresh } = useApp()
  const [actionDelivery, setActionDelivery] = useState(null)
  const [actionType, setActionType] = useState('')
  const [rescheduleDate, setRescheduleDate] = useState('')
  const [note, setNote] = useState('')
  const [toast, setToast] = useState(null)

  const exceptions = deliveries.filter(d => EXCEPTION_STATUSES.has(d.status))
  const actor = currentUser?.name ?? 'Dispatcher'

  const openAction = (delivery, type) => {
    setActionDelivery(delivery)
    setActionType(type)
    setRescheduleDate('')
    setNote('')
  }

  const closeModal = () => { setActionDelivery(null); setActionType('') }

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const handleConfirm = async () => {
    if (!actionDelivery) return
    try {
      if (actionType === 'reschedule') {
        if (!rescheduleDate) return
        await rescheduleDelivery(actionDelivery.id, rescheduleDate, actor)
        showToast(`${actionDelivery.reference} rescheduled.`)
      } else if (actionType === 'returnToSender') {
        await updateDeliveryStatus(actionDelivery.id, DeliveryStatus.RETURNED, actor, note || 'Returned to sender.')
        showToast(`${actionDelivery.reference} marked as Returned.`)
      } else if (actionType === 'markFailed') {
        await updateDeliveryStatus(actionDelivery.id, DeliveryStatus.FAILED, actor, note || 'Marked as failed.')
        showToast(`${actionDelivery.reference} marked as Failed.`)
      }
    } catch (e) {
      showToast(`Error: ${e.message}`)
    }
    closeModal()
    refresh()
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Exceptions</h1>
          <p className="page-subtitle">Deliveries requiring action — delayed, failed, attempted, or returned.</p>
        </div>
      </div>

      {toast && (
        <div className="alert alert-success" style={{ marginBottom: 'var(--space-4)' }} role="status">
          {toast}
        </div>
      )}

      {exceptions.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <svg className="empty-state-icon" viewBox="0 0 48 48" fill="none" aria-hidden="true">
              <path d="M24 10l14 26H10L24 10zm0 10v8m0 4h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <p className="empty-state-title">No exceptions</p>
            <p className="empty-state-text">All deliveries are running normally. Good work!</p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {exceptions.map(d => {
            const actions = EXCEPTION_ACTIONS[d.status] ?? []
            return (
              <div className="card" key={d.id} style={{ borderLeft: '4px solid var(--color-warning-600)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
                      <Link to={`/deliveries/${d.id}`} className="table-link" style={{ fontSize: 'var(--text-base)' }}>
                        {d.reference}
                      </Link>
                      <StatusBadge status={d.status} />
                    </div>
                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-700)', marginBottom: 4 }}>
                      <strong>Recipient:</strong> {d.recipient.name} · {d.dropoff.city}, {d.dropoff.postcode}
                    </p>
                    {d.exceptionReason && (
                      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-warning-700)', marginBottom: 4 }}>
                        <strong>Reason:</strong> {d.exceptionReason}
                      </p>
                    )}
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>
                      Last updated: {fmtDate(d.timeline[d.timeline.length - 1]?.timestamp)}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                    <Link to={`/deliveries/${d.id}`} className="btn btn-ghost btn-sm">View Details</Link>
                    {actions.includes('reschedule') && (
                      <button className="btn btn-primary btn-sm" onClick={() => openAction(d, 'reschedule')}>
                        Reschedule
                      </button>
                    )}
                    {actions.includes('returnToSender') && (
                      <button className="btn btn-secondary btn-sm" onClick={() => openAction(d, 'returnToSender')}>
                        Return to Sender
                      </button>
                    )}
                    {actions.includes('markFailed') && (
                      <button className="btn btn-danger btn-sm" onClick={() => openAction(d, 'markFailed')}>
                        Mark Failed
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Action modal */}
      <Modal
        isOpen={!!actionDelivery}
        onClose={closeModal}
        title={
          actionType === 'reschedule'      ? 'Reschedule Delivery' :
          actionType === 'returnToSender'  ? 'Return to Sender'    :
          actionType === 'markFailed'      ? 'Mark as Failed'       : 'Confirm Action'
        }
        footer={
          <>
            <button className="btn btn-secondary" onClick={closeModal}>Cancel</button>
            <button
              className={`btn ${actionType === 'markFailed' ? 'btn-danger' : 'btn-primary'}`}
              onClick={handleConfirm}
              disabled={actionType === 'reschedule' && !rescheduleDate}
            >
              Confirm
            </button>
          </>
        }
      >
        {actionDelivery && (
          <div>
            <p style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-600)' }}>
              Delivery: <strong>{actionDelivery.reference}</strong> · {actionDelivery.recipient.name}
            </p>

            {actionType === 'reschedule' && (
              <div className="form-group">
                <label className="form-label form-label-required" htmlFor="reschedule-date">New Scheduled Date &amp; Time</label>
                <input
                  id="reschedule-date"
                  type="datetime-local"
                  className="form-control"
                  value={rescheduleDate}
                  onChange={e => setRescheduleDate(e.target.value)}
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="action-note">Note (optional)</label>
              <textarea
                id="action-note"
                className="form-control"
                placeholder="Add a note about this action…"
                value={note}
                onChange={e => setNote(e.target.value)}
              />
            </div>

            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>
              This action adds an event to the timeline. It cannot be undone.
            </p>
          </div>
        )}
      </Modal>
    </div>
  )
}

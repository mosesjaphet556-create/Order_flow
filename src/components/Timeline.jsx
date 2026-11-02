import { STATUS_LABELS, STATUS_VARIANTS } from '../models/delivery.js'

const dotClass = (status) => {
  const v = STATUS_VARIANTS[status] ?? 'neutral'
  return `timeline-dot timeline-dot-${v}`
}

const fmtDate = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

/**
 * Renders a vertical timeline of delivery events.
 * Events are shown oldest→newest (chronological order).
 */
export default function Timeline({ events = [] }) {
  if (!events.length) {
    return <p style={{ color: 'var(--color-neutral-400)', fontSize: 'var(--text-sm)' }}>No events yet.</p>
  }

  return (
    <ol className="timeline" aria-label="Delivery timeline">
      {events.map((evt) => (
        <li key={evt.id} className="timeline-item">
          <span className={dotClass(evt.status)} aria-hidden="true" />
          <p className="timeline-time">
            <time dateTime={evt.timestamp}>{fmtDate(evt.timestamp)}</time>
          </p>
          <p className="timeline-status">{STATUS_LABELS[evt.status] ?? evt.status}</p>
          <p className="timeline-actor">{evt.actor}</p>
          {evt.note && <p className="timeline-note">{evt.note}</p>}
        </li>
      ))}
    </ol>
  )
}

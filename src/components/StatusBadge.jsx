import { STATUS_LABELS, STATUS_VARIANTS } from '../models/delivery.js'

/**
 * Displays a coloured pill badge for a delivery status.
 */
export default function StatusBadge({ status }) {
  const label = STATUS_LABELS[status] ?? status
  const variant = STATUS_VARIANTS[status] ?? 'neutral'
  return (
    <span className={`badge badge-${variant}`}>
      <span className="badge-dot" aria-hidden="true" />
      {label}
    </span>
  )
}

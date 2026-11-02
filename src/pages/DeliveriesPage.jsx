import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/useApp.js'
import StatusBadge from '../components/StatusBadge.jsx'
import { DeliveryStatus, STATUS_LABELS, ServiceLevel, SERVICE_LEVEL_LABELS } from '../models/delivery.js'

const fmtDate = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

const ALL_STATUSES = Object.values(DeliveryStatus)

export default function DeliveriesPage() {
  const { deliveries } = useApp()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [serviceFilter, setServiceFilter] = useState('')
  const [sort, setSort] = useState('createdAt-desc')

  const filtered = useMemo(() => {
    let list = [...deliveries]

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(d =>
        d.reference.toLowerCase().includes(q) ||
        d.recipient.name.toLowerCase().includes(q) ||
        d.dropoff.city.toLowerCase().includes(q) ||
        d.dropoff.postcode.toLowerCase().includes(q)
      )
    }

    if (statusFilter) list = list.filter(d => d.status === statusFilter)
    if (serviceFilter) list = list.filter(d => d.serviceLevel === serviceFilter)

    const [field, dir] = sort.split('-')
    list.sort((a, b) => {
      const va = a[field] ?? ''
      const vb = b[field] ?? ''
      const cmp = va < vb ? -1 : va > vb ? 1 : 0
      return dir === 'asc' ? cmp : -cmp
    })

    return list
  }, [deliveries, search, statusFilter, serviceFilter, sort])

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Deliveries</h1>
          <p className="page-subtitle">{deliveries.length} total deliveries</p>
        </div>
        <Link to="/create" className="btn btn-primary">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
          New Delivery
        </Link>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <div className="search-input-wrap">
          <svg className="search-input-icon" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M10 10l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <input
            type="search"
            className="form-control search-input"
            placeholder="Search reference, recipient, city…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            aria-label="Search deliveries"
          />
        </div>
        <select
          className="form-control"
          style={{ minWidth: 160 }}
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          {ALL_STATUSES.map(s => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
        <select
          className="form-control"
          style={{ minWidth: 160 }}
          value={serviceFilter}
          onChange={e => setServiceFilter(e.target.value)}
          aria-label="Filter by service level"
        >
          <option value="">All service levels</option>
          {Object.values(ServiceLevel).map(s => (
            <option key={s} value={s}>{SERVICE_LEVEL_LABELS[s]}</option>
          ))}
        </select>
        <select
          className="form-control"
          style={{ minWidth: 160 }}
          value={sort}
          onChange={e => setSort(e.target.value)}
          aria-label="Sort deliveries"
        >
          <option value="createdAt-desc">Newest first</option>
          <option value="createdAt-asc">Oldest first</option>
          <option value="reference-asc">Reference A–Z</option>
          <option value="scheduledFor-asc">Scheduled ↑</option>
        </select>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <svg className="empty-state-icon" viewBox="0 0 48 48" fill="none" aria-hidden="true">
              <rect x="8" y="12" width="32" height="28" rx="2" stroke="currentColor" strokeWidth="2"/>
              <path d="M16 20h16M16 27h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <p className="empty-state-title">No deliveries found</p>
            <p className="empty-state-text">
              {search || statusFilter || serviceFilter
                ? 'Try adjusting your search or filters.'
                : 'Create your first delivery to get started.'}
            </p>
            {!search && !statusFilter && !serviceFilter && (
              <Link to="/create" className="btn btn-primary">Create Delivery</Link>
            )}
          </div>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="table" aria-label="Deliveries list">
            <thead>
              <tr>
                <th scope="col">Reference</th>
                <th scope="col">Recipient</th>
                <th scope="col">Destination</th>
                <th scope="col">Service</th>
                <th scope="col">Scheduled</th>
                <th scope="col">Status</th>
                <th scope="col"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(d => (
                <tr key={d.id}>
                  <td>
                    <Link to={`/deliveries/${d.id}`} className="table-link">
                      {d.reference}
                    </Link>
                  </td>
                  <td>{d.recipient.name}</td>
                  <td>
                    <span>{d.dropoff.city}</span>
                    <span style={{ color: 'var(--color-neutral-400)', marginLeft: 4 }}>{d.dropoff.postcode}</span>
                  </td>
                  <td>{SERVICE_LEVEL_LABELS[d.serviceLevel] ?? d.serviceLevel}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{fmtDate(d.scheduledFor)}</td>
                  <td><StatusBadge status={d.status} /></td>
                  <td>
                    <Link to={`/deliveries/${d.id}`} className="btn btn-ghost btn-sm">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p style={{ marginTop: 'var(--space-4)', fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>
        Showing {filtered.length} of {deliveries.length} deliveries
      </p>
    </div>
  )
}

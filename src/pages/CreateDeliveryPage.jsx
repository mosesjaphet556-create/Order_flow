import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/useApp.js'
import { createDelivery } from '../services/deliveryService.js'
import { ServiceLevel, SERVICE_LEVEL_LABELS, ProofType, PROOF_TYPE_LABELS } from '../models/delivery.js'
import { CheckCircleFill } from 'react-bootstrap-icons'

const INITIAL = {
  serviceLevel: ServiceLevel.STANDARD,
  scheduledFor: '',
  packageNotes: '',
  proofRequirements: [ProofType.TIMESTAMP],
  pickup: { name: '', line1: '', line2: '', city: '', postcode: '', country: 'GB', contactName: '', contactPhone: '' },
  dropoff: { name: '', line1: '', line2: '', city: '', postcode: '', country: 'GB', contactName: '', contactPhone: '' },
  recipient: { name: '', email: '', phone: '' },
  sender: { name: '', email: '', phone: '' },
}

const REQUIRED_PICKUP = ['name', 'line1', 'city', 'postcode', 'contactName', 'contactPhone']
const REQUIRED_DROPOFF = ['line1', 'city', 'postcode', 'contactName', 'contactPhone']
const REQUIRED_RECIPIENT = ['name', 'email']

function validate(form) {
  const errors = {}
  REQUIRED_PICKUP.forEach(f => { if (!form.pickup[f]?.trim()) errors[`pickup.${f}`] = 'Required' })
  REQUIRED_DROPOFF.forEach(f => { if (!form.dropoff[f]?.trim()) errors[`dropoff.${f}`] = 'Required' })
  REQUIRED_RECIPIENT.forEach(f => { if (!form.recipient[f]?.trim()) errors[`recipient.${f}`] = 'Required' })
  if (!form.recipient.email.includes('@')) errors['recipient.email'] = 'Enter a valid email'
  if (!form.sender.name?.trim()) errors['sender.name'] = 'Required'
  if (form.proofRequirements.length === 0) errors['proofRequirements'] = 'Select at least one proof type'
  return errors
}

export default function CreateDeliveryPage() {
  const { currentUser, orgId } = useApp()
  const navigate = useNavigate()
  const [form, setForm] = useState(INITIAL)
  const [errors, setErrors] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)

  const setNested = (section, field, value) => {
    setForm(f => ({ ...f, [section]: { ...f[section], [field]: value } }))
    setErrors(e => { const n = { ...e }; delete n[`${section}.${field}`]; return n })
  }

  const toggleProof = (type) => {
    setForm(f => {
      const reqs = f.proofRequirements.includes(type)
        ? f.proofRequirements.filter(t => t !== type)
        : [...f.proofRequirements, type]
      return { ...f, proofRequirements: reqs }
    })
    setErrors(e => { const n = { ...e }; delete n['proofRequirements']; return n })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate(form)
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      // scroll to first error
      document.querySelector('.form-control.error')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    setSaving(true)
    try {
      const delivery = await createDelivery(form, currentUser?.name ?? 'Dispatcher', orgId)
      setSaving(false)
      setSubmitted(true)
      setTimeout(() => navigate(`/deliveries/${delivery.id}`), 1200)
    } catch (e) {
      setSaving(false)
      setErrors({ _form: `Failed to create delivery: ${e.message}` })
    }
  }

  if (submitted) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: 'var(--space-4)' }}>
        <CheckCircleFill size={48} color="var(--color-success-600)" aria-hidden="true" />
        <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-semibold)' }}>Delivery created!</h2>
        <p style={{ color: 'var(--color-neutral-500)' }}>Redirecting to delivery details…</p>
      </div>
    )
  }

  const field = (section, name, label, opts = {}) => {
    const key = `${section}.${name}`
    const err = errors[key]
    return (
      <div className="form-group" key={key}>
        <label className={`form-label${opts.required !== false ? ' form-label-required' : ''}`} htmlFor={key}>{label}</label>
        {opts.type === 'textarea' ? (
          <textarea
            id={key}
            className={`form-control${err ? ' error' : ''}`}
            value={form[section][name]}
            onChange={e => setNested(section, name, e.target.value)}
            placeholder={opts.placeholder ?? ''}
            aria-describedby={err ? `${key}-err` : undefined}
          />
        ) : (
          <input
            id={key}
            type={opts.inputType ?? 'text'}
            className={`form-control${err ? ' error' : ''}`}
            value={form[section][name]}
            onChange={e => setNested(section, name, e.target.value)}
            placeholder={opts.placeholder ?? ''}
            aria-describedby={err ? `${key}-err` : undefined}
          />
        )}
        {err && <p className="form-error" id={`${key}-err`} role="alert">{err}</p>}
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 780 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Create Delivery</h1>
          <p className="page-subtitle">Fill in the details below to schedule a new delivery.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        {/* Pickup */}
        <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
          <div className="form-section-title">Pickup Location</div>
          {field('pickup', 'name', 'Business / Sender Name', { placeholder: 'e.g. Sunrise Retail Ltd' })}
          {field('pickup', 'line1', 'Address Line 1', { placeholder: '14 Market Street' })}
          {field('pickup', 'line2', 'Address Line 2', { required: false, placeholder: 'Unit, floor, etc.' })}
          <div className="form-row">
            {field('pickup', 'city', 'City', { placeholder: 'London' })}
            {field('pickup', 'postcode', 'Postcode', { placeholder: 'EC1A 1BB' })}
          </div>
          <div className="form-row">
            {field('pickup', 'contactName', 'Contact Name', { placeholder: 'Tom Hardy' })}
            {field('pickup', 'contactPhone', 'Contact Phone', { inputType: 'tel', placeholder: '+44 20 7000 1111' })}
          </div>
        </div>

        {/* Drop-off */}
        <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
          <div className="form-section-title">Drop-off Location</div>
          {field('dropoff', 'name', 'Recipient / Business Name', { required: false, placeholder: 'Optional' })}
          {field('dropoff', 'line1', 'Address Line 1', { placeholder: '7 Elmwood Close' })}
          {field('dropoff', 'line2', 'Address Line 2', { required: false, placeholder: 'Flat 3' })}
          <div className="form-row">
            {field('dropoff', 'city', 'City', { placeholder: 'London' })}
            {field('dropoff', 'postcode', 'Postcode', { placeholder: 'N1 9GU' })}
          </div>
          <div className="form-row">
            {field('dropoff', 'contactName', 'Contact Name', { placeholder: 'Morgan Wells' })}
            {field('dropoff', 'contactPhone', 'Contact Phone', { inputType: 'tel', placeholder: '+44 7700 900123' })}
          </div>
        </div>

        {/* Recipient */}
        <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
          <div className="form-section-title">Recipient Contact</div>
          <div className="form-row">
            {field('recipient', 'name', 'Full Name', { placeholder: 'Morgan Wells' })}
            {field('recipient', 'phone', 'Phone', { inputType: 'tel', placeholder: '+44 7700 900123', required: false })}
          </div>
          {field('recipient', 'email', 'Email Address', { inputType: 'email', placeholder: 'morgan@example.com' })}
        </div>

        {/* Sender */}
        <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
          <div className="form-section-title">Sender Contact</div>
          <div className="form-row">
            {field('sender', 'name', 'Business / Name', { placeholder: 'Sunrise Retail Ltd' })}
            {field('sender', 'phone', 'Phone', { inputType: 'tel', placeholder: '+44 20 7000 1111', required: false })}
          </div>
          {field('sender', 'email', 'Email Address', { inputType: 'email', placeholder: 'dispatch@company.com', required: false })}
        </div>

        {/* Schedule & service */}
        <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
          <div className="form-section-title">Schedule &amp; Service</div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label form-label-required" htmlFor="serviceLevel">Service Level</label>
              <select
                id="serviceLevel"
                className="form-control"
                value={form.serviceLevel}
                onChange={e => setForm(f => ({ ...f, serviceLevel: e.target.value }))}
              >
                {Object.values(ServiceLevel).map(s => (
                  <option key={s} value={s}>{SERVICE_LEVEL_LABELS[s]}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="scheduledFor">Scheduled Date &amp; Time</label>
              <input
                id="scheduledFor"
                type="datetime-local"
                className="form-control"
                value={form.scheduledFor}
                onChange={e => setForm(f => ({ ...f, scheduledFor: e.target.value }))}
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="packageNotes">Package Notes</label>
            <textarea
              id="packageNotes"
              className="form-control"
              placeholder="Fragile, keep upright, do not bend, etc."
              value={form.packageNotes}
              onChange={e => setForm(f => ({ ...f, packageNotes: e.target.value }))}
            />
          </div>
        </div>

        {/* Proof requirements */}
        <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
          <div className="form-section-title">Proof of Delivery Requirements</div>
          <p className="form-hint" style={{ marginBottom: 'var(--space-3)' }}>
            Select the evidence types required to confirm successful delivery.
          </p>
          <div className="checkbox-group">
            {Object.values(ProofType).map(type => (
              <label key={type} className="checkbox-item">
                <input
                  type="checkbox"
                  checked={form.proofRequirements.includes(type)}
                  onChange={() => toggleProof(type)}
                  aria-describedby={errors['proofRequirements'] ? 'proof-err' : undefined}
                />
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-700)' }}>
                  {PROOF_TYPE_LABELS[type]}
                </span>
              </label>
            ))}
          </div>
          {errors['proofRequirements'] && (
            <p className="form-error" id="proof-err" role="alert">{errors['proofRequirements']}</p>
          )}
          <div className="alert alert-info" style={{ marginTop: 'var(--space-4)' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
              <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M8 7v4M8 5.5h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <span>
              <strong>Note:</strong> Location capture is labelled as demo-only. Photo and signature features
              use simulated demo flows — no camera or device capabilities are accessed.
            </span>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
            {saving ? (
              <><div className="spinner" style={{ width: 16, height: 16 }} />Saving…</>
            ) : (
              'Create Delivery'
            )}
          </button>
          <button type="button" className="btn btn-secondary btn-lg" onClick={() => navigate('/deliveries')}>
            Cancel
          </button>
        </div>

        {Object.keys(errors).length > 0 && (
          <div className="alert alert-danger" style={{ marginTop: 'var(--space-4)' }} role="alert">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
              <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M8 5v4M8 11h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Please fix the highlighted fields before saving.
          </div>
        )}
      </form>
    </div>
  )
}

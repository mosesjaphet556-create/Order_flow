import { useState } from 'react'
import { useApp } from '../context/useApp.js'
import { ROLE_LABELS } from '../models/delivery.js'
import { CheckLg } from 'react-bootstrap-icons'

function Section({ title, children }) {
  return (
    <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
      <div className="form-section-title" style={{ marginBottom: 'var(--space-4)' }}>{title}</div>
      {children}
    </div>
  )
}

function Toggle({ label, description, checked, onChange }) {
  const id = label.replace(/\s+/g, '-').toLowerCase()
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-3) 0', borderBottom: '1px solid var(--color-neutral-100)' }}>
      <div>
        <label htmlFor={id} style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', color: 'var(--color-neutral-800)', cursor: 'pointer' }}>
          {label}
        </label>
        {description && (
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)', marginTop: 2 }}>{description}</p>
        )}
      </div>
      <label style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={e => onChange(e.target.checked)}
          style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }}
        />
        <span style={{
          display: 'block',
          width: 40,
          height: 22,
          background: checked ? 'var(--color-brand-600)' : 'var(--color-neutral-300)',
          borderRadius: 11,
          transition: 'background 200ms',
          position: 'relative',
        }}>
          <span style={{
            position: 'absolute',
            top: 3, left: checked ? 21 : 3,
            width: 16, height: 16,
            background: 'white',
            borderRadius: '50%',
            transition: 'left 200ms',
          }} />
        </span>
      </label>
    </div>
  )
}

export default function SettingsPage() {
  const { currentUser } = useApp()
  const [saved, setSaved] = useState(false)
  const [notifications, setNotifications] = useState({
    statusUpdates: true,
    exceptions: true,
    dailySummary: false,
    podConfirmation: true,
  })
  const [evidence, setEvidence] = useState({
    retainPhotos: true,
    retainSignatures: true,
    retentionDays: '90',
  })
  const [orgName, setOrgName]   = useState('')
  const [orgEmail, setOrgEmail] = useState('')

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div style={{ maxWidth: 680 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Account, organisation, and notification preferences.</p>
        </div>
      </div>

      {/* Account */}
      <Section title="My Account">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
          <div style={{
            width: 52, height: 52,
            background: 'var(--color-brand-700)',
            borderRadius: 'var(--radius-full)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 'var(--font-bold)', color: 'white', fontSize: 'var(--text-lg)',
          }}>
            {currentUser?.avatar ?? '?'}
          </div>
          <div>
            <p style={{ fontWeight: 'var(--font-semibold)', fontSize: 'var(--text-base)' }}>{currentUser?.name ?? ''}</p>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)' }}>{currentUser?.email ?? '—'}</p>
            <span className="badge badge-neutral" style={{ marginTop: 4 }}>{ROLE_LABELS[currentUser?.role] ?? 'Unknown'}</span>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label" htmlFor="acc-name">Display Name</label>
            <input id="acc-name" type="text" className="form-control" defaultValue={currentUser?.name ?? ''} readOnly />
            <p className="form-hint">Managed via Firebase Authentication.</p>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="acc-email">Email Address</label>
            <input id="acc-email" type="email" className="form-control" defaultValue={currentUser?.email ?? ''} readOnly />
            <p className="form-hint">Managed via Firebase Authentication.</p>
          </div>
        </div>
      </Section>

      {/* Organisation */}
      {['admin', 'dispatcher'].includes(currentUser?.role) && (
        <Section title="Organisation">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="org-name">Organisation Name</label>
              <input
                id="org-name"
                type="text"
                className="form-control"
                value={orgName}
                onChange={e => setOrgName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="org-email">Organisation Email</label>
              <input
                id="org-email"
                type="email"
                className="form-control"
                value={orgEmail}
                onChange={e => setOrgEmail(e.target.value)}
              />
            </div>
          </div>
        </Section>
      )}

      {/* Team / Roles */}
      {currentUser?.role === 'admin' && (
        <Section title="Team &amp; Roles">
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', padding: 'var(--space-2) 0' }}>
            Team members are managed in the Firebase Console under Authentication and Firestore.
            Full in-app team management (invite, role change, remove) is a planned feature.
          </p>
        </Section>
      )}

      {/* Notification preferences */}
      <Section title="Notification Preferences">
        <Toggle
          label="Status update notifications"
          description="Get notified when a delivery status changes."
          checked={notifications.statusUpdates}
          onChange={v => setNotifications(n => ({ ...n, statusUpdates: v }))}
        />
        <Toggle
          label="Exception alerts"
          description="Immediate alerts for delayed, failed, or returned deliveries."
          checked={notifications.exceptions}
          onChange={v => setNotifications(n => ({ ...n, exceptions: v }))}
        />
        <Toggle
          label="Proof of delivery confirmation"
          description="Receive confirmation when POD is submitted."
          checked={notifications.podConfirmation}
          onChange={v => setNotifications(n => ({ ...n, podConfirmation: v }))}
        />
        <Toggle
          label="Daily summary digest"
          description="A daily summary of delivery activity (email)."
          checked={notifications.dailySummary}
          onChange={v => setNotifications(n => ({ ...n, dailySummary: v }))}
        />
        <p style={{ marginTop: 'var(--space-3)', fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>
          Notification delivery (email/SMS) requires a backend integration. These preferences will be applied when that integration is configured.
        </p>
      </Section>

      {/* Evidence retention */}
      <Section title="Evidence Retention">
        <Toggle
          label="Retain photo evidence"
          description="Store photo evidence from proof of delivery submissions."
          checked={evidence.retainPhotos}
          onChange={v => setEvidence(e => ({ ...e, retainPhotos: v }))}
        />
        <Toggle
          label="Retain signature records"
          description="Store signature captures linked to deliveries."
          checked={evidence.retainSignatures}
          onChange={v => setEvidence(e => ({ ...e, retainSignatures: v }))}
        />
        <div className="form-group" style={{ marginTop: 'var(--space-4)' }}>
          <label className="form-label" htmlFor="retention-days">Retention Period (days)</label>
          <select
            id="retention-days"
            className="form-control"
            style={{ maxWidth: 200 }}
            value={evidence.retentionDays}
            onChange={e => setEvidence(ev => ({ ...ev, retentionDays: e.target.value }))}
          >
            <option value="30">30 days</option>
            <option value="60">60 days</option>
            <option value="90">90 days</option>
            <option value="180">180 days</option>
            <option value="365">1 year</option>
          </select>
          <p className="form-hint">Evidence retention policy will be enforced by a scheduled backend process.</p>
        </div>
      </Section>

      {/* Save */}
      <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
        <button className="btn btn-primary" onClick={handleSave}>
          Save Settings
        </button>
        {saved && (
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-success-600)', fontWeight: 'var(--font-medium)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <CheckLg size={14} aria-hidden="true" /> Settings saved
          </span>
        )}
      </div>
    </div>
  )
}

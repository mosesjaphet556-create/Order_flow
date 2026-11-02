/**
 * Order Flow — Delivery Service (Firestore)
 *
 * When Firebase is configured and user is authenticated → Firestore.
 * Otherwise → in-memory demo fallback (unchanged behaviour).
 *
 * Firestore collections:
 *   deliveries/{deliveryId}
 *   deliveries/{deliveryId}/statusEvents/{eventId}   ← append-only
 *   deliveries/{deliveryId}/proofOfDelivery/{podId}
 *   users/{userId}  → { orgId, role, displayName }
 *
 * Status transition validation runs in the service layer.
 * Firestore Security Rules enforce that clients cannot write statusEvents
 * directly (only via this service's transaction pattern) and cannot
 * delete or update past events.
 *
 * Exported signatures are IDENTICAL in both modes — no page code changes.
 */

import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc, query,
  where, orderBy, serverTimestamp, runTransaction, Timestamp,
} from 'firebase/firestore'
import { firestore, isFirebaseConfigured } from '../lib/firebaseClient.js'
import { firebaseAuth } from '../lib/firebaseClient.js'
import { DEMO_DELIVERIES, DEMO_COURIERS } from '../data/demoData.js'
import { DeliveryStatus, EXCEPTION_STATUSES } from '../models/delivery.js'

// ─── Demo in-memory store ─────────────────────────────────────────────────────

let _demo = DEMO_DELIVERIES.map(d => ({ ...d, timeline: [...d.timeline] }))
let _demoNextId = 200
const deepClone = obj => JSON.parse(JSON.stringify(obj))

// ─── Pub/sub (AppContext re-render trigger) ───────────────────────────────────

const _listeners = new Set()
const notify = () => _listeners.forEach(fn => fn())
export const subscribeToDeliveries = fn => { _listeners.add(fn); return () => _listeners.delete(fn) }

// ─── Allowed status transitions ───────────────────────────────────────────────

const ALLOWED_NEXT = {
  created:   ['assigned', 'cancelled'],
  assigned:  ['picked_up', 'cancelled'],
  picked_up: ['en_route', 'delayed'],
  en_route:  ['delivered', 'attempted', 'delayed', 'failed'],
  delayed:   ['en_route', 'failed', 'returned'],
  attempted: ['en_route', 'returned', 'failed'],
  delivered: [],
  failed:    ['returned'],
  cancelled: [],
  returned:  [],
}

// ─── Mode helper ──────────────────────────────────────────────────────────────

function isLiveMode() {
  return isFirebaseConfigured && !!firebaseAuth?.currentUser
}

// ─── Shape helpers ────────────────────────────────────────────────────────────

function tsToIso(ts) {
  if (!ts) return null
  if (ts instanceof Timestamp) return ts.toDate().toISOString()
  return ts
}

function docToDelivery(snap, events = [], evidence = []) {
  const d = snap.data()
  return {
    id:                snap.id,
    reference:         d.reference,
    status:            d.status,
    serviceLevel:      d.serviceLevel,
    createdAt:         tsToIso(d.createdAt),
    scheduledFor:      tsToIso(d.scheduledFor),
    trackingToken:     d.trackingToken,
    packageNotes:      d.packageNotes || '',
    exceptionReason:   d.exceptionReason || null,
    assignedCourierId: d.assignedCourierId || null,
    provider:          d.provider || 'human_courier',
    proofRequirements: d.proofRequirements || [],
    pickup:            d.pickup || {},
    dropoff:           d.dropoff || {},
    recipient:         d.recipient || {},
    sender:            d.sender || {},
    timeline: events.map(e => ({
      id:        e.id,
      status:    e.status,
      timestamp: tsToIso(e.createdAt),
      actor:     e.actorLabel,
      note:      e.note || null,
      isDemo:    false,
    })),
    proofEvidence: evidence.map(p => ({
      type:        p.evidenceType,
      capturedAt:  tsToIso(p.capturedAt),
      value:       p.textValue || p.storagePath,
      storagePath: p.storagePath || null,
      isDemo:      false,
    })),
  }
}

function actorLabel() {
  const u = firebaseAuth?.currentUser
  return u?.displayName || u?.email || 'Unknown'
}

async function getOrgId() {
  const u = firebaseAuth?.currentUser
  if (!u) return null
  const snap = await getDoc(doc(firestore, 'users', u.uid))
  return snap.exists() ? snap.data().orgId : null
}

// ─── Fetch full delivery with subcollections ──────────────────────────────────

async function fetchFull(deliveryId) {
  const [snap, eventsSnap, podSnap] = await Promise.all([
    getDoc(doc(firestore, 'deliveries', deliveryId)),
    getDocs(query(collection(firestore, 'deliveries', deliveryId, 'statusEvents'), orderBy('createdAt', 'asc'))),
    getDocs(query(collection(firestore, 'deliveries', deliveryId, 'proofOfDelivery'), orderBy('capturedAt', 'asc'))),
  ])
  if (!snap.exists()) return null
  const events   = eventsSnap.docs.map(d => ({ id: d.id, ...d.data() }))
  const evidence = podSnap.docs.map(d => ({ id: d.id, ...d.data() }))
  return docToDelivery(snap, events, evidence)
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getAllDeliveries() {
  if (!isLiveMode()) return deepClone(_demo)
  const orgId = await getOrgId()
  if (!orgId) return []
  const snap = await getDocs(query(
    collection(firestore, 'deliveries'),
    where('orgId', '==', orgId),
    orderBy('createdAt', 'desc')
  ))
  return snap.docs.map(d => docToDelivery(d))
}

export async function getDeliveryById(id) {
  if (!isLiveMode()) {
    const d = _demo.find(d => d.id === id)
    return d ? deepClone(d) : null
  }
  return fetchFull(id)
}

export async function getDeliveryByTrackingToken(token) {
  if (!isFirebaseConfigured) {
    const d = _demo.find(d => d.trackingToken === token)
    return d ? deepClone(d) : null
  }
  // No auth required — query by trackingToken field
  // Security Rules allow read when request.resource == null (query) and token matches
  const snap = await getDocs(query(
    collection(firestore, 'deliveries'),
    where('trackingToken', '==', token)
  ))
  if (snap.empty) return null
  const deliveryDoc = snap.docs[0]
  // Return only recipient-safe fields
  const d = deliveryDoc.data()
  const eventsSnap = await getDocs(query(
    collection(firestore, 'deliveries', deliveryDoc.id, 'statusEvents'),
    orderBy('createdAt', 'asc')
  ))
  return {
    trackingToken:   d.trackingToken,
    reference:       d.reference,
    status:          d.status,
    serviceLevel:    d.serviceLevel,
    scheduledFor:    tsToIso(d.scheduledFor),
    dropoff:         { city: d.dropoff?.city, postcode: d.dropoff?.postcode },
    recipient:       { name: d.recipient?.name },
    exceptionReason: d.exceptionReason || null,
    timeline: eventsSnap.docs.map((e, i) => ({
      id: `evt_${i}`, status: e.data().status,
      timestamp: tsToIso(e.data().createdAt),
      actor: 'Order Flow', note: null, isDemo: false,
    })),
  }
}

export async function getDeliveriesByCourier(courierId) {
  if (!isLiveMode()) return deepClone(_demo.filter(d => d.assignedCourierId === courierId))
  const orgId = await getOrgId()
  if (!orgId) return []
  const snap = await getDocs(query(
    collection(firestore, 'deliveries'),
    where('orgId', '==', orgId),
    where('assignedCourierId', '==', courierId),
    orderBy('createdAt', 'desc')
  ))
  return snap.docs.map(d => docToDelivery(d))
}

export async function getExceptions() {
  if (!isLiveMode()) return deepClone(_demo.filter(d => EXCEPTION_STATUSES.has(d.status)))
  const orgId = await getOrgId()
  if (!orgId) return []
  const snap = await getDocs(query(
    collection(firestore, 'deliveries'),
    where('orgId', '==', orgId),
    where('status', 'in', [...EXCEPTION_STATUSES]),
    orderBy('updatedAt', 'desc')
  ))
  return snap.docs.map(d => docToDelivery(d))
}

export async function getCouriers() {
  if (!isLiveMode()) return deepClone(DEMO_COURIERS)
  const orgId = await getOrgId()
  if (!orgId) return []
  const snap = await getDocs(query(
    collection(firestore, 'users'),
    where('orgId', '==', orgId),
    where('role', '==', 'courier')
  ))
  return snap.docs.map(d => ({ id: d.id, name: d.data().displayName || d.data().email, role: 'courier', avatar: (d.data().displayName || d.data().email || '?').slice(0, 2).toUpperCase() }))
}

export async function getDeliveryStats(orgId) {
  if (!isLiveMode()) {
    const all = _demo
    const counts = {}
    Object.values(DeliveryStatus).forEach(s => { counts[s] = 0 })
    all.forEach(d => { counts[d.status] = (counts[d.status] || 0) + 1 })
    return {
      total: all.length,
      active: all.filter(d => ['assigned','picked_up','en_route'].includes(d.status)).length,
      delivered: counts.delivered || 0,
      exceptions: all.filter(d => EXCEPTION_STATUSES.has(d.status)).length,
      unassigned: all.filter(d => d.status === 'created' && !d.assignedCourierId).length,
      counts,
    }
  }
  if (!orgId) return null
  const snap = await getDocs(query(collection(firestore, 'deliveries'), where('orgId', '==', orgId)))
  const all = snap.docs.map(d => d.data())
  const counts = {}
  Object.values(DeliveryStatus).forEach(s => { counts[s] = 0 })
  all.forEach(d => { counts[d.status] = (counts[d.status] || 0) + 1 })
  return {
    total: all.length,
    active: all.filter(d => ['assigned','picked_up','en_route'].includes(d.status)).length,
    delivered: counts.delivered || 0,
    exceptions: all.filter(d => EXCEPTION_STATUSES.has(d.status)).length,
    unassigned: all.filter(d => d.status === 'created' && !d.assignedCourierId).length,
    counts,
  }
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export async function createDelivery(formData, actor, orgId) {
  if (!isLiveMode()) {
    const id = `del_${String(++_demoNextId).padStart(3, '0')}`
    const now = new Date().toISOString()
    const delivery = {
      id, reference: `OF-2026-${String(_demoNextId + 145).padStart(5, '0')}`,
      status: DeliveryStatus.CREATED, serviceLevel: formData.serviceLevel,
      createdAt: now, scheduledFor: formData.scheduledFor || null,
      trackingToken: `trk_new_${id}`, packageNotes: formData.packageNotes || '',
      pickup: { ...formData.pickup }, dropoff: { ...formData.dropoff },
      recipient: { ...formData.recipient }, sender: { ...formData.sender },
      proofRequirements: formData.proofRequirements || [], proofEvidence: [],
      assignedCourierId: null, provider: 'human_courier', exceptionReason: null,
      timeline: [{ id: `evt_${Date.now()}`, status: DeliveryStatus.CREATED, timestamp: now, actor: `${actor} [DEMO]`, note: 'Delivery created.', isDemo: true }],
    }
    _demo = [delivery, ..._demo]
    notify()
    return deepClone(delivery)
  }

  const resolvedOrgId = orgId || await getOrgId()
  const now = serverTimestamp()
  const ref = `OF-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`

  const deliveryRef = await addDoc(collection(firestore, 'deliveries'), {
    orgId: resolvedOrgId,
    reference: ref,
    status: 'created',
    serviceLevel: formData.serviceLevel,
    scheduledFor: formData.scheduledFor ? new Date(formData.scheduledFor) : null,
    packageNotes: formData.packageNotes || '',
    proofRequirements: formData.proofRequirements || ['timestamp'],
    trackingToken: crypto.randomUUID(),
    pickup: { ...formData.pickup },
    dropoff: { ...formData.dropoff },
    recipient: { ...formData.recipient },
    sender: { ...formData.sender },
    assignedCourierId: null,
    provider: 'human_courier',
    exceptionReason: null,
    createdAt: now,
    updatedAt: now,
  })

  await addDoc(collection(firestore, 'deliveries', deliveryRef.id, 'statusEvents'), {
    status: 'created',
    actorId: firebaseAuth.currentUser?.uid || null,
    actorLabel: actor,
    note: 'Delivery created.',
    createdAt: now,
  })

  notify()
  return fetchFull(deliveryRef.id)
}

export async function updateDeliveryStatus(id, newStatus, actor, note = null) {
  if (!isLiveMode()) {
    const idx = _demo.findIndex(d => d.id === id)
    if (idx === -1) return null
    const now = new Date().toISOString()
    const event = { id: `evt_${Date.now()}`, status: newStatus, timestamp: now, actor: `${actor} [DEMO]`, note, isDemo: true }
    _demo[idx] = { ..._demo[idx], status: newStatus,
      exceptionReason: EXCEPTION_STATUSES.has(newStatus) ? (note || _demo[idx].exceptionReason) : null,
      timeline: [..._demo[idx].timeline, event] }
    notify()
    return deepClone(_demo[idx])
  }

  const deliveryRef = doc(firestore, 'deliveries', id)

  // Run as a transaction to validate current status before writing
  await runTransaction(firestore, async tx => {
    const snap = await tx.get(deliveryRef)
    if (!snap.exists()) throw new Error('delivery_not_found')
    const current = snap.data().status
    if (!ALLOWED_NEXT[current]?.includes(newStatus)) {
      throw new Error(`invalid_transition: ${current} → ${newStatus}`)
    }
    const now = serverTimestamp()
    tx.update(deliveryRef, {
      status: newStatus,
      exceptionReason: EXCEPTION_STATUSES.has(newStatus) ? (note || snap.data().exceptionReason || null) : null,
      updatedAt: now,
    })
    // Append event — Security Rules block delete/update on this subcollection
    const eventRef = doc(collection(firestore, 'deliveries', id, 'statusEvents'))
    tx.set(eventRef, {
      status: newStatus,
      actorId: firebaseAuth.currentUser?.uid || null,
      actorLabel: actor || actorLabel(),
      note: note || null,
      createdAt: now,
    })
  })

  notify()
  return fetchFull(id)
}

export async function assignCourier(deliveryId, courierId, actor) {
  if (!isLiveMode()) {
    const idx = _demo.findIndex(d => d.id === deliveryId)
    if (idx === -1) return null
    const courierName = DEMO_COURIERS.find(c => c.id === courierId)?.name || 'Unknown Courier'
    const now = new Date().toISOString()
    _demo[idx] = { ..._demo[idx], status: DeliveryStatus.ASSIGNED, assignedCourierId: courierId,
      timeline: [..._demo[idx].timeline, { id: `evt_${Date.now()}`, status: DeliveryStatus.ASSIGNED, timestamp: now, actor: `${actor} [DEMO]`, note: `Assigned to ${courierName}.`, isDemo: true }] }
    notify()
    return deepClone(_demo[idx])
  }

  const deliveryRef = doc(firestore, 'deliveries', deliveryId)
  await runTransaction(firestore, async tx => {
    const snap = await tx.get(deliveryRef)
    if (!snap.exists()) throw new Error('delivery_not_found')
    if (snap.data().status !== 'created') throw new Error('invalid_transition: can only assign from created status')
    const now = serverTimestamp()
    tx.update(deliveryRef, { assignedCourierId: courierId, status: 'assigned', updatedAt: now })
    const eventRef = doc(collection(firestore, 'deliveries', deliveryId, 'statusEvents'))
    tx.set(eventRef, { status: 'assigned', actorId: firebaseAuth.currentUser?.uid || null, actorLabel: actor || actorLabel(), note: 'Courier assigned.', createdAt: now })
  })

  notify()
  return fetchFull(deliveryId)
}

export async function submitProofEvidence(deliveryId, evidenceItems, actor, orgId) {
  if (!isLiveMode()) {
    const idx = _demo.findIndex(d => d.id === deliveryId)
    if (idx === -1) return null
    const now = new Date().toISOString()
    _demo[idx] = { ..._demo[idx], status: DeliveryStatus.DELIVERED,
      proofEvidence: [..._demo[idx].proofEvidence, ...evidenceItems.map(i => ({ ...i, capturedAt: i.capturedAt || now, isDemo: true }))],
      timeline: [..._demo[idx].timeline, { id: `evt_${Date.now()}`, status: DeliveryStatus.DELIVERED, timestamp: now, actor: `${actor} [DEMO]`, note: 'Proof of delivery submitted.', isDemo: true }] }
    notify()
    return deepClone(_demo[idx])
  }

  const resolvedOrgId = orgId || await getOrgId()
  const now = serverTimestamp()
  const uid = firebaseAuth.currentUser?.uid || null

  // Insert each evidence record into subcollection
  await Promise.all(evidenceItems.map(item =>
    addDoc(collection(firestore, 'deliveries', deliveryId, 'proofOfDelivery'), {
      orgId: resolvedOrgId,
      submittedBy: uid,
      evidenceType: item.type,
      storagePath: item.storagePath || null,
      textValue: item.storagePath ? null : item.value,
      capturedAt: item.capturedAt ? new Date(item.capturedAt) : new Date(),
      createdAt: now,
    })
  ))

  return updateDeliveryStatus(deliveryId, DeliveryStatus.DELIVERED, actor, 'Proof of delivery submitted.')
}

export async function rescheduleDelivery(deliveryId, newDate, actor) {
  if (!isLiveMode()) {
    const idx = _demo.findIndex(d => d.id === deliveryId)
    if (idx === -1) return null
    const now = new Date().toISOString()
    _demo[idx] = { ..._demo[idx], status: DeliveryStatus.ASSIGNED, scheduledFor: newDate, exceptionReason: null,
      timeline: [..._demo[idx].timeline, { id: `evt_${Date.now()}`, status: DeliveryStatus.ASSIGNED, timestamp: now, actor: `${actor} [DEMO]`, note: `Rescheduled for ${new Date(newDate).toLocaleDateString()}.`, isDemo: true }] }
    notify()
    return deepClone(_demo[idx])
  }

  await updateDoc(doc(firestore, 'deliveries', deliveryId), {
    scheduledFor: new Date(newDate),
    updatedAt: serverTimestamp(),
  })
  return updateDeliveryStatus(deliveryId, DeliveryStatus.ASSIGNED, actor, `Rescheduled for ${new Date(newDate).toLocaleDateString()}.`)
}

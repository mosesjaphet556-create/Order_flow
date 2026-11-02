/**
 * Order Flow — Data Models
 *
 * Plain JS objects that describe the shape of all domain entities.
 * These are the canonical structures used throughout the app.
 * A real backend would replace the demo data layer while keeping these shapes.
 */

// ─── Delivery Status ──────────────────────────────────────────────────────────

export const DeliveryStatus = {
  CREATED: 'created',
  ASSIGNED: 'assigned',
  PICKED_UP: 'picked_up',
  EN_ROUTE: 'en_route',
  DELIVERED: 'delivered',
  // Exception states
  DELAYED: 'delayed',
  ATTEMPTED: 'attempted',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  RETURNED: 'returned',
}

export const STATUS_LABELS = {
  [DeliveryStatus.CREATED]: 'Created',
  [DeliveryStatus.ASSIGNED]: 'Assigned',
  [DeliveryStatus.PICKED_UP]: 'Picked Up',
  [DeliveryStatus.EN_ROUTE]: 'En Route',
  [DeliveryStatus.DELIVERED]: 'Delivered',
  [DeliveryStatus.DELAYED]: 'Delayed',
  [DeliveryStatus.ATTEMPTED]: 'Attempted',
  [DeliveryStatus.FAILED]: 'Failed',
  [DeliveryStatus.CANCELLED]: 'Cancelled',
  [DeliveryStatus.RETURNED]: 'Returned',
}

export const STATUS_VARIANTS = {
  [DeliveryStatus.CREATED]: 'neutral',
  [DeliveryStatus.ASSIGNED]: 'info',
  [DeliveryStatus.PICKED_UP]: 'info',
  [DeliveryStatus.EN_ROUTE]: 'info',
  [DeliveryStatus.DELIVERED]: 'success',
  [DeliveryStatus.DELAYED]: 'warning',
  [DeliveryStatus.ATTEMPTED]: 'warning',
  [DeliveryStatus.FAILED]: 'danger',
  [DeliveryStatus.CANCELLED]: 'danger',
  [DeliveryStatus.RETURNED]: 'warning',
}

export const EXCEPTION_STATUSES = new Set([
  DeliveryStatus.DELAYED,
  DeliveryStatus.ATTEMPTED,
  DeliveryStatus.FAILED,
  DeliveryStatus.CANCELLED,
  DeliveryStatus.RETURNED,
])

export const ACTIVE_STATUSES = new Set([
  DeliveryStatus.CREATED,
  DeliveryStatus.ASSIGNED,
  DeliveryStatus.PICKED_UP,
  DeliveryStatus.EN_ROUTE,
])

// ─── Service Level ────────────────────────────────────────────────────────────

export const ServiceLevel = {
  STANDARD: 'standard',
  EXPRESS: 'express',
  SAME_DAY: 'same_day',
  NEXT_DAY: 'next_day',
}

export const SERVICE_LEVEL_LABELS = {
  [ServiceLevel.STANDARD]: 'Standard',
  [ServiceLevel.EXPRESS]: 'Express',
  [ServiceLevel.SAME_DAY]: 'Same Day',
  [ServiceLevel.NEXT_DAY]: 'Next Day',
}

// ─── Proof Requirements ───────────────────────────────────────────────────────

export const ProofType = {
  TIMESTAMP: 'timestamp',
  PHOTO: 'photo',
  SIGNATURE: 'signature',
  RECIPIENT_CONFIRMATION: 'recipient_confirmation',
  OTP: 'otp',
}

export const PROOF_TYPE_LABELS = {
  [ProofType.TIMESTAMP]: 'Timestamp',
  [ProofType.PHOTO]: 'Photo Evidence',
  [ProofType.SIGNATURE]: 'Signature',
  [ProofType.RECIPIENT_CONFIRMATION]: 'Recipient Confirmation',
  [ProofType.OTP]: 'One-Time Code',
}

// ─── Roles ────────────────────────────────────────────────────────────────────

export const Role = {
  ADMIN: 'admin',
  DISPATCHER: 'dispatcher',
  COURIER: 'courier',
  RECIPIENT: 'recipient',
}

export const ROLE_LABELS = {
  [Role.ADMIN]: 'Business Administrator',
  [Role.DISPATCHER]: 'Dispatcher / Operations',
  [Role.COURIER]: 'Courier',
  [Role.RECIPIENT]: 'Recipient',
}

/**
 * TimelineEvent shape:
 * {
 *   id: string,
 *   status: DeliveryStatus,
 *   timestamp: string (ISO),
 *   actor: string,
 *   note: string | null,
 *   isDemo: boolean,
 * }
 *
 * ProofEvidence shape:
 * {
 *   type: ProofType,
 *   capturedAt: string (ISO) | null,
 *   value: string | null,   // description or base64 thumb in demo
 *   isDemo: boolean,
 * }
 *
 * Delivery shape:
 * {
 *   id: string,
 *   reference: string,
 *   status: DeliveryStatus,
 *   serviceLevel: ServiceLevel,
 *   createdAt: string (ISO),
 *   scheduledFor: string (ISO) | null,
 *   pickup: Address,
 *   dropoff: Address,
 *   recipient: Contact,
 *   sender: Contact,
 *   packageNotes: string,
 *   proofRequirements: ProofType[],
 *   proofEvidence: ProofEvidence[],
 *   assignedCourierId: string | null,
 *   timeline: TimelineEvent[],
 *   exceptionReason: string | null,
 *   provider: string,   // 'human_courier' — extensible for future providers
 * }
 */

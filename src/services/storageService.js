/**
 * Order Flow — Storage Service (Firebase)
 * PATH: pod-evidence/{orgId}/{deliveryId}/{uuid}.{ext}
 * Security enforced by Firebase Storage Rules (firebase/storage.rules).
 * getDownloadURL requires auth — no public URLs are generated.
 */
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage, isFirebaseConfigured } from '../lib/firebaseClient.js'

export async function uploadPodPhoto(orgId, deliveryId, file) {
  if (!isFirebaseConfigured) {
    return { storagePath: `DEMO_PLACEHOLDER/${orgId}/${deliveryId}/demo.jpg`, error: null }
  }
  const path = `pod-evidence/${orgId}/${deliveryId}/${crypto.randomUUID()}.${file.name.split('.').pop() || 'jpg'}`
  try {
    await uploadBytes(ref(storage, path), file, { contentType: file.type })
    return { storagePath: path, error: null }
  } catch (e) {
    return { storagePath: null, error: e }
  }
}

export async function getPodPhotoUrl(storagePath) {
  if (!isFirebaseConfigured || storagePath?.startsWith('DEMO_PLACEHOLDER')) {
    return { downloadUrl: null, error: null }
  }
  try {
    return { downloadUrl: await getDownloadURL(ref(storage, storagePath)), error: null }
  } catch (e) {
    return { downloadUrl: null, error: e }
  }
}

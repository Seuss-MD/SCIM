import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { auth, storage } from '../firebase';

/**
 * Uploads a local photo to a per-user temp folder so the AI Cloud Functions
 * can read it by URL. Storage rules only let the owner write to items/{uid}/.
 */
export async function uploadItemImageAndGetUrl(localUri: string): Promise<string> {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    throw new Error('Sign in before using AI features.');
  }

  const storageRef = ref(storage, `items/${uid}/photo_${Date.now()}.jpg`);

  // fetch(file://...) -> Blob works in Expo
  const resp = await fetch(localUri);
  const blob = await resp.blob();

  await uploadBytes(storageRef, blob, { contentType: 'image/jpeg' });

  return getDownloadURL(storageRef);
}

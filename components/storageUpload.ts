import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { app } from "../firebase";

const storage = getStorage(app);

export async function uploadItemImageAndGetUrl(localUri: string): Promise<string> {
  // Put all AI-visible images under /items/
  const path = `items/photo_${Date.now()}.jpg`;
  const storageRef = ref(storage, path);

  // fetch(file://...) -> Blob works in Expo
  const resp = await fetch(localUri);
  const blob = await resp.blob();

  await uploadBytes(storageRef, blob, { contentType: "image/jpeg" });

  return await getDownloadURL(storageRef);
}
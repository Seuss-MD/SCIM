import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../firebase';
import { uploadItemImageAndGetUrl } from './storageUpload';

const functions = getFunctions(app, 'us-central1');

export async function generateDescriptionFromUrl(imageUrl: string): Promise<string> {
  const fn = httpsCallable(functions, 'generateDescription');
  const res: any = await fn({ imageUrl });
  return res.data.description;
}

export async function generateEmbeddingFromText(text: string): Promise<number[]> {
  const fn = httpsCallable(functions, 'generateEmbedding');
  const res: any = await fn({ text });
  return res.data.embedding;
}

export async function identifyItemsInImage(localUri: string): Promise<string[]> {
  const imageUrl = await uploadItemImageAndGetUrl(localUri);

  const fn = httpsCallable(functions, 'identifyItemsInImage');
  const res: any = await fn({ imageUrl });

  return res.data.items ?? [];
}
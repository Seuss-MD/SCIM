import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../firebase';
import { uploadItemImageAndGetUrl } from './storageUpload';
import { Alert } from 'react-native/Libraries/Alert/Alert';
import Camera from '@/app/(tabs)/camera';

const functions = getFunctions(app, 'us-central1');

export async function generateDescriptionFromUrl(imageUrl: string): Promise<string> {
  const fn = httpsCallable(functions, 'generateDescription');
  const res: any = await fn({ imageUrl });
  return res.data.description;
}

export async function generateEmbeddingFromText(text: string): Promise<number[]> {
  const callable = httpsCallable(functions, 'generateEmbedding');
  const result = await callable({ text });

  const data = result.data as { embedding?: number[] };

  if (!data?.embedding || !Array.isArray(data.embedding)) {
    throw new Error('Embedding response was invalid');
  }

  return data.embedding;
}

export async function identifyItemsInImage(localUri: string): Promise<string[]> {
  const imageUrl = await uploadItemImageAndGetUrl(localUri);

  const fn = httpsCallable(functions, 'identifyItemsInImage');
  const res: any = await fn({ imageUrl });

  return res.data.items ?? [];
}

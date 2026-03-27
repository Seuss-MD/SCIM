// components/aiTools.ts
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';
import { uploadItemImageAndGetUrl } from './storageUpload';
import { compressImageForAI } from './fileSystem';

export async function generateDescriptionFromUrl(
  imageUrl: string
): Promise<string> {
  const fn = httpsCallable(functions, 'generateDescription');
  const res: any = await fn({ imageUrl });

  if (!res?.data?.description || typeof res.data.description !== 'string') {
    throw new Error('Invalid description response');
  }

  return res.data.description;
}

export async function generateEmbeddingFromText(
  text: string
): Promise<number[]> {
  const fn = httpsCallable(functions, 'generateEmbedding');
  const res: any = await fn({ text });

  if (!Array.isArray(res?.data?.embedding)) {
    throw new Error('Invalid embedding response');
  }

  return res.data.embedding;
}

export async function generateEmbeddingFromImage(
  localUri: string
): Promise<{
  imageUrl: string;
  description: string;
  embedding: number[];
}> {
  const optimizedUri =
    localUri.startsWith('file:')
      ? await compressImageForAI(localUri, 768, 0.45)
      : localUri;

  const imageUrl = await uploadItemImageAndGetUrl(optimizedUri);

  try {
    const fn = httpsCallable(functions, 'generateImageEmbedding');
    const res: any = await fn({ imageUrl });

    if (!res?.data?.description || !Array.isArray(res?.data?.embedding)) {
      throw new Error('Invalid image embedding response');
    }

    return {
      imageUrl,
      description: res.data.description,
      embedding: res.data.embedding,
    };
  } catch (error: any) {
    console.error('generateImageEmbedding failed', {
      code: error?.code,
      message: error?.message,
      details: error?.details,
    });
    throw error;
  }
}
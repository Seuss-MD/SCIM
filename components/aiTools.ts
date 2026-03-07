import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "../firebase";

const functions = getFunctions(app, "us-central1");

export async function generateDescriptionFromUrl(imageUrl: string): Promise<string> {
  const fn = httpsCallable(functions, "generateDescription");

  const res: any = await fn({ imageUrl });

  return res.data.description;
}

export async function generateEmbeddingFromText(text: string): Promise<number[]> {
  const fn = httpsCallable(functions, "generateEmbedding");

  const res: any = await fn({ text });

  return res.data.embedding;
}
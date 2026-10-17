/**
 * Pure helpers for embedding-based semantic search.
 *
 * Kept free of Expo / React Native imports so they can be unit tested in
 * plain Node (see tests/vectorSearch.test.ts).
 */

/** Parses an embedding stored as a JSON string in SQLite. */
export function parseEmbedding(value: string | null | undefined): number[] | null {
  if (!value) return null;

  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    return parsed.every((n) => typeof n === 'number' && Number.isFinite(n))
      ? (parsed as number[])
      : null;
  } catch {
    return null;
  }
}

/**
 * Cosine similarity in [-1, 1]. Returns null when the vectors can't be
 * compared (different lengths, empty, or zero magnitude).
 */
export function cosineSimilarity(a: number[], b: number[]): number | null {
  if (a.length !== b.length || a.length === 0) return null;

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  if (denom === 0) return null;

  return dot / denom;
}

export type Ranked<T> = T & { similarity: number };

/**
 * Scores rows against a query embedding and returns the best matches first.
 * Rows without a usable embedding, or below minSimilarity, are dropped.
 */
export function rankBySimilarity<T>(
  rows: T[],
  queryEmbedding: number[],
  getEmbedding: (row: T) => string | null | undefined,
  { limit = 20, minSimilarity = 0 }: { limit?: number; minSimilarity?: number } = {}
): Ranked<T>[] {
  const ranked: Ranked<T>[] = [];

  for (const row of rows) {
    const embedding = parseEmbedding(getEmbedding(row));
    if (!embedding) continue;

    const similarity = cosineSimilarity(queryEmbedding, embedding);
    if (similarity === null || similarity < minSimilarity) continue;

    ranked.push({ ...row, similarity });
  }

  return ranked.sort((a, b) => b.similarity - a.similarity).slice(0, limit);
}

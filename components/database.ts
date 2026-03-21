// components/database.ts
import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('scim.db');

export type Container = {
  id: number;
  name: string;
  image_uri: string | null;
  embedding: string | null;
};

export type Item = {
  id: number;
  name: string;
  description: string | null;
  image_uri: string;
  container_id: number | null;
  embedding: string | null;
  created_at: string;
};

export function initDatabase() {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS containers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      image_uri TEXT,
      embedding TEXT
    );

    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      description TEXT,
      image_uri TEXT NOT NULL,
      container_id INTEGER,
      embedding TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (container_id) REFERENCES containers (id)
    );
  `);

  try {
    db.execSync(`ALTER TABLE containers ADD COLUMN image_uri TEXT;`);
  } catch {}

  try {
    db.execSync(`ALTER TABLE containers ADD COLUMN embedding TEXT;`);
  } catch {}

  try {
    db.execSync(`ALTER TABLE items ADD COLUMN description TEXT;`);
  } catch {}

  try {
    db.execSync(`ALTER TABLE items ADD COLUMN container_id INTEGER;`);
  } catch {}

  try {
    db.execSync(`ALTER TABLE items ADD COLUMN embedding TEXT;`);
  } catch {}

  try {
    db.execSync(`ALTER TABLE items ADD COLUMN created_at TEXT DEFAULT CURRENT_TIMESTAMP;`);
  } catch {}
}

export function insertItem(
  name: string,
  description: string | null,
  imageUri: string,
  containerId: number | null,
  embedding: number[] | null
) {
  db.runSync(
    `INSERT INTO items (name, description, image_uri, container_id, embedding)
     VALUES (?, ?, ?, ?, ?)`,
    [
      name,
      description,
      imageUri,
      containerId,
      embedding ? JSON.stringify(embedding) : null,
    ]
  );
}

export function updateItem(
  id: number,
  name: string,
  description: string | null,
  containerId: number | null
) {
  db.runSync(
    `UPDATE items
     SET name = ?, description = ?, container_id = ?
     WHERE id = ?`,
    [name, description, containerId, id]
  );
}

export function deleteItem(id: number) {
  db.runSync(`DELETE FROM items WHERE id = ?`, [id]);
}

export function getAllItems(): Item[] {
  return db.getAllSync(`SELECT * FROM items ORDER BY created_at DESC`) as Item[];
}

export function getItemsByContainer(containerId: number): Item[] {
  return db.getAllSync(
    `SELECT * FROM items WHERE container_id = ? ORDER BY created_at DESC`,
    [containerId]
  ) as Item[];
}

export function getItemById(id: number): Item | null {
  return db.getFirstSync(`SELECT * FROM items WHERE id = ?`, [id]) as Item | null;
}

export function insertContainer(
  name: string,
  imageUri: string | null,
  embedding: number[] | null
) {
  db.runSync(
    `INSERT INTO containers (name, image_uri, embedding) VALUES (?, ?, ?)`,
    [name, imageUri, embedding ? JSON.stringify(embedding) : null]
  );
}

export function getAllContainers(): Container[] {
  return db.getAllSync(`SELECT * FROM containers ORDER BY id DESC`) as Container[];
}

export function getContainerById(id: number): Container | null {
  return db.getFirstSync(`SELECT * FROM containers WHERE id = ?`, [id]) as Container | null;
}

export function deleteContainer(id: number) {
  db.runSync(`DELETE FROM containers WHERE id = ?`, [id]);
}

function parseEmbedding(value: string | null): number[] | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return -1;

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  if (denom === 0) return -1;

  return dot / denom;
}

export type ItemSearchResult = Item & { similarity: number };

export function searchItemsByEmbedding(
  queryEmbedding: number[],
  containerId?: number,
  limit = 20
): ItemSearchResult[] {
  const items =
    typeof containerId === 'number'
      ? (db.getAllSync(`SELECT * FROM items WHERE container_id = ?`, [containerId]) as Item[])
      : (db.getAllSync(`SELECT * FROM items`) as Item[]);

  return items
    .map((item) => {
      const itemEmbedding = parseEmbedding(item.embedding);
      const similarity = itemEmbedding ? cosineSimilarity(queryEmbedding, itemEmbedding) : -1;
      return { ...item, similarity };
    })
    .filter((item) => item.similarity >= 0)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);
}

export type ContainerSearchResult = Container & { similarity: number };

export function searchContainersByEmbedding(
  queryEmbedding: number[],
  limit = 20
): ContainerSearchResult[] {
  const containers = db.getAllSync(`SELECT * FROM containers`) as Container[];

  return containers
    .map((container) => {
      const containerEmbedding = parseEmbedding(container.embedding);
      const similarity = containerEmbedding
        ? cosineSimilarity(queryEmbedding, containerEmbedding)
        : -1;
      return { ...container, similarity };
    })
    .filter((container) => container.similarity >= 0)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);
}
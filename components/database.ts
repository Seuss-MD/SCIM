import * as SQLite from 'expo-sqlite';

import { rankBySimilarity, type Ranked } from './vectorSearch';

const db = SQLite.openDatabaseSync('scim.db');
export function resetDatabase() {
  db.execSync(`
    DROP TABLE IF EXISTS items;
    DROP TABLE IF EXISTS containers;
  `);

  initDatabase();
}

export type Container = {
  id: number;
  cloud_id: string | null;
  name: string;
  image_uri: string | null;
  embedding: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

export type Item = {
  id: number;
  cloud_id: string | null;
  name: string;
  description: string | null;
  image_uri: string;
  container_id: number | null;
  container_cloud_id: string | null;
  embedding: string | null;
  tags: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

function safeAlter(sql: string) {
  try {
    db.execSync(sql);
  } catch {
    // Column already exists; ALTER TABLE ADD COLUMN is not idempotent in SQLite.
  }
}

export function initDatabase() {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS containers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cloud_id TEXT UNIQUE,
      name TEXT NOT NULL,
      image_uri TEXT,
      embedding TEXT,
      created_by TEXT,
      updated_by TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cloud_id TEXT UNIQUE,
      name TEXT,
      description TEXT,
      image_uri TEXT NOT NULL,
      container_id INTEGER,
      container_cloud_id TEXT,
      embedding TEXT,
      tags TEXT,
      created_by TEXT,
      updated_by TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (container_id) REFERENCES containers (id)
    );
  `);

  safeAlter(`ALTER TABLE containers ADD COLUMN cloud_id TEXT;`);
  safeAlter(`ALTER TABLE containers ADD COLUMN image_uri TEXT;`);
  safeAlter(`ALTER TABLE containers ADD COLUMN embedding TEXT;`);
  safeAlter(`ALTER TABLE containers ADD COLUMN created_by TEXT;`);
  safeAlter(`ALTER TABLE containers ADD COLUMN updated_by TEXT;`);
  safeAlter(`ALTER TABLE containers ADD COLUMN created_at TEXT;`);
  safeAlter(`ALTER TABLE containers ADD COLUMN updated_at TEXT;`);

  safeAlter(`ALTER TABLE items ADD COLUMN cloud_id TEXT;`);
  safeAlter(`ALTER TABLE items ADD COLUMN description TEXT;`);
  safeAlter(`ALTER TABLE items ADD COLUMN container_id INTEGER;`);
  safeAlter(`ALTER TABLE items ADD COLUMN container_cloud_id TEXT;`);
  safeAlter(`ALTER TABLE items ADD COLUMN embedding TEXT;`);
  safeAlter(`ALTER TABLE items ADD COLUMN tags TEXT;`);
  safeAlter(`ALTER TABLE items ADD COLUMN created_by TEXT;`);
  safeAlter(`ALTER TABLE items ADD COLUMN updated_by TEXT;`);
  safeAlter(`ALTER TABLE items ADD COLUMN created_at TEXT;`);
  safeAlter(`ALTER TABLE items ADD COLUMN updated_at TEXT;`);

  db.execSync(`
    UPDATE containers
    SET created_at = COALESCE(created_at, CURRENT_TIMESTAMP);

    UPDATE containers
    SET updated_at = COALESCE(updated_at, CURRENT_TIMESTAMP);

    UPDATE items
    SET created_at = COALESCE(created_at, CURRENT_TIMESTAMP);

    UPDATE items
    SET updated_at = COALESCE(updated_at, CURRENT_TIMESTAMP);
  `);
}

export function insertItem(
  name: string,
  description: string | null,
  imageUri: string,
  containerId: number | null,
  embedding: number[] | null,
  tags: string[] = [],
  options?: {
    cloudId?: string | null;
    containerCloudId?: string | null;
    createdBy?: string | null;
    updatedBy?: string | null;
  }
): number {
  const result = db.runSync(
    `
      INSERT INTO items (
        cloud_id,
        name,
        description,
        image_uri,
        container_id,
        container_cloud_id,
        embedding,
        tags,
        created_by,
        updated_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      options?.cloudId ?? null,
      name,
      description,
      imageUri,
      containerId,
      options?.containerCloudId ?? null,
      embedding ? JSON.stringify(embedding) : null,
      JSON.stringify(tags),
      options?.createdBy ?? null,
      options?.updatedBy ?? null,
    ]
  );

  return Number(result.lastInsertRowId);
}

export function updateItem(
  id: number,
  name: string,
  description: string | null,
  containerId: number | null,
  tags: string[] = [],
  containerCloudId: string | null = null,
  updatedBy: string | null = null
) {
  db.runSync(
    `
      UPDATE items
      SET
        name = ?,
        description = ?,
        container_id = ?,
        container_cloud_id = ?,
        tags = ?,
        updated_by = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    [name, description, containerId, containerCloudId, JSON.stringify(tags), updatedBy, id]
  );
}

export function updateItemAiMetadata(
  id: number,
  description: string | null,
  embedding: number[] | null
) {
  db.runSync(
    `
      UPDATE items
      SET
        description = ?,
        embedding = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    [description, embedding ? JSON.stringify(embedding) : null, id]
  );
}

export function setItemCloudSync(
  localId: number,
  cloudId: string,
  containerCloudId: string | null = null,
  updatedBy: string | null = null
) {
  db.runSync(
    `
      UPDATE items
      SET
        cloud_id = ?,
        container_cloud_id = ?,
        updated_by = COALESCE(?, updated_by),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    [cloudId, containerCloudId, updatedBy, localId]
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

export function getItemByCloudId(cloudId: string): Item | null {
  return db.getFirstSync(`SELECT * FROM items WHERE cloud_id = ?`, [cloudId]) as Item | null;
}

export function insertContainer(
  name: string,
  imageUri: string | null,
  embedding: number[] | null,
  options?: {
    cloudId?: string | null;
    createdBy?: string | null;
    updatedBy?: string | null;
  }
): number {
  const result = db.runSync(
    `
      INSERT INTO containers (
        cloud_id,
        name,
        image_uri,
        embedding,
        created_by,
        updated_by
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    [
      options?.cloudId ?? null,
      name,
      imageUri,
      embedding ? JSON.stringify(embedding) : null,
      options?.createdBy ?? null,
      options?.updatedBy ?? null,
    ]
  );

  return Number(result.lastInsertRowId);
}

export function updateContainerAiMetadata(
  id: number,
  embedding: number[] | null
) {
  db.runSync(
    `
      UPDATE containers
      SET
        embedding = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    [embedding ? JSON.stringify(embedding) : null, id]
  );
}

export function setContainerCloudSync(
  localId: number,
  cloudId: string,
  updatedBy: string | null = null
) {
  db.runSync(
    `
      UPDATE containers
      SET
        cloud_id = ?,
        updated_by = COALESCE(?, updated_by),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    [cloudId, updatedBy, localId]
  );
}

export function getAllContainers(): Container[] {
  return db.getAllSync(`SELECT * FROM containers ORDER BY id DESC`) as Container[];
}

export function getContainerById(id: number): Container | null {
  return db.getFirstSync(`SELECT * FROM containers WHERE id = ?`, [id]) as Container | null;
}

export function getContainerByCloudId(cloudId: string): Container | null {
  return db.getFirstSync(`SELECT * FROM containers WHERE cloud_id = ?`, [cloudId]) as Container | null;
}

export function deleteContainer(id: number) {
  db.runSync(`DELETE FROM containers WHERE id = ?`, [id]);
}

export function parseTags(value: string | null): string[] {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export type ItemSearchResult = Ranked<Item>;

export function searchItemsByEmbedding(
  queryEmbedding: number[],
  containerId?: number,
  limit = 20
): ItemSearchResult[] {
  const items =
    typeof containerId === 'number'
      ? (db.getAllSync(`SELECT * FROM items WHERE container_id = ?`, [containerId]) as Item[])
      : (db.getAllSync(`SELECT * FROM items`) as Item[]);

  return rankBySimilarity(items, queryEmbedding, (item) => item.embedding, { limit });
}

export type ContainerSearchResult = Ranked<Container>;

export function searchContainersByEmbedding(
  queryEmbedding: number[],
  limit = 20
): ContainerSearchResult[] {
  const containers = db.getAllSync(`SELECT * FROM containers`) as Container[];

  return rankBySimilarity(containers, queryEmbedding, (c) => c.embedding, { limit });
}

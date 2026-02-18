
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
  image_uri: string;
  container_id: number | null;
  embedding: string | null;
  created_at: string;
};



/**
 * Initialize database tables
 */
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
      image_uri TEXT NOT NULL,
      container_id INTEGER,
      embedding TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (container_id) REFERENCES containers (id)
    );
  `);
}

/**
 * Insert a new item
 */
export function insertItem(
  name: string,
  imageUri: string,
  containerId: number | null,
  embedding: number[] | null
) {
  db.runSync(
    `INSERT INTO items (name, image_uri, container_id, embedding)
     VALUES (?, ?, ?, ?)`,
    [
      name,
      imageUri,
      containerId,
      embedding ? JSON.stringify(embedding) : null
    ]
  );
}

/**
 * Get all items
 */
export function getAllItems() {
  return db.getAllSync(`SELECT * FROM items ORDER BY created_at DESC`);
}

/**
 * Get items by container
 */
export function getItemsByContainer(containerId: number): Item[] {
  return db.getAllSync(
    `SELECT * FROM items WHERE container_id = ?`,
    [containerId]
  ) as Item[];
}


/**
 * Insert a new container
 */
export function insertContainer(
  name: string,
  imageUri: string | null,
  embedding: number[] | null
) {
  db.runSync(
    `INSERT INTO containers (name, image_uri, embedding)
     VALUES (?, ?, ?)`,
    [
      name,
      imageUri,
      embedding ? JSON.stringify(embedding) : null
    ]
  );
}
/**
 * Get all containers
 */
export function getAllContainers() {
  return db.getAllSync(
    `SELECT * FROM containers ORDER BY id DESC`
  );

}

export function getContainerById(id: number): Container | null {
  return db.getFirstSync(
    `SELECT * FROM containers WHERE id = ?`,
    [id]
  ) as Container | null;
}

export function deleteContainer(id: number) {
  db.runSync(
    `DELETE FROM containers WHERE id = ?`,
    [id]
  );
}

export function generateFakeEmbedding() {
  return Array.from({ length: 128 }, () => Math.random());
}



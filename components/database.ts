
// components/database.ts
import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('scim.db');

export type Container = {
  id: number;
  name: string;
};

export type Item = {
  id: number;
  name: string;
  image_uri: string;
  container_id: number | null;
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
      image_uri TEXT NOT NULL
      
    );

    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      image_uri TEXT NOT NULL,
      container_id INTEGER,
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
  containerId: number | null
) {
  db.runSync(
    `INSERT INTO items (name, image_uri, container_id) VALUES (?, ?, ?)`,
    [name, imageUri, containerId]
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
export function insertContainer(name: string) {
  db.runSync(`INSERT INTO containers (name) VALUES (?)`,
     [name]
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


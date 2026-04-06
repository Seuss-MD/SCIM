import { File } from 'expo-file-system';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { deleteObject, ref } from 'firebase/storage';

import { auth, db, storage } from '../firebase';
import {
  deleteContainer,
  deleteItem,
  getItemsByContainer,
  type Container,
  type Item,
} from './database';

async function deleteLocalFileIfExists(uri: string | null | undefined) {
  if (!uri) return;

  if (uri.startsWith('http://') || uri.startsWith('https://')) {
    return;
  }

  try {
    const file = new File(uri);
    const info = await file.info();

    if (info.exists) {
      await file.delete();
    }
  } catch (error) {
    console.warn('Local file cleanup failed:', error);
  }
}

async function deleteCloudFileIfExists(storagePath: string | null | undefined) {
  if (!storagePath) return;

  try {
    await deleteObject(ref(storage, storagePath));
  } catch (error: any) {
    if (error?.code !== 'storage/object-not-found') {
      throw error;
    }
  }
}

async function deleteItemRecordEverywhere(
  item: Item,
  workspaceId: string | null
) {
  if (workspaceId && item.cloud_id) {
    const cloudItemRef = doc(db, 'workspaces', workspaceId, 'items', item.cloud_id);
    const cloudItemSnap = await getDoc(cloudItemRef);

    if (cloudItemSnap.exists()) {
      const cloudData = cloudItemSnap.data();

      const imageStoragePath =
        typeof cloudData.image_storage_path === 'string'
          ? cloudData.image_storage_path
          : null;

      await deleteCloudFileIfExists(imageStoragePath);
      await deleteDoc(cloudItemRef);
    }
  }

  await deleteLocalFileIfExists(item.image_uri);
  deleteItem(item.id);
}

async function deleteUnknownCloudItemsForContainer(
  containerCloudId: string,
  workspaceId: string,
  knownLocalCloudItemIds: Set<string>
) {
  const cloudItemsSnap = await getDocs(
    query(
      collection(db, 'workspaces', workspaceId, 'items'),
      where('container_id', '==', containerCloudId)
    )
  );

  for (const cloudItemDoc of cloudItemsSnap.docs) {
    if (knownLocalCloudItemIds.has(cloudItemDoc.id)) {
      continue;
    }

    const cloudData = cloudItemDoc.data();

    const imageStoragePath =
      typeof cloudData.image_storage_path === 'string'
        ? cloudData.image_storage_path
        : null;

    await deleteCloudFileIfExists(imageStoragePath);
    await deleteDoc(cloudItemDoc.ref);
  }
}

export async function deleteItemEverywhere(item: Item) {
  const workspaceId = auth.currentUser?.uid ?? null;

  if (item.cloud_id && !workspaceId) {
    throw new Error('Sign in before deleting a synced item.');
  }

  await deleteItemRecordEverywhere(item, workspaceId);
}

export async function deleteContainerItemEverywhere(item: Item) {
  const workspaceId = auth.currentUser?.uid ?? null;
  await deleteItemRecordEverywhere(item, workspaceId);
}

export async function deleteContainerEverywhere(container: Container) {
  const workspaceId = auth.currentUser?.uid ?? null;

  if (container.cloud_id && !workspaceId) {
    throw new Error('Sign in before deleting a synced container.');
  }

  const localItems = getItemsByContainer(container.id);
  const knownLocalCloudItemIds = new Set(
    localItems
      .map((item) => item.cloud_id)
      .filter((cloudId): cloudId is string => !!cloudId)
  );

  for (const item of localItems) {
    await deleteItemRecordEverywhere(item, workspaceId);
  }

  if (workspaceId && container.cloud_id) {
    await deleteUnknownCloudItemsForContainer(
      container.cloud_id,
      workspaceId,
      knownLocalCloudItemIds
    );

    const cloudContainerRef = doc(
      db,
      'workspaces',
      workspaceId,
      'containers',
      container.cloud_id
    );

    const cloudContainerSnap = await getDoc(cloudContainerRef);

    if (cloudContainerSnap.exists()) {
      const cloudData = cloudContainerSnap.data();

      const imageStoragePath =
        typeof cloudData.image_storage_path === 'string'
          ? cloudData.image_storage_path
          : null;

      await deleteCloudFileIfExists(imageStoragePath);
      await deleteDoc(cloudContainerRef);
    }
  }

  await deleteLocalFileIfExists(container.image_uri);
  deleteContainer(container.id);
}
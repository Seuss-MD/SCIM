import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import {
  getDownloadURL,
  ref,
  uploadBytes,
} from 'firebase/storage';

import { auth, db, storage } from '../firebase';
import {
  getAllContainers,
  getAllItems,
  getContainerByCloudId,
  getContainerById,
  getItemByCloudId,
  insertContainer,
  insertItem,
  parseTags,
  setContainerCloudSync,
  setItemCloudSync,
} from './database';

type CreateCloudContainerInput = {
  workspaceId?: string;
  name: string;
  imageUrl?: string | null;
  localImageUri?: string | null;
  embedding?: number[] | null;
};

type CreateCloudItemInput = {
  workspaceId?: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  localImageUri?: string | null;
  containerId?: string | null;
  embedding?: number[] | null;
  tags?: string[];
};

export type SyncResult = {
  workspaceId: string;
  pushedContainers: number;
  pushedItems: number;
  pulledContainers: number;
  pulledItems: number;
};

function parseEmbeddingString(value: string | null): number[] | null {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function normalizeEmbedding(value: unknown): number[] | null {
  return Array.isArray(value) ? (value as number[]) : null;
}

function normalizeTags(value: unknown): string[] {
  return Array.isArray(value) ? (value as string[]) : [];
}

async function requireUid(): Promise<string> {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    throw new Error('You must be signed in to sync.');
  }
  return uid;
}

export async function ensurePersonalWorkspace(): Promise<string> {
  const uid = await requireUid();

  const workspaceRef = doc(db, 'workspaces', uid);
  const memberRef = doc(db, 'workspaces', uid, 'members', uid);
  const workspaceSnap = await getDoc(workspaceRef);

  if (!workspaceSnap.exists()) {
    await setDoc(workspaceRef, {
      id: uid,
      name: 'My SCIM',
      owner_uid: uid,
      created_by: uid,
      updated_by: uid,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
  }

  await setDoc(
    memberRef,
    {
      uid,
      role: 'owner',
      joined_at: serverTimestamp(),
      created_by: uid,
      updated_by: uid,
    },
    { merge: true }
  );

  return uid;
}

async function resolveWorkspaceId(workspaceId?: string): Promise<string> {
  if (workspaceId) return workspaceId;
  return ensurePersonalWorkspace();
}

async function uploadLocalImage(
  workspaceId: string,
  collectionName: 'containers' | 'items',
  entityId: string,
  localImageUri: string
): Promise<{ image_uri: string; image_storage_path: string }> {
  const response = await fetch(localImageUri);
  const blob = await response.blob();

  const path =
    collectionName === 'containers'
      ? `workspaces/${workspaceId}/containers/${entityId}/cover.jpg`
      : `workspaces/${workspaceId}/items/${entityId}/photo.jpg`;

  const storageRef = ref(storage, path);

  await uploadBytes(storageRef, blob, {
    contentType: 'image/jpeg',
  });

  const downloadUrl = await getDownloadURL(storageRef);

  return {
    image_uri: downloadUrl,
    image_storage_path: path,
  };
}

async function resolveCloudImage(
  workspaceId: string,
  collectionName: 'containers' | 'items',
  entityId: string,
  imageUrl?: string | null,
  localImageUri?: string | null
): Promise<{ image_uri: string | null; image_storage_path: string | null }> {
  if (imageUrl) {
    return {
      image_uri: imageUrl,
      image_storage_path: null,
    };
  }

  if (localImageUri) {
    if (localImageUri.startsWith('http://') || localImageUri.startsWith('https://')) {
      return {
        image_uri: localImageUri,
        image_storage_path: null,
      };
    }

    return uploadLocalImage(workspaceId, collectionName, entityId, localImageUri);
  }

  return {
    image_uri: null,
    image_storage_path: null,
  };
}

export async function createCloudContainer(input: CreateCloudContainerInput) {
  const uid = await requireUid();
  const workspaceId = await resolveWorkspaceId(input.workspaceId);

  const containerRef = doc(collection(db, 'workspaces', workspaceId, 'containers'));

  const image = await resolveCloudImage(
    workspaceId,
    'containers',
    containerRef.id,
    input.imageUrl,
    input.localImageUri
  );

  await setDoc(containerRef, {
    id: containerRef.id,
    name: input.name,
    image_uri: image.image_uri,
    image_storage_path: image.image_storage_path,
    embedding: input.embedding ?? null,
    created_by: uid,
    updated_by: uid,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });

  return {
    id: containerRef.id,
    workspaceId,
  };
}

export async function createCloudItem(input: CreateCloudItemInput) {
  const uid = await requireUid();
  const workspaceId = await resolveWorkspaceId(input.workspaceId);

  const itemRef = doc(collection(db, 'workspaces', workspaceId, 'items'));

  const image = await resolveCloudImage(
    workspaceId,
    'items',
    itemRef.id,
    input.imageUrl,
    input.localImageUri
  );

  await setDoc(itemRef, {
    id: itemRef.id,
    name: input.name,
    description: input.description ?? null,
    image_uri: image.image_uri,
    image_storage_path: image.image_storage_path,
    container_id: input.containerId ?? null,
    embedding: input.embedding ?? null,
    tags: input.tags ?? [],
    created_by: uid,
    updated_by: uid,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });

  return {
    id: itemRef.id,
    workspaceId,
  };
}

export async function syncMissingData(workspaceId?: string): Promise<SyncResult> {
  const resolvedWorkspaceId = await resolveWorkspaceId(workspaceId);

  const result: SyncResult = {
    workspaceId: resolvedWorkspaceId,
    pushedContainers: 0,
    pushedItems: 0,
    pulledContainers: 0,
    pulledItems: 0,
  };

  const localContainers = getAllContainers();

  for (const container of localContainers) {
    if (container.cloud_id) continue;

    const cloud = await createCloudContainer({
      workspaceId: resolvedWorkspaceId,
      name: container.name,
      imageUrl:
        container.image_uri?.startsWith('http://') || container.image_uri?.startsWith('https://')
          ? container.image_uri
          : null,
      localImageUri:
        container.image_uri?.startsWith('http://') || container.image_uri?.startsWith('https://')
          ? null
          : container.image_uri,
      embedding: parseEmbeddingString(container.embedding),
    });

    setContainerCloudSync(container.id, cloud.id, auth.currentUser?.uid ?? null);
    result.pushedContainers += 1;
  }

  const localContainersAfterPush = getAllContainers();
  const localContainerById = new Map(localContainersAfterPush.map((container) => [container.id, container]));
  const localContainerByCloudId = new Map(
    localContainersAfterPush
      .filter((container) => !!container.cloud_id)
      .map((container) => [container.cloud_id as string, container])
  );

  const localItems = getAllItems();

  for (const item of localItems) {
    if (item.cloud_id) continue;

    const containerCloudId =
      typeof item.container_id === 'number'
        ? localContainerById.get(item.container_id)?.cloud_id ?? null
        : null;

    const cloud = await createCloudItem({
      workspaceId: resolvedWorkspaceId,
      name: item.name ?? 'Untitled item',
      description: item.description ?? null,
      imageUrl:
        item.image_uri?.startsWith('http://') || item.image_uri?.startsWith('https://')
          ? item.image_uri
          : null,
      localImageUri:
        item.image_uri?.startsWith('http://') || item.image_uri?.startsWith('https://')
          ? null
          : item.image_uri,
      containerId: containerCloudId,
      embedding: parseEmbeddingString(item.embedding),
      tags: parseTags(item.tags),
    });

    setItemCloudSync(item.id, cloud.id, containerCloudId, auth.currentUser?.uid ?? null);
    result.pushedItems += 1;
  }

  const cloudContainersSnap = await getDocs(
    collection(db, 'workspaces', resolvedWorkspaceId, 'containers')
  );

  for (const cloudDoc of cloudContainersSnap.docs) {
    if (getContainerByCloudId(cloudDoc.id)) continue;

    const data = cloudDoc.data();

    insertContainer(
      typeof data.name === 'string' ? data.name : 'Untitled container',
      typeof data.image_uri === 'string' ? data.image_uri : null,
      normalizeEmbedding(data.embedding),
      {
        cloudId: cloudDoc.id,
        createdBy: typeof data.created_by === 'string' ? data.created_by : null,
        updatedBy: typeof data.updated_by === 'string' ? data.updated_by : null,
      }
    );

    result.pulledContainers += 1;
  }

  const localContainersAfterPull = getAllContainers();
  const refreshedContainerByCloudId = new Map(
    localContainersAfterPull
      .filter((container) => !!container.cloud_id)
      .map((container) => [container.cloud_id as string, container])
  );

  const cloudItemsSnap = await getDocs(
    collection(db, 'workspaces', resolvedWorkspaceId, 'items')
  );

  for (const cloudDoc of cloudItemsSnap.docs) {
    if (getItemByCloudId(cloudDoc.id)) continue;

    const data = cloudDoc.data();

    const containerCloudId =
      typeof data.container_id === 'string' ? data.container_id : null;

    const localContainerId =
      containerCloudId && refreshedContainerByCloudId.has(containerCloudId)
        ? refreshedContainerByCloudId.get(containerCloudId)?.id ?? null
        : null;

    insertItem(
      typeof data.name === 'string' ? data.name : 'Untitled item',
      typeof data.description === 'string' ? data.description : null,
      typeof data.image_uri === 'string' ? data.image_uri : '',
      localContainerId,
      normalizeEmbedding(data.embedding),
      normalizeTags(data.tags),
      {
        cloudId: cloudDoc.id,
        containerCloudId,
        createdBy: typeof data.created_by === 'string' ? data.created_by : null,
        updatedBy: typeof data.updated_by === 'string' ? data.updated_by : null,
      }
    );

    result.pulledItems += 1;
  }

  return result;
}
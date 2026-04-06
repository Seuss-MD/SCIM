import * as FileSystem from 'expo-file-system';
import { deleteDoc, doc, getDoc } from 'firebase/firestore';
import { deleteObject, ref } from 'firebase/storage';

import { auth, db, storage } from '../firebase';
import { deleteItem as deleteLocalItem, type Item } from './database';

type GroupRole = 'owner' | 'admin' | 'member' | null;

type DeletePermission = {
  uid: string;
  groupId: string | null;
  groupRole: GroupRole;
  isInGroup: boolean;
  canDeleteSyncedItems: boolean;
};

async function getDeletePermission(): Promise<DeletePermission> {
  const uid = auth.currentUser?.uid;

  if (!uid) {
    throw new Error('You must be signed in.');
  }

  const userSnap = await getDoc(doc(db, 'users', uid));
  const userData = userSnap.data();

  const groupId =
    typeof userData?.groupId === 'string' && userData.groupId.trim()
      ? userData.groupId
      : null;

  if (!groupId) {
    return {
      uid,
      groupId: null,
      groupRole: null,
      isInGroup: false,
      canDeleteSyncedItems: true,
    };
  }

  const groupSnap = await getDoc(doc(db, 'groups', groupId));
  const memberSnap = await getDoc(doc(db, 'groups', groupId, 'members', uid));

  const ownerId =
    typeof groupSnap.data()?.ownerId === 'string' ? groupSnap.data()?.ownerId : null;

  const groupRole =
    typeof memberSnap.data()?.role === 'string'
      ? (memberSnap.data()?.role as GroupRole)
      : null;

  const isOwner = groupRole === 'owner' || ownerId === uid;

  return {
    uid,
    groupId,
    groupRole,
    isInGroup: true,
    canDeleteSyncedItems: isOwner,
  };
}

export async function canCurrentUserPermanentlyDeleteSyncedItems(): Promise<boolean> {
  const permission = await getDeletePermission();
  return permission.canDeleteSyncedItems;
}

async function deleteLocalImageIfNeeded(uri?: string | null) {
  if (!uri) return;
  if (uri.startsWith('http://') || uri.startsWith('https://')) return;

  try {
    const info = await FileSystem.getInfoAsync(uri);

    if (info.exists) {
      await FileSystem.deleteAsync(uri, { idempotent: true });
    }
  } catch (error) {
    console.warn('Could not delete local image file:', error);
  }
}

type CloudItemLocation = {
  workspaceId: string;
  imageStoragePath: string | null;
};

async function findCloudItemLocation(
  cloudId: string,
  candidateWorkspaceIds: string[]
): Promise<CloudItemLocation | null> {
  for (const workspaceId of candidateWorkspaceIds) {
    const itemSnap = await getDoc(doc(db, 'workspaces', workspaceId, 'items', cloudId));

    if (!itemSnap.exists()) continue;

    const data = itemSnap.data();

    return {
      workspaceId,
      imageStoragePath:
        typeof data.image_storage_path === 'string' ? data.image_storage_path : null,
    };
  }

  return null;
}

export async function permanentlyDeleteItemEverywhere(
  item: Pick<Item, 'id' | 'cloud_id' | 'image_uri'>
): Promise<void> {
  if (!item.cloud_id) {
    await deleteLocalImageIfNeeded(item.image_uri);
    deleteLocalItem(item.id);
    return;
  }

  const permission = await getDeletePermission();

  if (!permission.canDeleteSyncedItems) {
    throw new Error('Only the group owner can permanently delete synced items.');
  }

  const candidateWorkspaceIds = Array.from(
    new Set(
      [permission.groupId, permission.uid].filter(
        (value): value is string => typeof value === 'string' && value.length > 0
      )
    )
  );

  const cloudLocation = await findCloudItemLocation(item.cloud_id, candidateWorkspaceIds);

  if (cloudLocation?.imageStoragePath) {
    try {
      await deleteObject(ref(storage, cloudLocation.imageStoragePath));
    } catch (error: any) {
      if (error?.code !== 'storage/object-not-found') {
        throw error;
      }
    }
  }

  if (cloudLocation) {
    await deleteDoc(doc(db, 'workspaces', cloudLocation.workspaceId, 'items', item.cloud_id));
  }

  await deleteLocalImageIfNeeded(item.image_uri);
  deleteLocalItem(item.id);
}
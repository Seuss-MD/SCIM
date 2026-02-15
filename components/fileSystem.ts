// components/fileSystem.ts
import { Directory, File, Paths } from 'expo-file-system';

/**
 * Ensure the SCIM folder exists in documentDirectory.
 */
export async function ensureScimFolder(): Promise<Directory> {
  const folder = new Directory(Paths.document, 'scim');
  const info = await folder.info();

  if (!info.exists) {
    await folder.create({ intermediates: true });
  }

  return folder;
}

/**
 * Save a temporary photo URI into the SCIM folder.
 */
export async function savePhotoToScimFolder(tempUri: string): Promise<File> {
  const folder = await ensureScimFolder();
  const fileName = `photo_${Date.now()}.jpg`;
  const photoFile = new File(folder, fileName);

  // Copy contents from temp URI
  const tempFile = new File(tempUri);
  await tempFile.copy(photoFile);

  return photoFile;
}

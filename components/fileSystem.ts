import { Directory, File, Paths } from "expo-file-system";
import * as FileSystem from "expo-file-system";
import * as ImageManipulator from "expo-image-manipulator";

/**
 * Ensure the SCIM folder exists in documentDirectory.
 */
export async function ensureScimFolder(): Promise<Directory> {
  const folder = new Directory(Paths.document, "scim");
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

  const tempFile = new File(tempUri);
  await tempFile.copy(photoFile);

  return photoFile;
}



/**
 * Compress image before sending to AI
 */
export async function compressImageForAI(
  uri: string,
  maxWidth = 1024,
  compress = 0.6
): Promise<string> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: maxWidth } }],
    {
      compress,
      format: ImageManipulator.SaveFormat.JPEG,
    }
  );

  return result.uri;
}
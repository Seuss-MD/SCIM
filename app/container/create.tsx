import { useState } from 'react';
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import ScimCamera from '@/components/ScimCam';

import { insertContainer } from '@/components/database';
import { savePhotoToScimFolder } from '@/components/fileSystem';
import { generateEmbeddingFromImage } from '@/components/aiTools';

export default function CreateContainer() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [photo, setPhoto] = useState<{ uri: string } | null>(null);
  const [showCamera, setShowCamera] = useState(false);

  async function handleCreate() {
    if (!name.trim()) return;

    if (!photo?.uri) {
      Alert.alert('Missing Image', 'Please take a picture first.');
      return;
    }

    try {
      const savedFile = await savePhotoToScimFolder(photo.uri);

      const { embedding } = await generateEmbeddingFromImage(savedFile.uri);

      insertContainer(name.trim(), savedFile.uri, embedding);

      router.back();
    } catch (error: any) {
      console.error('Failed to create container:', error);
      console.error('message:', error?.message);
      Alert.alert('Error', error?.message ?? 'Failed to save container.');
    }
  }

  if (showCamera) {
    return (
      <ScimCamera
        onPhotoTaken={(newPhoto) => {
          setPhoto(newPhoto);
          setShowCamera(false);
        }}
        onCancel={() => setShowCamera(false)}
      />
    );
  }

  return (
    <ThemedView style={styles.container}>
      <TextInput
        placeholder="Container name"
        value={name}
        onChangeText={setName}
        style={styles.input}
      />

      <TouchableOpacity
        style={styles.imageButton}
        onPress={() => setShowCamera(true)}
      >
        <ThemedText style={{ color: 'white' }}>
          Take Photo
        </ThemedText>
      </TouchableOpacity>

      {photo && (
        <Image
          source={{ uri: photo.uri }}
          style={styles.preview}
        />
      )}

      <TouchableOpacity
        style={styles.createButton}
        onPress={handleCreate}
      >
        <ThemedText style={styles.createText}>
          Create Container
        </ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    gap: 20,
  },

  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#fff',
  },

  imageButton: {
    backgroundColor: '#2563EB',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },

  preview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },

  createButton: {
    backgroundColor: '#16A34A',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },

  createText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});
import { useState } from 'react';
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Picker } from '@react-native-picker/picker';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import ScimCamera from '@/components/ScimCam';

import { insertItem } from '@/components/database';
import { savePhotoToScimFolder } from '@/components/fileSystem';
import { generateEmbeddingFromImage } from '@/components/aiTools';

export default function CreateItem() {
  const router = useRouter();
  const { containerId } = useLocalSearchParams();

  const [name, setName] = useState('');
  const [photo, setPhoto] = useState<{ uri: string } | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [value, setValue] = useState<string | null>(null);
  const [itemData, setItemData] = useState<{ label: string }[]>([]);

  async function handleCreate() {
    const finalName = name.trim();
    const parsedContainerId = Array.isArray(containerId)
      ? Number(containerId[0])
      : Number(containerId);

    if (!finalName) {
      Alert.alert('Missing name', 'Please enter an item name.');
      return;
    }

    if (!photo?.uri) {
      Alert.alert('Missing Image', 'Please take a picture first.');
      return;
    }

    if (!containerId || Number.isNaN(parsedContainerId)) {
      Alert.alert('Error', 'Missing or invalid container ID.');
      return;
    }

    try {
      const savedFile = await savePhotoToScimFolder(photo.uri);

      const { description, embedding } = await generateEmbeddingFromImage(
        savedFile.uri
      );

      insertItem(
        finalName || description,
        savedFile.uri,
        parsedContainerId,
        embedding
      );

      router.back();
    } catch (error: any) {
      console.error('Failed to create item:', error);
      console.error('message:', error?.message);
      Alert.alert('Error', error?.message ?? 'Failed to save item.');
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
        placeholder="Item name"
        value={name}
        onChangeText={setName}
        style={styles.input}
      />

      <Picker
        selectedValue={value}
        onValueChange={(itemValue) => setValue(itemValue)}
        style={styles.picker}
      >
        {itemData.map((item, index) => (
          <Picker.Item
            key={index}
            label={item.label}
            value={item.label}
          />
        ))}
      </Picker>

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
          Create Item
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

  picker: {
    height: 50,
    width: '100%',
  },
});
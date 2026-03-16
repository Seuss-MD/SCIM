//app/container/create.tsx
import { useRef, useState } from 'react';
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  CameraView,
  useCameraPermissions,
} from 'expo-camera';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { insertContainer } from '@/components/database';
import { savePhotoToScimFolder } from '@/components/fileSystem';
import { generateEmbeddingFromText } from '@/components/aiTools';

export default function CreateContainer() {
  const router = useRouter();

  const [name, setName] = useState('');

  const [photo, setPhoto] = useState<{ uri: string } | null>(null);
  const [flash, setFlash] = useState<'off' | 'on'>('off');
  const [showCamera, setShowCamera] = useState(false);
  const cameraRef = useRef<CameraView | null>(null);
  const [zoom, setZoom] = useState(0);

  const [description, setDescription] = useState('');

  const [permission, requestPermission] = useCameraPermissions();

  const handleTakePhoto = async () => {
    if (!cameraRef.current) return;

    const photoData = await cameraRef.current.takePictureAsync({
      quality: 1,
      base64: false,
      exif: false,
      shutterSound: false,

    });

    if (!photoData?.uri) return;

    setPhoto({ uri: photoData.uri });
    setShowCamera(false);
  };

  async function handleCreate() 
    {
      if (!name.trim()) 
      {
        Alert.alert('Missing Name', 'Please enter a name for the container.');
        return;
      }

      if (!photo?.uri) 
      {
        Alert.alert('Missing Image', 'Please take a picture first.');
        return;
      }


      try {
        const savedFile = await savePhotoToScimFolder(photo.uri);

        const embedding = await generateEmbeddingFromText(name.trim());

        insertContainer(
          name.trim(),
          savedFile.uri,
          embedding
        );

        router.back();
      } catch (error) {
        console.error('Failed to create container:', error);
        Alert.alert('Error', 'Failed to save container.');
      }
    }

  // Permission loading
  if (!permission) return <View />;

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <ThemedText>
          We need camera permission
        </ThemedText>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={requestPermission}
        >
          <ThemedText style={{ color: 'white' }}>
            Grant Permission
          </ThemedText>
        </TouchableOpacity>
      </View>
    );
  }

  // If camera active
  if (showCamera) {
    return (
      <View style={{ flex: 1 }}>
        <CameraView
          style={{ flex: 1 }}
          facing={'back'}
          ref={cameraRef}
          flash={flash}
          zoom={zoom}
        />

        <View style={styles.cameraControls}>

          <TouchableOpacity
            style={styles.smallButton}
            onPress={() => setFlash(flash === 'off' ? 'on' : 'off')
            }
          >
            <ThemedText style={{ color: 'white' }}>
              {flash === 'off' ? 'Flash Off' : 'Flash On'}
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.captureButton}
            onPress={handleTakePhoto}
          />
        </View>
      </View>
    );
  }

  // Normal create screen
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

  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },

  permissionButton: {
    backgroundColor: '#4F46E5',
    padding: 14,
    borderRadius: 10,
  },

  cameraControls: {
    position: 'absolute',
    bottom: 50,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  smallButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
  },

  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'white',
  },
});

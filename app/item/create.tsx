import { useRef, useState } from 'react';
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  CameraView,
  useCameraPermissions,
} from 'expo-camera';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { insertItem, generateFakeEmbedding } from '@/components/database';
import { savePhotoToScimFolder } from '@/components/fileSystem';
import { Picker } from '@react-native-picker/picker';

export default function CreateItem() {
  const router = useRouter();
  const { containerId } = useLocalSearchParams();
  const [name, setName] = useState('');

  const [photo, setPhoto] = useState<{ uri: string } | null>(null);
  const [flash, setFlash] = useState<'off' | 'on'>('off');
  const [showCamera, setShowCamera] = useState(false);
  const [value, setValue] = useState<string | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView | null>(null);
  const [itemData, setItemData] = useState<{ label: string }[]>([]);


  const handleTakePhoto = async () => {
    if (!cameraRef.current) return;

    try {
      const photoData = await cameraRef.current.takePictureAsync({
        quality: 1,
        base64: false,
        exif: false,
        shutterSound: false,
      });

      if (!photoData?.uri) return;

      setPhoto({ uri: photoData.uri });


      setShowCamera(false);
    } catch (error: any) {
      console.error('identifyItemsInImage failed:', error);
      Alert.alert(
        'Image analysis failed',
        error?.message ?? 'Could not analyze the image.'
      );
      setShowCamera(false);
    }
  };
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
    console.log('photo uri:', photo.uri);
    console.log('parsedContainerId:', parsedContainerId);

    const savedFile = await savePhotoToScimFolder(photo.uri);
    console.log('saved file:', savedFile);

    const embedding = generateFakeEmbedding();
    console.log('embedding:', embedding);

    await insertItem(
      finalName,
      savedFile.uri,
      parsedContainerId,
      embedding,
    );

    router.back();
  } catch (error: any) {
    console.error('Failed to create item:', error);
    console.error('message:', error?.message);
    Alert.alert(
      'Error',
      error?.message ?? 'Failed to save item.'
    );
  }
}

  if (!permission) return <View />;

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <ThemedText>We need camera permission</ThemedText>
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

  if (showCamera) {
    return (
      <View style={{ flex: 1 }}>
        <CameraView
          style={{ flex: 1 }}
          facing="back"
          ref={cameraRef}
          flash={flash}
        />

        <View style={styles.cameraControls}>
          <TouchableOpacity
            style={styles.smallButton}
            onPress={() =>
              setFlash(flash === 'off' ? 'on' : 'off')
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
          <Picker.Item key={index} label={item.label} value={item.label} />
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

import { useEffect, useRef, useState } from 'react';
import {
  BackHandler,
  Platform,
  TouchableOpacity,
  View,
  StyleSheet,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';

type ScimCameraProps = {
  onPhotoTaken: (photo: { uri: string }) => void;
  onCancel: () => void;
};

export default function ScimCamera({
  onPhotoTaken,
  onCancel,
}: ScimCameraProps) {
  const cameraRef = useRef<CameraView | null>(null);
  const [flash, setFlash] = useState<'off' | 'on'>('off');
  const [permission, requestPermission] = useCameraPermissions();

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        onCancel();
        return true;
      }
    );

    return () => subscription.remove();
  }, [onCancel]);

  const handleTakePhoto = async () => {
    if (!cameraRef.current) return;

    const photoData = await cameraRef.current.takePictureAsync({
      quality: 1,
      base64: false,
      exif: false,
      shutterSound: false,
    });

    if (!photoData?.uri) return;

    onPhotoTaken({ uri: photoData.uri });
  };

  if (!permission) {
    return <View style={{ flex: 1 }} />;
  }

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

        <TouchableOpacity
          style={styles.backButton}
          onPress={onCancel}
        >
          <ThemedText style={{ color: 'white' }}>
            Back
          </ThemedText>
        </TouchableOpacity>
      </View>
    );
  }

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
          style={styles.iconButton}
          onPress={() => setFlash(flash === 'off' ? 'on' : 'off')}
        >
          <MaterialCommunityIcons
            name={flash === 'off' ? 'flash-off' : 'flash'}
            size={24}
            color="white"
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.captureButton}
          onPress={handleTakePhoto}
        />

        <TouchableOpacity
          style={styles.iconButton}
          onPress={onCancel}
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={24}
            color="white"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    padding: 20,
  },

  permissionButton: {
    backgroundColor: '#4F46E5',
    padding: 14,
    borderRadius: 10,
  },

  backButton: {
    backgroundColor: '#6B7280',
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

  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'white',
  },
});
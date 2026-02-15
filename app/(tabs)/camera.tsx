// camera.tsx
import PhotoPreviewSection from '@/components/PhotoPreviewSection';
import { AntDesign } from '@expo/vector-icons';
import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import { useRef, useState } from 'react';
import { Button, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { savePhotoToScimFolder } from '@/components/fileSystem';


export default function Camera() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [photo, setPhoto] = useState<any>(null);

  const cameraRef = useRef<CameraView | null>(null);

  if (!permission) {
    // Camera permissions are still loading.
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet.
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: 'center' }}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="grant permission" />
      </View>
    );
  }

  function toggleCameraFacing() {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }

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

};

const handleSavePhoto = async () => {
  if (!photo?.uri) return;

  try {
    const savedFile = await savePhotoToScimFolder(photo.uri);
    console.log('Saved to:', savedFile.uri);
    setPhoto(null);
  } catch (error) {
    console.error('Save failed:', error);
  }
};

  const handleRetakePhoto = () => setPhoto(null);

  if (photo) return <PhotoPreviewSection 
    photo={photo} 
    handleRetakePhoto={handleRetakePhoto} 
    handleSavePhoto={handleSavePhoto} />

return (
  <View style={styles.container}>
    <CameraView style={styles.camera} facing={facing} ref={cameraRef} />

    <View style={styles.controls}>
      {/* Flip Camera Button */}
      <TouchableOpacity
        style={[styles.smallButton, { backgroundColor: '#333' }]}
        onPress={toggleCameraFacing}
      >
        <AntDesign name="retweet" size={24} color="white" />
      </TouchableOpacity>

      {/* Capture Button */}
      <TouchableOpacity
        style={styles.captureButton}
        onPress={handleTakePhoto}
      >
      </TouchableOpacity>
    </View>
  </View>
);

}
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  camera: {
    flex: 1,
  },

  controls: {
    position: 'absolute',
    bottom: 50,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },

  smallButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },

  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
  },

});

// app/item/create.tsx
import { useState } from 'react';
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  View,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import ScimCamera from '@/components/ScimCam';
import { insertItem, updateItemAiMetadata } from '@/components/database';
import { savePhotoToScimFolder } from '@/components/fileSystem';
import { generateEmbeddingFromImage } from '@/components/aiTools';
import { Colors, Radius, Spacing, Shadows } from '@/constants/theme';

export default function CreateItem() {
  const router = useRouter();
  const { containerId } = useLocalSearchParams();

  const [name, setName] = useState('');
  const [photo, setPhoto] = useState<{ uri: string } | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  async function enrichItemInBackground(itemId: number, localImageUri: string) {
    try {
      const { description, embedding } = await generateEmbeddingFromImage(localImageUri);
      updateItemAiMetadata(itemId, description, embedding);
    } catch (error: any) {
      console.error('Background AI enrichment failed:', error);
    }
  }

  async function handleCreate() {
    const finalName = name.trim();

    const rawContainerId = Array.isArray(containerId)
      ? containerId[0]
      : containerId;

    const parsedContainerId =
      rawContainerId == null || rawContainerId === ''
        ? null
        : Number(rawContainerId);

    if (!finalName) {
      Alert.alert('Missing name', 'Please enter an item name.');
      return;
    }

    if (!photo?.uri) {
      Alert.alert('Missing Image', 'Please take a picture first.');
      return;
    }

    if (parsedContainerId !== null && Number.isNaN(parsedContainerId)) {
      Alert.alert('Integration Error', 'Invalid container ID.');
      return;
    }

    try {
      setIsSaving(true);

      const savedFile = await savePhotoToScimFolder(photo.uri);

      const itemId = insertItem(
        finalName,
        null,
        savedFile.uri,
        parsedContainerId,
        null
      );

      void enrichItemInBackground(itemId, savedFile.uri);

      router.back();
    } catch (error: any) {
      console.error('Failed to create item:', error);
      Alert.alert('Error', error?.message ?? 'Failed to save item.');
      setIsSaving(false);
    }
  }

  if (showCamera) {
    return (
      <ScimCamera
        onPhotoTaken={(newPhoto: { uri: string }) => {
          setPhoto(newPhoto);
          setShowCamera(false);
        }}
        onCancel={() => setShowCamera(false)}
      />
    );
  }

  return (
    <ThemedView style={[styles.screen, { backgroundColor: theme.background }]}>
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
          },
        ]}
      >
        <View style={styles.headerBlock}>
          <ThemedText style={[styles.title, { color: theme.text }]}>
            Create Item
          </ThemedText>
          <ThemedText style={[styles.subtitle, { color: theme.textMuted }]}>
            Add a photo and name to save a new item.
          </ThemedText>
        </View>

        <TextInput
          placeholder="Item name"
          placeholderTextColor={theme.textMuted}
          value={name}
          onChangeText={setName}
          editable={!isSaving}
          style={[
            styles.input,
            {
              color: theme.text,
              borderColor: theme.border,
              backgroundColor: theme.background,
            },
          ]}
        />

        <TouchableOpacity
          onPress={() => !isSaving && setShowCamera(true)}
          activeOpacity={0.85}
          style={[
            styles.imageButton,
            {
              backgroundColor: theme.background,
              borderColor: theme.border,
              opacity: isSaving ? 0.6 : 1,
            },
          ]}
          disabled={isSaving}
        >
          <Ionicons
            name={photo ? 'camera-reverse' : 'camera'}
            size={18}
            color={theme.text}
            style={styles.buttonIcon}
          />
          <ThemedText style={[styles.imageButtonText, { color: theme.text }]}>
            {photo ? 'Retake Photo' : 'Take Photo'}
          </ThemedText>
        </TouchableOpacity>

        {photo && (
          <Image
            source={{ uri: photo.uri }}
            style={[
              styles.preview,
              {
                borderColor: theme.border,
                backgroundColor: theme.background,
              },
            ]}
            resizeMode="cover"
          />
        )}

        <TouchableOpacity
          onPress={handleCreate}
          activeOpacity={0.9}
          disabled={isSaving}
          style={[
            styles.createButton,
            {
              backgroundColor: theme.tint,
              opacity: isSaving ? 0.8 : 1,
            },
          ]}
        >
          {isSaving ? (
            <>
              <ActivityIndicator size="small" color="#fff" style={styles.buttonIcon} />
              <ThemedText style={[styles.createText, { color: '#fff' }]}>
                Saving...
              </ThemedText>
            </>
          ) : (
            <>
              <Ionicons
                name="checkmark-circle"
                size={18}
                color="#fff"
                style={styles.buttonIcon}
              />
              <ThemedText style={[styles.createText, { color: '#fff' }]}>
                Create Item
              </ThemedText>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: Spacing.xl,
  },
  card: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.xl,
    gap: Spacing.lg,
    ...Shadows.card,
  },
  headerBlock: {
    gap: 6,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  input: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: 16,
  },
  imageButton: {
    minHeight: 50,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  imageButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  preview: {
    width: '100%',
    height: 220,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  createButton: {
    minHeight: 52,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  createText: {
    fontWeight: '700',
    fontSize: 16,
  },
  buttonIcon: {
    marginRight: 8,
  },
});
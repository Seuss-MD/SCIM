import { useState } from 'react';
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  View,
  useColorScheme,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import ScimCamera from '@/components/ScimCam';

import { insertItem } from '@/components/database';
import { savePhotoToScimFolder } from '@/components/fileSystem';
import { generateEmbeddingFromImage } from '@/components/aiTools';
import { Colors, Radius, Spacing, Shadows } from '@/constants/theme';

export default function CreateItem() {
  const router = useRouter();
  const { containerId } = useLocalSearchParams();

  const [name, setName] = useState('');
  const [photo, setPhoto] = useState<{ uri: string } | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [value, setValue] = useState<string | null>(null);
  const [itemData, setItemData] = useState<{ label: string }[]>([]);

  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

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
      Alert.alert('Integration Error', 'Missing or invalid container ID.');
      return;
    }

    try {
      const savedFile = await savePhotoToScimFolder(photo.uri);
      const { description, embedding } = await generateEmbeddingFromImage(savedFile.uri);

      insertItem(
        finalName || description,
        description,
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
          placeholderTextColor={theme.textSoft}
          value={name}
          onChangeText={setName}
          style={[
            styles.input,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              color: theme.text,
            },
          ]}
        />

        <View
          style={[
            styles.pickerWrap,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
        >
          <Picker
            selectedValue={value}
            onValueChange={(itemValue) => setValue(itemValue)}
            style={[styles.picker, { color: theme.text }]}
            dropdownIconColor={theme.textMuted}
          >
            {itemData.length === 0 ? (
              <Picker.Item label="No suggestions yet" value={null} />
            ) : (
              itemData.map((item, index) => (
                <Picker.Item
                  key={index}
                  label={item.label}
                  value={item.label}
                />
              ))
            )}
          </Picker>
        </View>

        <TouchableOpacity
          style={[
            styles.imageButton,
            {
              backgroundColor: theme.secondary,
              borderColor: theme.border,
            },
          ]}
          onPress={() => setShowCamera(true)}
          activeOpacity={0.85}
        >
          <Ionicons
            name="camera-outline"
            size={18}
            color={theme.secondaryText}
            style={styles.buttonIcon}
          />
          <ThemedText style={[styles.imageButtonText, { color: theme.secondaryText }]}>
            {photo ? 'Retake Photo' : 'Take Photo'}
          </ThemedText>
        </TouchableOpacity>

        {photo && (
          <Image
            source={{ uri: photo.uri }}
            style={[
              styles.preview,
              {
                backgroundColor: theme.surfaceAlt,
                borderColor: theme.border,
              },
            ]}
          />
        )}

        <TouchableOpacity
          style={[
            styles.createButton,
            {
              backgroundColor: theme.primary,
            },
          ]}
          onPress={handleCreate}
          activeOpacity={0.85}
        >
          <Ionicons
            name="add-circle-outline"
            size={18}
            color={theme.primaryText}
            style={styles.buttonIcon}
          />
          <ThemedText style={[styles.createText, { color: theme.primaryText }]}>
            Create Item
          </ThemedText>
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
  pickerWrap: {
    borderWidth: 1,
    borderRadius: Radius.md,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  picker: {
    height: 54,
    width: '100%',
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
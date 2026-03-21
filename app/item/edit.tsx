// app/item/edit.tsx
import { useLocalSearchParams, useNavigation, useRouter, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  StyleSheet,
  Image,
  Alert,
  TouchableOpacity,
  View,
  TextInput,
} from 'react-native';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  getItemById,
  updateItem,
  getAllContainers,
  type Item,
  type Container,
} from '@/components/database';

export default function EditItemPage() {
  const params = useLocalSearchParams();
  const navigation = useNavigation();
  const router = useRouter();

  const itemId = Number(params.id);

  const [item, setItem] = useState<Item | null>(null);
  const [allContainers, setAllContainers] = useState<Container[]>([]);
  const [editedName, setEditedName] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [selectedContainerId, setSelectedContainerId] = useState<number | null>(null);

  const selectedContainer =
    selectedContainerId == null
      ? null
      : allContainers.find((c) => c.id === selectedContainerId) ?? null;

  const loadItem = useCallback(() => {
    if (!itemId) return;

    const foundItem = getItemById(itemId);
    if (!foundItem) {
      navigation.setOptions({ title: 'Item Not Found' });
      return;
    }

    const containers = getAllContainers();

    setItem(foundItem);
    setAllContainers(containers);
    setEditedName(foundItem.name ?? '');
    setEditedDescription(foundItem.description ?? '');
    navigation.setOptions({ title: `Edit ${foundItem.name || 'Item'}` });

    if (params.selectedContainerId !== undefined) {
      const raw = String(params.selectedContainerId);
      setSelectedContainerId(raw === 'none' ? null : Number(raw));
    } else {
      setSelectedContainerId(foundItem.container_id ?? null);
    }
  }, [itemId, navigation, params.selectedContainerId]);

  useFocusEffect(
    useCallback(() => {
      loadItem();
    }, [loadItem])
  );

  const handleSave = () => {
    if (!item) return;

    const trimmedName = editedName.trim();
    const trimmedDescription = editedDescription.trim();

    if (!trimmedName) {
      Alert.alert('Missing name', 'Please enter a name for the item.');
      return;
    }

    updateItem(
      item.id,
      trimmedName,
      trimmedDescription ? trimmedDescription : null,
      selectedContainerId
    );

    router.replace({
      pathname: '/item/[id]',
      params: { id: String(item.id) },
    });
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
      headerImage={
        item?.image_uri ? (
          <Image source={{ uri: item.image_uri }} style={styles.headerImage} />
        ) : undefined
      }
    >
      <ThemedView style={styles.container}>
        {item && (
          <>
            <ThemedText style={styles.label}>Name</ThemedText>
            <TextInput
              value={editedName}
              onChangeText={setEditedName}
              style={styles.input}
              placeholder="Item name"
              placeholderTextColor="#9CA3AF"
            />

            <ThemedText style={styles.label}>Description</ThemedText>
            <TextInput
              value={editedDescription}
              onChangeText={setEditedDescription}
              style={[styles.input, styles.textArea]}
              placeholder="Item description"
              placeholderTextColor="#9CA3AF"
              multiline
            />

            <ThemedText style={styles.label}>Container</ThemedText>
            <TouchableOpacity
              style={styles.infoCard}
              activeOpacity={0.8}
              onPress={() =>
                router.push({
                  pathname: '/item/select-container',
                  params: {
                    itemId: String(item.id),
                    selectedContainerId:
                      selectedContainerId == null ? 'none' : String(selectedContainerId),
                  },
                })
              }
            >
              {selectedContainer ? (
                <View style={styles.containerPreview}>
                  {selectedContainer.image_uri ? (
                    <Image
                      source={{ uri: selectedContainer.image_uri }}
                      style={styles.containerImage}
                    />
                  ) : (
                    <View
                      style={[
                        styles.containerImage,
                        styles.containerImagePlaceholder,
                      ]}
                    />
                  )}

                  <View style={styles.containerPreviewText}>
                    <ThemedText style={styles.containerName}>
                      {selectedContainer.name}
                    </ThemedText>
                    <ThemedText style={styles.containerHint}>
                      Tap to choose a different container
                    </ThemedText>
                  </View>
                </View>
              ) : (
                <View style={styles.containerPreview}>
                  <View
                    style={[
                      styles.containerImage,
                      styles.containerImagePlaceholder,
                    ]}
                  />
                  <View style={styles.containerPreviewText}>
                    <ThemedText style={styles.containerName}>
                      No Container
                    </ThemedText>
                    <ThemedText style={styles.containerHint}>
                      Tap to choose a container
                    </ThemedText>
                  </View>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <ThemedText style={styles.buttonText}>Save Changes</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
              <ThemedText style={styles.buttonText}>Cancel</ThemedText>
            </TouchableOpacity>
          </>
        )}
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
  },
  headerImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  textArea: {
    minHeight: 110,
    textAlignVertical: 'top',
  },
  infoCard: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    gap: 6,
  },
  containerPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  containerImage: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
  },
  containerImagePlaceholder: {
    opacity: 0.6,
  },
  containerPreviewText: {
    flex: 1,
    gap: 4,
  },
  containerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  containerHint: {
    fontSize: 13,
    color: '#6B7280',
  },
  saveButton: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#059669',
    alignItems: 'center',
  },
  cancelButton: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#6B7280',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});
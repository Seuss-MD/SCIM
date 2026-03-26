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
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
import { Colors, Radius, Spacing, Shadows } from '@/constants/theme';

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

  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

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
      headerBackgroundColor={{
        light: Colors.light.surfaceAlt,
        dark: Colors.dark.surfaceAlt,
      }}
      headerImage={
        item?.image_uri ? (
          <Image source={{ uri: item.image_uri }} style={styles.headerImage} />
        ) : (
          <View
            style={[
              styles.headerPlaceholder,
              { backgroundColor: theme.surfaceAlt },
            ]}
          >
            <Ionicons
              name="cube-outline"
              size={52}
              color={theme.textMuted}
            />
          </View>
        )
      }
    >
      <ThemedView
        style={[
          styles.container,
          { backgroundColor: theme.background },
        ]}
      >
        {item && (
          <>
            <ThemedText style={[styles.label, { color: theme.textMuted }]}>
              Name
            </ThemedText>
            <TextInput
              value={editedName}
              onChangeText={setEditedName}
              style={[
                styles.input,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                  color: theme.text,
                },
              ]}
              placeholder="Item name"
              placeholderTextColor={theme.textSoft}
            />

            <ThemedText style={[styles.label, { color: theme.textMuted }]}>
              Description
            </ThemedText>
            <TextInput
              value={editedDescription}
              onChangeText={setEditedDescription}
              style={[
                styles.input,
                styles.textArea,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                  color: theme.text,
                },
              ]}
              placeholder="Item description"
              placeholderTextColor={theme.textSoft}
              multiline
            />

            <ThemedText style={[styles.label, { color: theme.textMuted }]}>
              Container
            </ThemedText>
            <TouchableOpacity
              style={[
                styles.infoCard,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}
              activeOpacity={0.85}
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
                        { backgroundColor: theme.surfaceAlt },
                      ]}
                    >
                      <Ionicons
                        name="folder-open-outline"
                        size={24}
                        color={theme.textMuted}
                      />
                    </View>
                  )}

                  <View style={styles.containerPreviewText}>
                    <ThemedText style={[styles.containerName, { color: theme.text }]}>
                      {selectedContainer.name}
                    </ThemedText>
                    <ThemedText style={[styles.containerHint, { color: theme.textMuted }]}>
                      Tap to choose a different container
                    </ThemedText>
                  </View>

                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={theme.textMuted}
                  />
                </View>
              ) : (
                <View style={styles.containerPreview}>
                  <View
                    style={[
                      styles.containerImage,
                      styles.containerImagePlaceholder,
                      {
                        backgroundColor: theme.surfaceAlt,
                        alignItems: 'center',
                        justifyContent: 'center',
                      },
                    ]}
                  >
                    <Ionicons
                      name="folder-open-outline"
                      size={24}
                      color={theme.textMuted}
                    />
                  </View>

                  <View style={styles.containerPreviewText}>
                    <ThemedText style={[styles.containerName, { color: theme.text }]}>
                      No Container
                    </ThemedText>
                    <ThemedText style={[styles.containerHint, { color: theme.textMuted }]}>
                      Tap to choose a container
                    </ThemedText>
                  </View>

                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={theme.textMuted}
                  />
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.saveButton,
                { backgroundColor: theme.primary },
              ]}
              onPress={handleSave}
              activeOpacity={0.85}
            >
              <Ionicons
                name="save-outline"
                size={18}
                color={theme.primaryText}
                style={styles.buttonIcon}
              />
              <ThemedText style={[styles.buttonText, { color: theme.primaryText }]}>
                Save Changes
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.cancelButton,
                {
                  backgroundColor: theme.secondary,
                  borderColor: theme.border,
                },
              ]}
              onPress={handleCancel}
              activeOpacity={0.85}
            >
              <Ionicons
                name="close-outline"
                size={18}
                color={theme.secondaryText}
                style={styles.buttonIcon}
              />
              <ThemedText style={[styles.buttonText, { color: theme.secondaryText }]}>
                Cancel
              </ThemedText>
            </TouchableOpacity>
          </>
        )}
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
    gap: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  headerImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  headerPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
  },
  input: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  textArea: {
    minHeight: 110,
    textAlignVertical: 'top',
  },
  infoCard: {
    padding: 14,
    borderRadius: Radius.md,
    borderWidth: 1,
    gap: 6,
    ...Shadows.card,
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
  },
  containerImagePlaceholder: {
    opacity: 0.9,
  },
  containerPreviewText: {
    flex: 1,
    gap: 4,
  },
  containerName: {
    fontSize: 16,
    fontWeight: '700',
  },
  containerHint: {
    fontSize: 13,
  },
  saveButton: {
    padding: 14,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 4,
  },
  cancelButton: {
    padding: 14,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    fontWeight: '700',
    fontSize: 16,
  },
});
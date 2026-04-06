import {
  useLocalSearchParams,
  useNavigation,
  useRouter,
  useFocusEffect,
} from 'expo-router';
import { useCallback, useState } from 'react';
import {
  StyleSheet,
  View,
  Image,
  Alert,
  TouchableOpacity,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import {
  getItemsByContainer,
  getContainerById,
  type Container,
  type Item,
} from '@/components/database';
import {
  deleteContainerEverywhere,
  deleteContainerItemEverywhere,
} from '@/components/manage';
import { Colors, Radius, Spacing, Shadows } from '@/constants/theme';

export default function ContainerDetail() {
  const { id } = useLocalSearchParams();
  const navigation = useNavigation();
  const router = useRouter();

  const [container, setContainer] = useState<Container | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [isDeletingContainer, setIsDeletingContainer] = useState(false);
  const [deletingItemId, setDeletingItemId] = useState<number | null>(null);

  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  const reloadItems = useCallback((containerId: number) => {
    const data = getItemsByContainer(containerId);
    setItems(data);
  }, []);

  const handleDeleteContainer = () => {
    if (!container || isDeletingContainer) return;

    Alert.alert(
      'Delete Container',
      'This will permanently delete the container and its items from this device and the cloud.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsDeletingContainer(true);
              await deleteContainerEverywhere(container);
              router.back();
            } catch (error: any) {
              console.error('Delete container failed:', error);
              Alert.alert(
                'Delete failed',
                error?.message ?? 'Could not delete this container.'
              );
              setIsDeletingContainer(false);
            }
          },
        },
      ]
    );
  };

  const handleDeleteItem = (item: Item) => {
    if (!container || deletingItemId != null || isDeletingContainer) return;

    Alert.alert(
      'Delete Item',
      'This will permanently delete the item from this device and the cloud.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeletingItemId(item.id);
              await deleteContainerItemEverywhere(item);
              reloadItems(container.id);
            } catch (error: any) {
              console.error('Delete item failed:', error);
              Alert.alert(
                'Delete failed',
                error?.message ?? 'Could not delete this item.'
              );
            } finally {
              setDeletingItemId(null);
            }
          },
        },
      ]
    );
  };

  useFocusEffect(
    useCallback(() => {
      if (!id) return;

      const containerId = Number(id);
      const foundContainer = getContainerById(containerId);

      if (!foundContainer) {
        navigation.setOptions({ title: 'Container Not Found' });
        return;
      }

      setContainer(foundContainer);
      navigation.setOptions({ title: foundContainer.name });
      reloadItems(containerId);
    }, [id, navigation, reloadItems])
  );

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <ParallaxScrollView
        headerBackgroundColor={{
          light: Colors.light.surfaceAlt,
          dark: Colors.dark.surfaceAlt,
        }}
        headerImage={
          container?.image_uri ? (
            <Image source={{ uri: container.image_uri }} style={styles.headerImage} />
          ) : (
            <View
              style={[
                styles.headerPlaceholder,
                { backgroundColor: theme.surfaceAlt },
              ]}
            >
              <Ionicons
                name="cube-outline"
                size={56}
                color={theme.textMuted}
              />
            </View>
          )
        }
      >
        <View style={styles.content}>
          <View
            style={[
              styles.infoCard,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
          >
            <ThemedText style={[styles.containerName, { color: theme.text }]}>
              {container?.name || 'Container'}
            </ThemedText>

            <ThemedText style={[styles.itemCount, { color: theme.textMuted }]}>
              {items.length} {items.length === 1 ? 'item' : 'items'}
            </ThemedText>
          </View>

          <TouchableOpacity
            style={[
              styles.deleteButton,
              {
                backgroundColor: theme.danger,
                opacity: isDeletingContainer ? 0.75 : 1,
              },
            ]}
            onPress={handleDeleteContainer}
            activeOpacity={0.85}
            disabled={isDeletingContainer}
          >
            {isDeletingContainer ? (
              <ActivityIndicator
                size="small"
                color={theme.dangerText}
                style={styles.deleteIcon}
              />
            ) : (
              <Ionicons
                name="trash-outline"
                size={18}
                color={theme.dangerText}
                style={styles.deleteIcon}
              />
            )}

            <ThemedText style={[styles.deleteText, { color: theme.dangerText }]}>
              {isDeletingContainer ? 'Deleting...' : 'Delete Container'}
            </ThemedText>
          </TouchableOpacity>

          {items.length === 0 ? (
            <View
              style={[
                styles.emptyCard,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}
            >
              <Ionicons
                name="albums-outline"
                size={32}
                color={theme.textMuted}
              />
              <ThemedText style={[styles.emptyTitle, { color: theme.text }]}>
                No items yet
              </ThemedText>
              <ThemedText
                style={[styles.emptySubtitle, { color: theme.textMuted }]}
              >
                Tap the add button to create your first item.
              </ThemedText>
            </View>
          ) : (
            <View style={styles.gallery}>
              {items.map((item) => {
                const isDeletingThisItem = deletingItemId === item.id;

                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.imageWrapper,
                      {
                        backgroundColor: theme.surface,
                        borderColor: theme.border,
                        opacity: isDeletingThisItem ? 0.6 : 1,
                      },
                    ]}
                    activeOpacity={0.85}
                    onPress={() => router.push(`/item/${item.id}`)}
                    onLongPress={() => handleDeleteItem(item)}
                    disabled={isDeletingContainer || isDeletingThisItem}
                  >
                    {item.image_uri ? (
                      <Image source={{ uri: item.image_uri }} style={styles.image} />
                    ) : (
                      <View
                        style={[
                          styles.image,
                          styles.imagePlaceholder,
                          { backgroundColor: theme.surfaceAlt },
                        ]}
                      >
                        {isDeletingThisItem ? (
                          <ActivityIndicator size="small" color={theme.tint} />
                        ) : (
                          <Ionicons
                            name="image-outline"
                            size={24}
                            color={theme.textMuted}
                          />
                        )}
                      </View>
                    )}

                    <View style={styles.itemFooter}>
                      <ThemedText
                        style={[styles.itemName, { color: theme.text }]}
                        numberOfLines={1}
                      >
                        {item.name || 'Unnamed Item'}
                      </ThemedText>

                      <ThemedText
                        style={[styles.itemHint, { color: theme.textMuted }]}
                        numberOfLines={1}
                      >
                        {isDeletingThisItem ? 'Deleting...' : 'Tap to open • hold to delete'}
                      </ThemedText>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </ParallaxScrollView>

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.tint }]}
        activeOpacity={0.9}
        onPress={() =>
          router.push({
            pathname: '/item/create',
            params: { containerId: container?.id },
          })
        }
        disabled={isDeletingContainer}
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    gap: Spacing.md,
    paddingBottom: 120,
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
  infoCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
    ...Shadows.card,
  },
  containerName: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  itemCount: {
    fontSize: 15,
    lineHeight: 22,
  },
  deleteButton: {
    minHeight: 50,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  deleteIcon: {
    marginRight: 8,
  },
  deleteText: {
    fontWeight: '700',
    fontSize: 16,
  },
  gallery: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  imageWrapper: {
    width: '48%',
    marginBottom: 12,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    ...Shadows.card,
  },
  image: {
    width: '100%',
    aspectRatio: 1,
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemFooter: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '700',
  },
  itemHint: {
    fontSize: 12,
  },
  emptyCard: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    ...Shadows.card,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  fab: {
    position: 'absolute',
    bottom: 64,
    right: 20,
    width: 62,
    height: 62,
    borderRadius: 31,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.floating,
  },
});
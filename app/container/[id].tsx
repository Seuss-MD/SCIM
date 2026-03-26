// app/container/[id].tsx
import {
  useLocalSearchParams,
  useNavigation,
  useRouter,
  useFocusEffect,
} from 'expo-router';
import { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Image,
  Alert,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { getItemsByContainer, getContainerById, deleteContainer, deleteItem } from '@/components/database';
import { Colors, Radius, Spacing, Shadows } from '@/constants/theme';

export default function ContainerDetail() {
  const { id } = useLocalSearchParams();
  const navigation = useNavigation();
  const router = useRouter();
  const [container, setContainer] = useState<any | null>(null);
  const [items, setItems] = useState<any[]>([]);

  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  const handleDeleteContainer = () => {
    if (!container) return;

    Alert.alert(
      'Delete Container',
      'Are you sure you want to delete this container?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteContainer(container.id);
            router.back();
          },
        },
      ]
    );
  };

  const handleDeleteItem = (itemId: number) => {
    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteItem(itemId);

            if (container) {
              const updatedItems = getItemsByContainer(container.id);
              setItems(updatedItems);
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

      const data = getItemsByContainer(containerId);
      setItems(data);
    }, [id])
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
            <Image
              source={{ uri: container.image_uri }}
              style={styles.headerImage}
            />
          ) : (
            <View
              style={[
                styles.headerPlaceholder,
                { backgroundColor: theme.surfaceAlt },
              ]}
            >
              <Ionicons
                name="folder-open-outline"
                size={52}
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
              { backgroundColor: theme.danger },
            ]}
            onPress={handleDeleteContainer}
            activeOpacity={0.85}
          >
            <Ionicons
              name="trash-outline"
              size={18}
              color={theme.dangerText}
              style={styles.deleteIcon}
            />
            <ThemedText style={[styles.deleteText, { color: theme.dangerText }]}>
              Delete Container
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
                name="cube-outline"
                size={30}
                color={theme.textMuted}
              />
              <ThemedText style={[styles.emptyTitle, { color: theme.text }]}>
                No items in this container
              </ThemedText>
              <ThemedText style={[styles.emptySubtitle, { color: theme.textMuted }]}>
                Tap the add button to create your first item.
              </ThemedText>
            </View>
          ) : (
            <View style={styles.gallery}>
              {items.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.imageWrapper,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                    },
                  ]}
                  activeOpacity={0.85}
                  onPress={() => router.push(`/item/${item.id}`)}
                  onLongPress={() => handleDeleteItem(item.id)}
                >
                  <Image
                    source={{ uri: item.image_uri }}
                    style={[
                      styles.image,
                      { backgroundColor: theme.surfaceAlt },
                    ]}
                  />
                  <View style={styles.itemFooter}>
                    <ThemedText
                      numberOfLines={1}
                      style={[styles.itemName, { color: theme.text }]}
                    >
                      {item.name || 'Unnamed Item'}
                    </ThemedText>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ParallaxScrollView>

      <TouchableOpacity
        style={[
          styles.fab,
          {
            backgroundColor: theme.primary,
          },
        ]}
        activeOpacity={0.85}
        onPress={() =>
          router.push({
            pathname: '/item/create',
            params: { containerId: container?.id },
          })
        }
      >
        <Ionicons name="add" size={30} color={theme.primaryText} />
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
  itemFooter: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '700',
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
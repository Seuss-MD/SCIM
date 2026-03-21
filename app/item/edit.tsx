import { useLocalSearchParams, useNavigation, useRouter, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, Image, Alert, TouchableOpacity, View } from 'react-native';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  getItemById,
  deleteItem,
  getContainerById,
  type Item,
  type Container,
} from '@/components/database';

export default function ItemDetail() {
  const { id } = useLocalSearchParams();
  const navigation = useNavigation();
  const router = useRouter();

  const [item, setItem] = useState<Item | null>(null);
  const [container, setContainer] = useState<Container | null>(null);

  const loadItem = useCallback(() => {
    if (!id) return;

    const itemId = Number(id);
    const foundItem = getItemById(itemId);

    if (!foundItem) {
      navigation.setOptions({ title: 'Item Not Found' });
      return;
    }

    setItem(foundItem);
    navigation.setOptions({ title: foundItem.name || 'Item' });

    if (foundItem.container_id != null) {
      setContainer(getContainerById(foundItem.container_id));
    } else {
      setContainer(null);
    }
  }, [id, navigation]);

  useFocusEffect(
    useCallback(() => {
      loadItem();
    }, [loadItem])
  );

  const handleDelete = () => {
    if (!item) return;

    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteItem(item.id);
            router.back();
          },
        },
      ]
    );
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
            <ThemedText type="title">{item.name}</ThemedText>

            <View style={styles.infoCard}>
              <ThemedText style={styles.label}>Description</ThemedText>
              <ThemedText>{item.description?.trim() || 'No description available.'}</ThemedText>
            </View>

            <View style={styles.infoCard}>
              <ThemedText style={styles.label}>Container</ThemedText>
              {container ? (
                <TouchableOpacity
                  style={styles.containerPreview}
                  onPress={() => router.push(`/container/${container.id}`)}
                  activeOpacity={0.8}
                >
                  {container.image_uri ? (
                    <Image source={{ uri: container.image_uri }} style={styles.containerImage} />
                  ) : (
                    <View style={[styles.containerImage, styles.containerImagePlaceholder]} />
                  )}

                  <View style={styles.containerPreviewText}>
                    <ThemedText style={styles.linkText}>{container.name}</ThemedText>
                    <ThemedText style={styles.containerHint}>Tap to open container</ThemedText>
                  </View>
                </TouchableOpacity>
              ) : (
                <ThemedText>Not in a container</ThemedText>
              )}
            </View>

            <TouchableOpacity
              style={styles.editButton}
              onPress={() => router.push(`/item/edit/${item.id}`)}
            >
              <ThemedText style={styles.buttonText}>Edit Item</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDelete}
            >
              <ThemedText style={styles.buttonText}>Delete Item</ThemedText>
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
  infoCard: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
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
  linkText: {
    color: '#2563EB',
    fontWeight: '600',
    fontSize: 16,
  },
  containerHint: {
    fontSize: 13,
    color: '#6B7280',
  },
  editButton: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#2563EB',
    alignItems: 'center',
  },
  deleteButton: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#DC2626',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});
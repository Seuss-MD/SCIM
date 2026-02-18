// app/container/[id].tsx
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Image, Alert, TouchableOpacity } from 'react-native';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getItemsByContainer, getContainerById, deleteContainer, insertItem, generateFakeEmbedding } from '@/components/database';

export default function ContainerDetail() {
  const { id } = useLocalSearchParams();
  const navigation = useNavigation();
  const [container, setContainer] = useState<any | null>(null);
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);

  // const handleAddItem = () =>
  // {
  //   insertItem(container.id, `Item ${items.length + 1}`, generateFakeEmbedding());
  // }

  const handleDelete = () => {
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
            router.back(); // go back after delete
          },
        },
      ]
    );
  };


  useEffect(() => {
    if (!id) return;

    const containerId = Number(id);

    // Get container info
    const container = getContainerById(containerId);

    if (!container) {
      navigation.setOptions({ title: 'Container Not Found' });
      return;
    }

    setContainer(container);
    navigation.setOptions({ title: container.name });

    navigation.setOptions({ title: container.name });

    // Get items
    const data = getItemsByContainer(containerId);
    setItems(data);

  }, [id]);

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
      headerImage={
        container?.image_uri ? (
          <Image
            source={{ uri: container.image_uri }}
            style={styles.headerImage}
          />
        ) : undefined
      }
    >
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={handleDelete}
      >
        <ThemedText style={styles.deleteText}>
          Delete Container
        </ThemedText>
      </TouchableOpacity>

      <ThemedView style={styles.container}>
        {items.length === 0 && (
          <ThemedText>No items in this container.</ThemedText>
        )}


        {items.map((item) => (
          <ThemedText key={item.id}>
            {item.name}
          </ThemedText>
        ))}

        {/* <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddItem}
        >
          <ThemedText style={{ color: 'white' }}>
            Add Item
          </ThemedText>
        </TouchableOpacity> */}

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
  deleteButton: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#DC2626',
    alignItems: 'center',
  },

  deleteText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },


});

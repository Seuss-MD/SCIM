// app/container/[id].tsx
import { useLocalSearchParams, useNavigation, useRouter, useFocusEffect } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import { StyleSheet, View, Image, Alert, TouchableOpacity } from 'react-native';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getItemsByContainer, getContainerById, deleteContainer, insertItem, generateFakeEmbedding, deleteItem } from '@/components/database';

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
            router.back(); // go back after delete
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

            // reload items instead of navigating away
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
  <View style={{ flex: 1 }}>

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
        onPress={handleDeleteContainer}
      >
        <ThemedText style={styles.deleteText}>
          Delete Container
        </ThemedText>
      </TouchableOpacity>

      <View style={styles.container}>
        {items.length === 0 && (
          <ThemedText>No items in this container.</ThemedText>
        )}

        <View style={styles.gallery}>
          {items.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.imageWrapper}
              activeOpacity={0.85}
              onPress={() => router.push(`/item/${item.id}`)}
              onLongPress={() => handleDeleteItem(item.id)} 
            >
              <Image
                source={{ uri: item.image_uri }}
                style={styles.image}
              />
            </TouchableOpacity>
          ))}
        </View>

      </View>

    </ParallaxScrollView>

    {/* Floating Create Button */}
    <TouchableOpacity
      style={styles.fab}
      activeOpacity={0.8}
      onPress={() =>
        router.push({
          pathname: '/item/create',
          params: { containerId: container?.id },
        })
      }
    >
      <ThemedText style={styles.fabPlus}>＋</ThemedText>
    </TouchableOpacity>

  </View>
);

}

const styles = StyleSheet.create({
  container: {
    //padding: 16,
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

  fab: {
    position: 'absolute',
    bottom: 64,
    right: 20,
    width: 65,
    height: 65,
    borderRadius: 32.5,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },

  fabPlus: {
    color: 'white',
    fontSize: 30,
    fontWeight: 'bold',
  },

  gallery: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 10,
  },

  imageWrapper: {
    width: '48%',
    marginBottom: 12,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },


  image: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#eee',
  },


  buttonContent: {
    //flexDirection: '',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },

});

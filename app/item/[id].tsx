// app/item/[id].tsx
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Image, Alert, TouchableOpacity } from 'react-native';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getItemById, deleteItem } from '@/components/database';

export default function ItemDetail() {
  const { id } = useLocalSearchParams();
  const navigation = useNavigation();
  const router = useRouter();
  const [item, setItem] = useState<any | null>(null);

  // const handleAddItem = () =>
  // {
  //   insertItem(container.id, `Item ${items.length + 1}`, generateFakeEmbedding());
  // }

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



    useEffect(() => {
    if (!id) return;

    const itemId = Number(id);
    const foundItem = getItemById(itemId);

    if (!foundItem) {
        navigation.setOptions({ title: 'Item Not Found' });
        return;
    }

    setItem(foundItem);
    navigation.setOptions({ title: foundItem.name });

    }, [id]);


  return (
    <ParallaxScrollView
        headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
        headerImage={
        item?.image_uri ? (
            <Image
            source={{ uri: item.image_uri }}
            style={styles.headerImage}
            />
        ) : undefined
        }
    >
        <ThemedView style={styles.container}>

        {item && (
            <>
            <ThemedText type="title">{item.name}</ThemedText>

            <TouchableOpacity
                style={styles.deleteButton}
                onPress={handleDelete}
            >
                <ThemedText style={styles.deleteText}>
                Delete Item
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

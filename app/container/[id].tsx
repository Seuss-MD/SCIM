// app/container/[id].tsx
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

import { getItemsByContainer, getContainerById } from '@/components/database';

export default function ContainerDetail() {
  const { id } = useLocalSearchParams();
  const navigation = useNavigation();

  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    if (!id) return;

    const containerId = Number(id);

    // Get container info
    const container = getContainerById(containerId);

    if (!container) {
      navigation.setOptions({ title: 'Container Not Found' });
      return;
    }

    // Set modal title dynamically
    navigation.setOptions({ title: container.name });

    // Get items
    const data = getItemsByContainer(containerId);
    setItems(data);

  }, [id]);

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
    >
      <ThemedView style={styles.container}>
        {items.length === 0 && (
          <ThemedText>No items in this container.</ThemedText>
        )}

        {items.map((item) => (
          <ThemedText key={item.id}>
            {item.name}
          </ThemedText>
        ))}
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
  },
});

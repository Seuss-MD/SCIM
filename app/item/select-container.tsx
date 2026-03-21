// app/item/select-container.tsx
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, Image, View, FlatList } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getAllContainers, type Container } from '@/components/database';

export default function SelectContainerPage() {
  const { itemId, selectedContainerId } = useLocalSearchParams();
  const navigation = useNavigation();
  const router = useRouter();

  const [containers, setContainers] = useState<Container[]>([]);

  useEffect(() => {
    navigation.setOptions({ title: 'Select Container' });
    setContainers(getAllContainers());
  }, [navigation]);

  const currentSelectedId =
    selectedContainerId === 'none' || selectedContainerId == null
      ? null
      : Number(selectedContainerId);

  const handleSelect = (containerId: number | null) => {
    router.replace({
      pathname: '/item/edit',
      params: {
        id: String(itemId),
        selectedContainerId: containerId == null ? 'none' : String(containerId),
      },
    });
  };

  return (
    <ThemedView style={styles.container}>
      <TouchableOpacity
        style={[
          styles.card,
          currentSelectedId === null && styles.selectedCard,
        ]}
        onPress={() => handleSelect(null)}
        activeOpacity={0.8}
      >
        <View style={[styles.image, styles.imagePlaceholder]} />
        <View style={styles.cardBody}>
          <ThemedText style={styles.title}>No Container</ThemedText>
          <ThemedText style={styles.meta}>Remove item from container</ThemedText>
        </View>
      </TouchableOpacity>

      <FlatList
        data={containers}
        keyExtractor={(item) => `container-${item.id}`}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.card,
              currentSelectedId === item.id && styles.selectedCard,
            ]}
            onPress={() => handleSelect(item.id)}
            activeOpacity={0.8}
          >
            {item.image_uri ? (
              <Image source={{ uri: item.image_uri }} style={styles.image} />
            ) : (
              <View style={[styles.image, styles.imagePlaceholder]} />
            )}

            <View style={styles.cardBody}>
              <ThemedText style={styles.title}>{item.name}</ThemedText>
              <ThemedText style={styles.meta}>
                {currentSelectedId === item.id ? 'Selected' : 'Tap to select'}
              </ThemedText>
            </View>
          </TouchableOpacity>
        )}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 67,
    flex: 1,
    padding: 16,
  },
  listContent: {
    paddingTop: 12,
    paddingBottom: 24,
  },
  card: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
    alignItems: 'center',
  },
  selectedCard: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  image: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
  },
  imagePlaceholder: {
    opacity: 0.6,
  },
  cardBody: {
    flex: 1,
    justifyContent: 'center',
    gap: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  meta: {
    fontSize: 14,
    color: '#6B7280',
  },
});
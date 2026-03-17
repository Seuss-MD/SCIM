import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  searchContainersByEmbedding,
  searchItemsByEmbedding,
  type ContainerSearchResult,
  type ItemSearchResult,
} from '@/components/database';
import { generateEmbeddingFromText } from '@/components/aiTools';
import { Ionicons } from '@expo/vector-icons';

type SearchMode = 'items' | 'containers';

export default function HomeScreen() {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<SearchMode>('items');
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const [itemResults, setItemResults] = useState<ItemSearchResult[]>([]);
  const [containerResults, setContainerResults] = useState<ContainerSearchResult[]>([]);

  async function handleSearch() {
    const trimmed = query.trim();
    if (!trimmed) return;

    try {
      setLoading(true);
      setSearched(true);

      const queryEmbedding = await generateEmbeddingFromText(trimmed);

      if (mode === 'items') {
        const results = searchItemsByEmbedding(queryEmbedding, undefined, 20);
        setItemResults(results);
        setContainerResults([]);
      } else {
        const results = searchContainersByEmbedding(queryEmbedding, 20);
        setContainerResults(results);
        setItemResults([]);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  }

  function renderItemResult({ item }: { item: ItemSearchResult }) {
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/item/${item.id}`)}
      >
        {item.image_uri ? (
          <Image source={{ uri: item.image_uri }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]} />
        )}

        <View style={styles.cardBody}>
          <ThemedText style={styles.title}>{item.name || 'Unnamed Item'}</ThemedText>
          <ThemedText style={styles.meta}>
            Similarity: {(item.similarity * 100).toFixed(1)}%
          </ThemedText>
        </View>
      </TouchableOpacity>
    );
  }

  function renderContainerResult({ item }: { item: ContainerSearchResult }) {
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/container/${item.id}`)}
      >
        {item.image_uri ? (
          <Image source={{ uri: item.image_uri }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]} />
        )}

        <View style={styles.cardBody}>
          <ThemedText style={styles.title}>{item.name}</ThemedText>
          <ThemedText style={styles.meta}>
            Similarity: {(item.similarity * 100).toFixed(1)}%
          </ThemedText>
        </View>
      </TouchableOpacity>
    );
  }

  const results = mode === 'items' ? itemResults : containerResults;

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.header}>Search</ThemedText>
      

      <View style={styles.searchBox}>
        <View style={styles.searchInputWrapper}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={`Search ${mode}...`}
            placeholderTextColor="#9CA3AF"
            style={styles.input}
            returnKeyType="search"
            onSubmitEditing={handleSearch}
          />

          <TouchableOpacity
            onPress={handleSearch}
            style={styles.searchIconButton}
            activeOpacity={0.8}
          >
            <Ionicons name="search" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggleButton, mode === 'items' && styles.toggleActive]}
            onPress={() => setMode('items')}
            activeOpacity={0.8}
          >
            <ThemedText style={[styles.toggleText, mode === 'items' && styles.toggleTextActive]}>
              Items
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toggleButton, mode === 'containers' && styles.toggleActive]}
            onPress={() => setMode('containers')}
            activeOpacity={0.8}
          >
            <ThemedText style={[styles.toggleText, mode === 'containers' && styles.toggleTextActive]}>
              Containers
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" />
          <ThemedText>Searching...</ThemedText>
        </View>
      ) : mode === 'items' ? (
        itemResults.length > 0 ? (
          <FlatList
            data={itemResults}
            keyExtractor={(item) => `item-${item.id}`}
            renderItem={renderItemResult}
            contentContainerStyle={styles.listContent}
          />
        ) : searched ? (
          <View style={styles.centerState}>
            <ThemedText>No item results found.</ThemedText>
          </View>
        ) : (
          <View style={styles.centerState}>
            <ThemedText>Search your stored items.</ThemedText>
          </View>
        )
      ) : containerResults.length > 0 ? (
        <FlatList
          data={containerResults}
          keyExtractor={(item) => `container-${item.id}`}
          renderItem={renderContainerResult}
          contentContainerStyle={styles.listContent}
        />
      ) : searched ? (
        <View style={styles.centerState}>
          <ThemedText>No container results found.</ThemedText>
        </View>
      ) : (
        <View style={styles.centerState}>
          <ThemedText>Search your stored containers.</ThemedText>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 28,
    gap: 14,
  },
  header: {
    fontSize: 34,
    fontWeight: '700',
    lineHeight: 38,
    alignSelf: 'center',
  },
  searchRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  searchBox: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    gap: 12,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    paddingLeft: 16,
    paddingRight: 8,
    minHeight: 56,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingRight: 10,
    color: '#000000',
    fontSize: 16,
  },
  searchIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: '#E5EAF1',
  },
  toggleActive: {
    backgroundColor: '#2563EB',
  },
  toggleText: {
    fontWeight: '600',
    color: '#1F2937',
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    paddingBottom: 24,
    paddingTop: 6,
    gap: 12,
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
  },
  image: {
    width: 76,
    height: 76,
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
    opacity: 0.7,
    color: '#4B5563',
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 24,
  },
});
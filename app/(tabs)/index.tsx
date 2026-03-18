import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Switch,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import ScimCamera from '@/components/ScimCam';
import {
  searchContainersByEmbedding,
  searchItemsByEmbedding,
  type ContainerSearchResult,
  type ItemSearchResult,
} from '@/components/database';
import { generateEmbeddingFromText } from '@/components/aiTools';
import { Ionicons } from '@expo/vector-icons';

type SearchMode = 'items' | 'containers';
type SearchInputMode = 'text' | 'image';
type PhotoResult = { uri: string };

export default function HomeScreen() {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<SearchMode>('items');
  const [inputMode, setInputMode] = useState<SearchInputMode>('text');
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [photo, setPhoto] = useState<PhotoResult | null>(null);

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

  if (showCamera) {
    return (
      <ScimCamera
        onPhotoTaken={(capturedPhoto: PhotoResult) => {
          setPhoto(capturedPhoto);
          setShowCamera(false);
        }}
        onCancel={() => setShowCamera(false)}
      />
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.header}>Search</ThemedText>

      <View style={styles.searchBox}>
        {inputMode === 'text' ? (
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
        ) : (
          <TouchableOpacity
            style={styles.imageModeButton}
            activeOpacity={0.8}
            onPress={() => setShowCamera(true)}
          >
            <Ionicons name="camera-outline" size={20} color="#111827" />
            <ThemedText style={styles.imageModeButtonText}>
              {photo ? 'Retake Image' : 'Image Search'}
            </ThemedText>
          </TouchableOpacity>
        )}

        <View style={styles.switchRow}>
          <ThemedText style={styles.switchLabel}>Text</ThemedText>
          <Switch
            value={inputMode === 'image'}
            onValueChange={(value) => setInputMode(value ? 'image' : 'text')}
            trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
            thumbColor={inputMode === 'image' ? '#2563EB' : '#FFFFFF'}
          />
          <ThemedText style={styles.switchLabel}>Image</ThemedText>
        </View>

        {photo && inputMode === 'image' && (
          <Image source={{ uri: photo.uri }} style={styles.previewImage} />
        )}

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
      ) : !searched ? null : mode === 'items' ? (
        itemResults.length > 0 ? (
          <FlatList
            data={itemResults}
            keyExtractor={(item) => `item-${item.id}`}
            renderItem={renderItemResult}
            contentContainerStyle={styles.listContent}
          />
        ) : (
          <View style={styles.centerState}>
            <ThemedText>No items found.</ThemedText>
          </View>
        )
      ) : containerResults.length > 0 ? (
        <FlatList
          data={containerResults}
          keyExtractor={(item) => `container-${item.id}`}
          renderItem={renderContainerResult}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.centerState}>
          <ThemedText>No containers found.</ThemedText>
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
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  switchLabel: {
    fontWeight: '600',
    color: '#AAAAAA',
  },
  imageModeButton: {
    minHeight: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  imageModeButtonText: {
    fontWeight: '600',
    color: '#111827',
  },
  previewImage: {
    width: '100%',
    height: 180,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
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
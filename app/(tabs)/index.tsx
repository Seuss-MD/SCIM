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
import { Ionicons } from '@expo/vector-icons';
import { Alert } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import ScimCamera from '@/components/ScimCam';
import {
  searchItemsByEmbedding,
  type ItemSearchResult,
} from '@/components/database';
import {
  generateEmbeddingFromText,
  generateEmbeddingFromImage,
} from '@/components/aiTools';
import * as ImagePicker from 'expo-image-picker';

type SearchInputMode = 'text' | 'image';
type PhotoResult = { uri: string };

export default function HomeScreen() {
  const [query, setQuery] = useState('');
  const [inputMode, setInputMode] = useState<SearchInputMode>('image');
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [photo, setPhoto] = useState<PhotoResult | null>(null);
  const [itemResults, setItemResults] = useState<ItemSearchResult[]>([]);

  async function handleTextSearch() {
    const trimmed = query.trim();
    if (!trimmed) return;

    try {
      setLoading(true);
      setSearched(true);

      const queryEmbedding = await generateEmbeddingFromText(trimmed);
      const results = searchItemsByEmbedding(queryEmbedding, undefined, 20);
      setItemResults(results);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handlePickImage() {
  try {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert(
        'Permission required',
        'Permission to access the photo library is required.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 1,
    });

    if (result.canceled || !result.assets?.length) return;

    const selectedPhoto = { uri: result.assets[0].uri };
    setPhoto(selectedPhoto);
    await handleImageSearch(selectedPhoto.uri);
  } catch (error) {
    console.error('Image import failed:', error);
    Alert.alert('Error', 'Could not import image.');
  }
}
  async function handleImageSearch(imageUri?: string) {
    const uriToSearch = imageUri ?? photo?.uri;
    if (!uriToSearch) return;

    try {
      setLoading(true);
      setSearched(true);

      const { embedding } = await generateEmbeddingFromImage(uriToSearch);
      const results = searchItemsByEmbedding(embedding, undefined, 20);
      setItemResults(results);
    } catch (error) {
      console.error('Image search failed:', error);
    } finally {
      setLoading(false);
    }
  }

  function renderItemResult({ item }: { item: ItemSearchResult }) {
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/item/${item.id}`)}
        activeOpacity={0.85}
      >
        {item.image_uri ? (
          <Image source={{ uri: item.image_uri }} style={styles.resultImage} />
        ) : (
          <View style={[styles.resultImage, styles.imagePlaceholder]}>
            <Ionicons name="image-outline" size={24} color="#94A3B8" />
          </View>
        )}

        <View style={styles.cardBody}>
          <ThemedText style={styles.cardTitle}>
            {item.name || 'Unnamed Item'}
          </ThemedText>
          <ThemedText style={styles.cardMeta}>
            Similarity: {(item.similarity * 100).toFixed(1)}%
          </ThemedText>
        </View>
      </TouchableOpacity>
    );
  }

  if (showCamera) {
    return (
      <ScimCamera
        onPhotoTaken={async (capturedPhoto: PhotoResult) => {
          setPhoto(capturedPhoto);
          setShowCamera(false);
          await handleImageSearch(capturedPhoto.uri);
        }}
        onCancel={() => setShowCamera(false)}
      />
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.hero}>
        <ThemedText style={styles.logo}>SCIM</ThemedText>

        {inputMode === 'text' ? (
        <View style={styles.searchShell}>
          <Ionicons
            name="search-outline"
            size={26}
            color="#111111"
            style={styles.searchIcon}
          />

          <View style={styles.searchDivider} />

          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search for an Item"
            placeholderTextColor="#9CA3AF"
            style={styles.input}
            returnKeyType="search"
            onSubmitEditing={handleTextSearch}
          />
        </View>
      ) : (
        <View style={styles.imageActionRow}>
          <TouchableOpacity
            style={styles.imageSearchShell}
            onPress={() => setShowCamera(true)}
            activeOpacity={0.85}
          >
            <Ionicons
              name="camera-outline"
              size={26}
              color="#111111"
              style={styles.searchIcon}
            />

            <View style={styles.searchDivider} />

            <View style={styles.imageSearchTextWrap}>
              <ThemedText style={styles.imageSearchText}>
                {photo ? 'Retake image query' : 'Search by Image'}
              </ThemedText>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.importButton}
            onPress={handlePickImage}
            activeOpacity={0.85}
          >
            <Ionicons name="images-outline" size={22} color="#111111" />
          </TouchableOpacity>
        </View>
      )}

        <View style={styles.segmentWrap}>
          <TouchableOpacity
            style={[
              styles.segmentButton,
              inputMode === 'image' && styles.segmentButtonActive,
            ]}
            onPress={() => setInputMode('image')}
            activeOpacity={0.85}
          >
            <Ionicons
              name="camera-outline"
              size={16}
              color={inputMode === 'image' ? '#FFFFFF' : '#334155'}
            />
            <ThemedText
              style={[
                styles.segmentText,
                inputMode === 'image' && styles.segmentTextActive,
              ]}
            >
              Image
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.segmentButton,
              inputMode === 'text' && styles.segmentButtonActive,
            ]}
            onPress={() => setInputMode('text')}
            activeOpacity={0.85}
          >
            <Ionicons
              name="create-outline"
              size={16}
              color={inputMode === 'text' ? '#FFFFFF' : '#334155'}
            />
            <ThemedText
              style={[
                styles.segmentText,
                inputMode === 'text' && styles.segmentTextActive,
              ]}
            >
              Text
            </ThemedText>
          </TouchableOpacity>
        </View>

        {photo && inputMode === 'image' && (
          <Image source={{ uri: photo.uri }} style={styles.previewImage} />
        )}
      </View>

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" />
          <ThemedText>Searching...</ThemedText>
        </View>
      ) : !searched ? null : itemResults.length > 0 ? (
        <FlatList
          data={itemResults}
          keyExtractor={(item) => `item-${item.id}`}
          renderItem={renderItemResult}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.centerState}>
          <ThemedText>No items found.</ThemedText>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F6F6',
    paddingHorizontal: 18,
    paddingTop: 48,
  },
  hero: {
    alignItems: 'center',
    marginTop: 26,
  },
  logo: {
    fontSize: 44,
    color: '#5B5CEB',
    fontWeight: '500',
    fontFamily: 'Georgia',
    marginBottom: 42,
    lineHeight: 44,
  },
  segmentWrap: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 999,
    padding: 4,
    gap: 4,
    width: '100%',
    maxWidth: 260,
    marginTop: 16,
    marginBottom: 8,
  },
  segmentButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  segmentButtonActive: {
    backgroundColor: '#5B5CEB',
  },
  segmentText: {
    fontWeight: '700',
    color: '#334155',
  },
  segmentTextActive: {
    color: '#FFFFFF',
  },
  searchShell: {
    width: '100%',
    maxWidth: 360,
    minHeight: 58,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#2F2F2F',
    backgroundColor: '#F6F6F6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
 imageSearchShell: {
    flex: 1,
    minHeight: 58,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#2F2F2F',
    backgroundColor: '#F6F6F6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchDivider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: '#8B8B8B',
    marginRight: 12,
    opacity: 0.7,
  },
  imageActionRow: {
    width: '100%',
    maxWidth: 360,
    flexDirection: 'row',
    gap: 10,
  },
  importButton: {
    width: 58,
    minHeight: 58,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#2F2F2F',
    backgroundColor: '#F6F6F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#111111',
    paddingVertical: 12,
  },
  imageSearchTextWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  imageSearchText: {
    fontSize: 15,
    color: '#111111',
  },
  previewImage: {
    width: '100%',
    maxWidth: 360,
    height: 180,
    borderRadius: 18,
    marginTop: 16,
    backgroundColor: '#E5E7EB',
  },
  listContent: {
    paddingTop: 28,
    paddingBottom: 24,
  },
  card: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  resultImage: {
    width: 76,
    height: 76,
    borderRadius: 14,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholder: {
    opacity: 0.6,
  },
  cardBody: {
    flex: 1,
    justifyContent: 'center',
    gap: 6,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  cardMeta: {
    fontSize: 14,
    color: '#6B7280',
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 40,
  },
});
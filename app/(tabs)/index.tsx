import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  useColorScheme,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

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
import { Colors, Radius, Spacing, Shadows } from '@/constants/theme';

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

  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

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
      Alert.alert('Error', 'Search failed.');
    } finally {
      setLoading(false);
    }
  }

  async function handlePickImage() {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

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
      Alert.alert('Error', 'Image search failed.');
    } finally {
      setLoading(false);
    }
  }

  function renderItemResult({ item }: { item: ItemSearchResult }) {
    return (
      <TouchableOpacity
        style={[
          styles.card,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
          },
        ]}
        onPress={() => router.push(`/item/${item.id}`)}
        activeOpacity={0.85}
      >
        {item.image_uri ? (
          <Image source={{ uri: item.image_uri }} style={styles.resultImage} />
        ) : (
          <View
            style={[
              styles.resultImage,
              styles.imagePlaceholder,
              { backgroundColor: theme.surfaceAlt },
            ]}
          >
            <Ionicons
              name="image-outline"
              size={24}
              color={theme.textSoft}
            />
          </View>
        )}

        <View style={styles.cardBody}>
          <ThemedText style={[styles.cardTitle, { color: theme.text }]}>
            {item.name || 'Unnamed Item'}
          </ThemedText>
          <ThemedText style={[styles.cardMeta, { color: theme.textMuted }]}>
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
    <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.hero}>
        <ThemedText style={[styles.logo, { color: theme.tint }]}>SCIM</ThemedText>

        {inputMode === 'text' ? (
          <View
            style={[
              styles.searchShell,
              {
                borderColor: theme.borderStrong,
                backgroundColor: theme.surface,
              },
            ]}
          >
            <Ionicons
              name="search-outline"
              size={26}
              color={theme.text}
              style={styles.searchIcon}
            />

            <View
              style={[
                styles.searchDivider,
                { backgroundColor: theme.borderStrong },
              ]}
            />

            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search for an Item"
              placeholderTextColor={theme.text}
              style={[styles.input, { color: theme.text }]}
              returnKeyType="search"
              onSubmitEditing={handleTextSearch}
            />
          </View>
        ) : (
          <View style={styles.imageActionRow}>
            <TouchableOpacity
              style={[
                styles.imageSearchShell,
                {
                  borderColor: theme.borderStrong,
                  backgroundColor: theme.surface,
                },
              ]}
              onPress={() => setShowCamera(true)}
              activeOpacity={0.85}
            >
              <Ionicons
                name="camera-outline"
                size={26}
                color={theme.text}
                style={styles.searchIcon}
              />

              <View
                style={[
                  styles.searchDivider,
                  { backgroundColor: theme.borderStrong },
                ]}
              />

              <View style={styles.imageSearchTextWrap}>
                <ThemedText
                  style={[styles.imageSearchText, { color: theme.text }]}
                >
                  {photo ? 'Retake image query' : 'Search by Image'}
                </ThemedText>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.importButton,
                {
                  borderColor: theme.borderStrong,
                  backgroundColor: theme.surface,
                },
              ]}
              onPress={handlePickImage}
              activeOpacity={0.85}
            >
              <Ionicons name="images-outline" size={22} color={theme.text} />
            </TouchableOpacity>
          </View>
        )}

        <View
          style={[
            styles.segmentWrap,
            { backgroundColor: theme.surfaceAlt, borderColor: theme.border },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.segmentButton,
              inputMode === 'image' && {
                backgroundColor: theme.primary,
              },
            ]}
            onPress={() => setInputMode('image')}
            activeOpacity={0.85}
          >
            <Ionicons
              name="camera-outline"
              size={16}
              color={inputMode === 'image' ? theme.primaryText : theme.textMuted}
            />
            <ThemedText
              style={[
                styles.segmentText,
                { color: theme.textMuted },
                inputMode === 'image' && {
                  color: theme.primaryText,
                },
              ]}
            >
              Image
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.segmentButton,
              inputMode === 'text' && {
                backgroundColor: theme.primary,
              },
            ]}
            onPress={() => setInputMode('text')}
            activeOpacity={0.85}
          >
            <Ionicons
              name="create-outline"
              size={16}
              color={inputMode === 'text' ? theme.primaryText : theme.textMuted}
            />
            <ThemedText
              style={[
                styles.segmentText,
                { color: theme.textMuted },
                inputMode === 'text' && {
                  color: theme.primaryText,
                },
              ]}
            >
              Text
            </ThemedText>
          </TouchableOpacity>
        </View>

        {photo && inputMode === 'image' && (
          <Image
            source={{ uri: photo.uri }}
            style={[
              styles.previewImage,
              { backgroundColor: theme.surfaceAlt, borderColor: theme.border },
            ]}
          />
        )}
      </View>

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={theme.primary} />
          <ThemedText style={{ color: theme.textMuted }}>Searching...</ThemedText>
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
          <ThemedText style={{ color: theme.textMuted }}>
            No items found.
          </ThemedText>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 48,
  },
  hero: {
    alignItems: 'center',
    marginTop: 26,
  },
  logo: {
    fontSize: 44,
    fontWeight: '600',
    marginBottom: 42,
    lineHeight: 44,
  },
  segmentWrap: {
    flexDirection: 'row',
    borderRadius: Radius.pill,
    padding: 4,
    gap: 4,
    width: '100%',
    maxWidth: 260,
    marginTop: 16,
    marginBottom: 8,
    borderWidth: 1,
  },
  segmentButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  segmentText: {
    fontWeight: '700',
  },
  searchShell: {
    width: '100%',
    maxWidth: 360,
    minHeight: 58,
    borderRadius: Radius.pill,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  imageSearchShell: {
    flex: 1,
    minHeight: 58,
    borderRadius: Radius.pill,
    borderWidth: 1.5,
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
    borderRadius: Radius.pill,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 12,
  },
  imageSearchTextWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  imageSearchText: {
    fontSize: 15,
  },
  previewImage: {
    width: '100%',
    maxWidth: 360,
    height: 180,
    borderRadius: Radius.lg,
    marginTop: 16,
    borderWidth: 1,
  },
  listContent: {
    paddingTop: 28,
    paddingBottom: 24,
  },
  card: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: 12,
    ...Shadows.card,
  },
  resultImage: {
    width: 76,
    height: 76,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholder: {
    opacity: 0.7,
  },
  cardBody: {
    flex: 1,
    justifyContent: 'center',
    gap: 6,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  cardMeta: {
    fontSize: 14,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 40,
    gap: 10,
  },
});
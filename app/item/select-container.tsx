// app/item/select-container.tsx
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  Image,
  View,
  FlatList,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getAllContainers, type Container } from '@/components/database';
import { Colors, Radius, Spacing, Shadows } from '@/constants/theme';

export default function SelectContainerPage() {
  const { itemId, selectedContainerId } = useLocalSearchParams();
  const navigation = useNavigation();
  const router = useRouter();

  const [containers, setContainers] = useState<Container[]>([]);

  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

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

  const renderCard = (
    title: string,
    meta: string,
    selected: boolean,
    onPress: () => void,
    imageUri?: string | null
  ) => (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: selected ? theme.secondary : theme.surface,
          borderColor: selected ? theme.primary : theme.border,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {imageUri ? (
        <Image
          source={{ uri: imageUri }}
          style={[
            styles.image,
            { backgroundColor: theme.surfaceAlt },
          ]}
        />
      ) : (
        <View
          style={[
            styles.image,
            styles.imagePlaceholder,
            { backgroundColor: theme.surfaceAlt, borderColor: theme.border },
          ]}
        >
          <Ionicons
            name="folder-open-outline"
            size={24}
            color={theme.textMuted}
          />
        </View>
      )}

      <View style={styles.cardBody}>
        <ThemedText style={[styles.title, { color: theme.text }]}>
          {title}
        </ThemedText>
        <ThemedText style={[styles.meta, { color: theme.textMuted }]}>
          {meta}
        </ThemedText>
      </View>

      {selected && (
        <Ionicons
          name="checkmark-circle"
          size={22}
          color={theme.primary}
        />
      )}
    </TouchableOpacity>
  );

  return (
    <ThemedView
      style={[
        styles.container,
        { backgroundColor: theme.background },
      ]}
    >
      <View style={styles.headerBlock}>
        <ThemedText style={[styles.headerTitle, { color: theme.text }]}>
          Select Container
        </ThemedText>
        <ThemedText style={[styles.headerSubtitle, { color: theme.textMuted }]}>
          Choose where this item belongs.
        </ThemedText>
      </View>

      {renderCard(
        'No Container',
        'Remove item from container',
        currentSelectedId === null,
        () => handleSelect(null),
        null
      )}

      <FlatList
        data={containers}
        keyExtractor={(item) => `container-${item.id}`}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) =>
          renderCard(
            item.name,
            currentSelectedId === item.id ? 'Selected' : 'Tap to select',
            currentSelectedId === item.id,
            () => handleSelect(item.id),
            item.image_uri
          )
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.lg,
    paddingTop: 24,
  },
  headerBlock: {
    marginBottom: Spacing.lg,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  listContent: {
    paddingTop: 4,
    paddingBottom: Spacing.xxl,
  },
  card: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: 12,
    alignItems: 'center',
    ...Shadows.card,
  },
  image: {
    width: 72,
    height: 72,
    borderRadius: 12,
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  cardBody: {
    flex: 1,
    justifyContent: 'center',
    gap: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  meta: {
    fontSize: 14,
  },
});
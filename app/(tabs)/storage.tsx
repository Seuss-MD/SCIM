// app/(tabs)/storage.tsx
import { useState, useCallback } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  View,
  Image,
  FlatList,
  Dimensions,
  Alert,
  useColorScheme,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  getAllContainers,
  deleteContainer,
} from '@/components/database';
import { Colors, Radius, Spacing, Shadows } from '@/constants/theme';

export default function StorageScreen() {
  const router = useRouter();
  const [containers, setContainers] = useState<any[]>([]);
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  const numColumns = 2;
  const screenWidth = Dimensions.get('window').width;
  const spacing = 16;
  const imageSize = (screenWidth - spacing * (numColumns + 1)) / numColumns;

  const loadContainers = () => {
    const data = getAllContainers();
    setContainers(data);
  };

  useFocusEffect(
    useCallback(() => {
      loadContainers();
    }, [])
  );

  const handleDelete = (id: number) => {
    Alert.alert(
      'Delete Container',
      'Are you sure you want to delete this container?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteContainer(id);
            loadContainers();
          },
        },
      ]
    );
  };

  return (
    <ThemedView
      style={[
        styles.screen,
        { backgroundColor: theme.background },
      ]}
    >
      <FlatList
        data={containers}
        keyExtractor={(item) => item.id.toString()}
        numColumns={numColumns}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.headerBlock}>
            <View style={styles.titleBlock}>
              <ThemedText style={[styles.title, { color: theme.text }]}>
                Containers
              </ThemedText>
              <ThemedText style={[styles.subtitle, { color: theme.textMuted }]}>
                Tap to open. Long press to delete.
              </ThemedText>
            </View>

            <TouchableOpacity
              style={[
                styles.createButton,
                {
                  backgroundColor: theme.primary,
                },
              ]}
              activeOpacity={0.85}
              onPress={() => router.push('/container/create')}
            >
              <View style={styles.buttonContent}>
                <Ionicons
                  name="add"
                  size={18}
                  color={theme.primaryText}
                />
                <ThemedText
                  style={[
                    styles.buttonText,
                    { color: theme.primaryText },
                  ]}
                >
                  Create Container
                </ThemedText>
              </View>
            </TouchableOpacity>
          </View>
        }
        ListEmptyComponent={
          <View
            style={[
              styles.emptyCard,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
          >
            <Ionicons
              name="folder-open-outline"
              size={32}
              color={theme.textMuted}
            />
            <ThemedText
              style={[
                styles.emptyTitle,
                { color: theme.text },
              ]}
            >
              No containers yet
            </ThemedText>
            <ThemedText
              style={[
                styles.emptySubtitle,
                { color: theme.textMuted },
              ]}
            >
              Create your first container to start organizing your items.
            </ThemedText>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.card,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                width: imageSize,
              },
            ]}
            onPress={() => router.push(`/container/${item.id}`)}
            onLongPress={() => handleDelete(item.id)}
            delayLongPress={400}
            activeOpacity={0.85}
          >
            <Image
              source={{ uri: item.image_uri }}
              style={[
                styles.image,
                {
                  width: '100%',
                  height: imageSize,
                  backgroundColor: theme.surfaceAlt,
                },
              ]}
            />

            <View style={styles.cardFooter}>
              <ThemedText
                numberOfLines={1}
                style={[
                  styles.cardTitle,
                  { color: theme.text },
                ]}
              >
                {item.name || 'Unnamed Container'}
              </ThemedText>

              <Ionicons
                name="chevron-forward"
                size={18}
                color={theme.textMuted}
              />
            </View>
          </TouchableOpacity>
        )}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingTop:Spacing.xl,
  },
  listContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  columnWrapper: {
    gap: 16,
  },
  headerBlock: {
    marginBottom: Spacing.xl,
  },
  titleBlock: {
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.6,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  createButton: {
    minHeight: 52,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.card,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  card: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
    ...Shadows.card,
  },
  image: {
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
  },
  cardFooter: {
    minHeight: 52,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    marginRight: 8,
  },
  emptyCard: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    ...Shadows.card,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
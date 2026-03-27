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
  getAllItems,
  deleteItem,
} from '@/components/database';
import { Colors, Radius, Spacing, Shadows } from '@/constants/theme';

type StorageTab = 'containers' | 'items';

type ContainerRecord = {
  id: number;
  name?: string | null;
  image_uri?: string | null;
};

type ItemRecord = {
  id: number;
  name?: string | null;
  image_uri?: string | null;
  container_id?: number | null;
};

const ATTACHED_CARD_COLOR = '#F7F3E3';
const UNATTACHED_ITEM_CARD_COLOR = '#6F1A07';

export default function StorageScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<StorageTab>('containers');
  const [containers, setContainers] = useState<ContainerRecord[]>([]);
  const [items, setItems] = useState<ItemRecord[]>([]);

  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  const numColumns = 2;
  const screenWidth = Dimensions.get('window').width;
  const spacing = 16;
  const imageSize = (screenWidth - spacing * (numColumns + 1)) / numColumns;

  const loadData = () => {
    setContainers(getAllContainers() as ContainerRecord[]);
    setItems(getAllItems() as ItemRecord[]);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const handleDeleteContainer = (id: number) => {
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
            loadData();
          },
        },
      ]
    );
  };

  const handleDeleteItem = (id: number) => {
    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteItem(id);
            loadData();
          },
        },
      ]
    );
  };

  const isContainers = activeTab === 'containers';
  const data = isContainers ? containers : items;

  const handleCreate = () => {
    if (isContainers) {
      router.push('/container/create');
    } else {
      router.push('/item/create');
    }
  };

  const handlePressCard = (item: ContainerRecord | ItemRecord) => {
    if (isContainers) {
      router.push(`/container/${item.id}`);
    } else {
      router.push(`/item/${item.id}`);
    }
  };

  const handleLongPressCard = (item: ContainerRecord | ItemRecord) => {
    if (isContainers) {
      handleDeleteContainer(item.id);
    } else {
      handleDeleteItem(item.id);
    }
  };

  const getCardColors = (item: ContainerRecord | ItemRecord) => {
    if (!isContainers) {
      const itemRecord = item as ItemRecord;
      const isLooseItem =
        itemRecord.container_id === null || itemRecord.container_id === undefined;

      if (isLooseItem) {
        return {
          cardBackground: UNATTACHED_ITEM_CARD_COLOR,
          cardBorder: UNATTACHED_ITEM_CARD_COLOR,
          titleColor: Colors.light.dangerText,
          chevronColor: Colors.light.dangerText,
          imageBackground: '#8A2F1D',
          fallbackIconColor: Colors.light.dangerText,
        };
      }
    }

    return {
      cardBackground: ATTACHED_CARD_COLOR,
      cardBorder: theme.border,
      titleColor: Colors.light.text,
      chevronColor: Colors.light.textMuted,
      imageBackground: theme.surfaceAlt,
      fallbackIconColor: Colors.light.textMuted,
    };
  };

  return (
    <ThemedView
      style={[
        styles.screen,
        { backgroundColor: theme.background },
      ]}
    >
      <FlatList
        data={data}
        keyExtractor={(item) => item.id.toString()}
        numColumns={numColumns}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.headerBlock}>
            <View style={styles.titleBlock}>
              <ThemedText style={[styles.title, { color: theme.text }]}>
                Storage
              </ThemedText>
              <ThemedText style={[styles.subtitle, { color: theme.textMuted }]}>
                Browse your containers and items. Tap to open. Long press to delete.
                { '\n'}
                Red label items are not in any container.
              </ThemedText>
            </View>

            <View
              style={[
                styles.toggleWrap,
                {
                  backgroundColor: theme.surfaceAlt,
                  borderColor: theme.border,
                },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  isContainers && {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                  },
                ]}
                activeOpacity={0.85}
                onPress={() => setActiveTab('containers')}
              >
                <Ionicons
                  name="cube-outline"
                  size={16}
                  color={isContainers ? theme.text : theme.textMuted}
                />
                <ThemedText
                  style={[
                    styles.toggleText,
                    { color: isContainers ? theme.text : theme.textMuted },
                  ]}
                >
                  Containers
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  !isContainers && {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                  },
                ]}
                activeOpacity={0.85}
                onPress={() => setActiveTab('items')}
              >
                <Ionicons
                  name="pricetag-outline"
                  size={16}
                  color={!isContainers ? theme.text : theme.textMuted}
                />
                <ThemedText
                  style={[
                    styles.toggleText,
                    { color: !isContainers ? theme.text : theme.textMuted },
                  ]}
                >
                  Items
                </ThemedText>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.createButton,
                {
                  backgroundColor: theme.primary,
                },
              ]}
              activeOpacity={0.85}
              onPress={handleCreate}
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
                  {isContainers ? 'Create Container' : 'Create Item'}
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
              name={isContainers ? 'folder-open-outline' : 'pricetag-outline'}
              size={32}
              color={theme.textMuted}
            />
            <ThemedText
              style={[
                styles.emptyTitle,
                { color: theme.text },
              ]}
            >
              {isContainers ? 'No containers yet' : 'No items yet'}
            </ThemedText>
            <ThemedText
              style={[
                styles.emptySubtitle,
                { color: theme.textMuted },
              ]}
            >
              {isContainers
                ? 'Create your first container to start organizing your items.'
                : 'Create your first item to start tracking what you own.'}
            </ThemedText>
          </View>
        }
        renderItem={({ item }) => {
          const colors = getCardColors(item);

          return (
            <TouchableOpacity
              style={[
                styles.card,
                {
                  backgroundColor: colors.cardBackground,
                  borderColor: colors.cardBorder,
                  width: imageSize,
                },
              ]}
              onPress={() => handlePressCard(item)}
              onLongPress={() => handleLongPressCard(item)}
              delayLongPress={400}
              activeOpacity={0.85}
            >
              {item.image_uri ? (
                <Image
                  source={{ uri: item.image_uri }}
                  style={[
                    styles.image,
                    {
                      width: '100%',
                      height: imageSize,
                      backgroundColor: colors.imageBackground,
                    },
                  ]}
                />
              ) : (
                <View
                  style={[
                    styles.imageFallback,
                    {
                      width: '100%',
                      height: imageSize,
                      backgroundColor: colors.imageBackground,
                    },
                  ]}
                >
                  <Ionicons
                    name={isContainers ? 'cube-outline' : 'pricetag-outline'}
                    size={28}
                    color={colors.fallbackIconColor}
                  />
                </View>
              )}

              <View style={styles.cardFooter}>
                <ThemedText
                  numberOfLines={1}
                  style={[
                    styles.cardTitle,
                    { color: colors.titleColor },
                  ]}
                >
                  {item.name || (isContainers ? 'Unnamed Container' : 'Unnamed Item')}
                </ThemedText>

                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={colors.chevronColor}
                />
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingTop: Spacing.xl,
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
    gap: Spacing.md,
  },
  titleBlock: {
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: 48,
    fontWeight: '800',
    letterSpacing: -0.6,
    marginBottom: 6,
    lineHeight: 52,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  toggleWrap: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: 4,
    gap: 4,
  },
  toggleButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: Radius.md - 4,
    borderWidth: 1,
    borderColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '700',
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
    borderWidth: 0.01,
    overflow: 'hidden',
    marginBottom: 16,
    ...Shadows.card,
  },
  image: {
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
  },
  imageFallback: {
    alignItems: 'center',
    justifyContent: 'center',
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
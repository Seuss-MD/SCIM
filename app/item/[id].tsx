import {
  useFocusEffect,
  useLocalSearchParams,
  useNavigation,
  useRouter,
} from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  getContainerById,
  getItemById,
  type Container,
  type Item,
} from '@/components/database';
import {
  canCurrentUserPermanentlyDeleteSyncedItems,
  permanentlyDeleteItemEverywhere,
} from '@/components/itemDeletion';
import { Colors, Radius, Shadows, Spacing } from '@/constants/theme';

function AiLoadingBar({
  trackColor,
  fillColor,
}: {
  trackColor: string;
  fillColor: string;
}) {
  const [trackWidth, setTrackWidth] = useState(0);
  const anim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    if (!trackWidth) return;

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );

    loop.start();
    return () => loop.stop();
  }, [anim, trackWidth]);

  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [-trackWidth * 0.35, trackWidth],
  });

  return (
    <View
      onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
      style={[styles.progressTrack, { backgroundColor: trackColor }]}
    >
      {trackWidth > 0 ? (
        <Animated.View
          style={[
            styles.progressFill,
            {
              width: trackWidth * 0.35,
              backgroundColor: fillColor,
              transform: [{ translateX }],
            },
          ]}
        />
      ) : null}
    </View>
  );
}

export default function ItemDetail() {
  const { id } = useLocalSearchParams();
  const navigation = useNavigation();
  const router = useRouter();

  const [item, setItem] = useState<Item | null>(null);
  const [container, setContainer] = useState<Container | null>(null);
  const [checkingDeletePermission, setCheckingDeletePermission] = useState(false);
  const [canDeleteSyncedItems, setCanDeleteSyncedItems] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  const loadItem = useCallback(() => {
    if (!id) return;

    const itemId = Number(id);

    if (!Number.isFinite(itemId)) {
      navigation.setOptions({ title: 'Item Not Found' });
      return;
    }

    const foundItem = getItemById(itemId);

    if (!foundItem) {
      navigation.setOptions({ title: 'Item Not Found' });
      return;
    }

    setItem(foundItem);
    navigation.setOptions({ title: foundItem.name || 'Item' });

    if (foundItem.container_id != null) {
      setContainer(getContainerById(foundItem.container_id));
    } else {
      setContainer(null);
    }
  }, [id, navigation]);

  useFocusEffect(
    useCallback(() => {
      loadItem();
    }, [loadItem])
  );

  useEffect(() => {
    if (!item?.id) return;

    const needsAiDescription = !item.description?.trim();

    if (!needsAiDescription) return;

    const interval = setInterval(() => {
      const refreshed = getItemById(item.id);

      if (!refreshed) return;

      setItem(refreshed);

      if (refreshed.container_id != null) {
        setContainer(getContainerById(refreshed.container_id));
      }

      if (refreshed.description?.trim()) {
        clearInterval(interval);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [item?.id, item?.description]);

  useEffect(() => {
    let isMounted = true;

    async function loadDeletePermission() {
      if (!item?.cloud_id) {
        if (isMounted) {
          setCanDeleteSyncedItems(true);
          setCheckingDeletePermission(false);
        }
        return;
      }

      try {
        setCheckingDeletePermission(true);
        const allowed = await canCurrentUserPermanentlyDeleteSyncedItems();

        if (isMounted) {
          setCanDeleteSyncedItems(allowed);
        }
      } catch {
        if (isMounted) {
          setCanDeleteSyncedItems(false);
        }
      } finally {
        if (isMounted) {
          setCheckingDeletePermission(false);
        }
      }
    }

    loadDeletePermission();

    return () => {
      isMounted = false;
    };
  }, [item?.cloud_id]);

  const canDeleteThisItem = !item?.cloud_id || canDeleteSyncedItems;

  const handleDelete = () => {
    if (!item) return;

    if (item.cloud_id && !canDeleteThisItem) {
      Alert.alert(
        'Owner only',
        'Only the group owner can permanently delete synced items from the cloud and this device.'
      );
      return;
    }

    Alert.alert(
      'Delete Item',
      item.cloud_id
        ? 'This will permanently delete the item from the cloud and this device.'
        : 'Are you sure you want to delete this item from this device?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleting(true);
              await permanentlyDeleteItemEverywhere(item);
              router.back();
            } catch (error: any) {
              Alert.alert(
                'Delete failed',
                error?.message ?? 'Could not delete this item.'
              );
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  const isGeneratingDescription = !!item && !item.description?.trim();

  return (
    <ParallaxScrollView
      headerBackgroundColor={{
        light: Colors.light.surfaceAlt,
        dark: Colors.dark.surfaceAlt,
      }}
      headerImage={
        item?.image_uri ? (
          <Image source={{ uri: item.image_uri }} style={styles.headerImage} />
        ) : (
          <View
            style={[
              styles.headerPlaceholder,
              { backgroundColor: theme.surfaceAlt },
            ]}
          >
            <Ionicons
              name="cube-outline"
              size={52}
              color={theme.textMuted}
            />
          </View>
        )
      }
    >
      <ThemedView
        style={[
          styles.container,
          { backgroundColor: theme.background },
        ]}
      >
        {item ? (
          <>
            <ThemedText style={[styles.title, { color: theme.text }]}>
              {item.name}
            </ThemedText>

            <View
              style={[
                styles.infoCard,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}
            >
              <ThemedText style={[styles.label, { color: theme.textMuted }]}>
                Description
              </ThemedText>

              {isGeneratingDescription ? (
                <View style={styles.loadingBlock}>
                  <View style={styles.loadingRow}>
                    <ActivityIndicator size="small" color={theme.tint} />
                    <ThemedText
                      style={[styles.loadingTitle, { color: theme.text }]}
                    >
                      Generating AI description...
                    </ThemedText>
                  </View>

                  <ThemedText
                    style={[styles.loadingHint, { color: theme.textMuted }]}
                  >
                    Uploading image and analyzing item details.
                  </ThemedText>

                  <AiLoadingBar
                    trackColor={theme.surfaceAlt}
                    fillColor={theme.tint}
                  />
                </View>
              ) : (
                <ThemedText style={[styles.description, { color: theme.text }]}>
                  {item.description?.trim() || 'No description available.'}
                </ThemedText>
              )}
            </View>

            <View
              style={[
                styles.infoCard,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}
            >
              <ThemedText style={[styles.label, { color: theme.textMuted }]}>
                Container
              </ThemedText>

              {container ? (
                <TouchableOpacity
                  style={[
                    styles.containerPreview,
                    {
                      backgroundColor: theme.surfaceAlt,
                      borderColor: theme.border,
                    },
                  ]}
                  onPress={() => router.push(`/container/${container.id}`)}
                  activeOpacity={0.85}
                >
                  {container.image_uri ? (
                    <Image
                      source={{ uri: container.image_uri }}
                      style={styles.containerImage}
                    />
                  ) : (
                    <View
                      style={[
                        styles.containerImage,
                        styles.containerImagePlaceholder,
                        { backgroundColor: theme.border },
                      ]}
                    >
                      <Ionicons
                        name="folder-open-outline"
                        size={24}
                        color={theme.textMuted}
                      />
                    </View>
                  )}

                  <View style={styles.containerPreviewText}>
                    <ThemedText style={[styles.linkText, { color: theme.text }]}>
                      {container.name}
                    </ThemedText>

                    <ThemedText
                      style={[styles.containerHint, { color: theme.textMuted }]}
                    >
                      Tap to open container
                    </ThemedText>
                  </View>

                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={theme.textMuted}
                  />
                </TouchableOpacity>
              ) : (
                <ThemedText style={{ color: theme.textMuted }}>
                  Not in a container
                </ThemedText>
              )}
            </View>

            <TouchableOpacity
              style={[
                styles.editButton,
                { backgroundColor: theme.primary },
              ]}
              onPress={() =>
                router.push({
                  pathname: '/item/edit',
                  params: { id: String(item.id) },
                })
              }
              activeOpacity={0.85}
            >
              <Ionicons
                name="create-outline"
                size={18}
                color={theme.primaryText}
                style={styles.buttonIcon}
              />
              <ThemedText
                style={[styles.buttonText, { color: theme.primaryText }]}
              >
                Edit Item
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.deleteButton,
                {
                  backgroundColor: theme.danger,
                  opacity:
                    deleting || checkingDeletePermission || !canDeleteThisItem
                      ? 0.65
                      : 1,
                },
              ]}
              onPress={handleDelete}
              activeOpacity={0.85}
              disabled={deleting || checkingDeletePermission}
            >
              <Ionicons
                name="trash-outline"
                size={18}
                color={theme.dangerText}
                style={styles.buttonIcon}
              />
              <ThemedText
                style={[styles.buttonText, { color: theme.dangerText }]}
              >
                {deleting
                  ? 'Deleting...'
                  : checkingDeletePermission
                  ? 'Checking...'
                  : 'Delete Item'}
              </ThemedText>
            </TouchableOpacity>

            {item.cloud_id && !canDeleteThisItem ? (
              <ThemedText
                style={[styles.permissionHint, { color: theme.textMuted }]}
              >
                Only the group owner can permanently delete synced items.
              </ThemedText>
            ) : null}
          </>
        ) : (
          <View
            style={[
              styles.infoCard,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
          >
            <ThemedText style={[styles.description, { color: theme.textMuted }]}>
              Item not found.
            </ThemedText>
          </View>
        )}
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
    gap: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  headerImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  headerPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  infoCard: {
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    gap: 8,
    ...Shadows.card,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
  },
  loadingBlock: {
    gap: 10,
    paddingTop: 2,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 10,
  },
  loadingHint: {
    fontSize: 14,
    lineHeight: 20,
  },
  progressTrack: {
    height: 10,
    width: '100%',
    borderRadius: 999,
    overflow: 'hidden',
    position: 'relative',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    position: 'absolute',
    left: 0,
    top: 0,
  },
  containerPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: 12,
  },
  containerImage: {
    width: 72,
    height: 72,
    borderRadius: 12,
  },
  containerImagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  containerPreviewText: {
    flex: 1,
    gap: 4,
  },
  linkText: {
    fontWeight: '700',
    fontSize: 16,
  },
  containerHint: {
    fontSize: 13,
  },
  editButton: {
    padding: 14,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 4,
  },
  deleteButton: {
    padding: 14,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    fontWeight: '700',
    fontSize: 16,
  },
  permissionHint: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: -2,
  },
});
import { useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { syncMissingData, type SyncResult } from '@/components/cloudDatabase';
import { Colors, Radius, Shadows, Spacing } from '@/constants/theme';

export default function SyncScreen() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [result, setResult] = useState<SyncResult | null>(null);

  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  async function handleSync() {
    try {
      setIsSyncing(true);

      const syncResult = await syncMissingData();
      setResult(syncResult);
    } catch (error: any) {
      console.error('Sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  }

  const totalItemsSynced =
    (result?.pushedItems ?? 0) + (result?.pulledItems ?? 0);

  const totalContainersSynced =
    (result?.pushedContainers ?? 0) + (result?.pulledContainers ?? 0);

  return (
    <ThemedView style={[styles.screen, { backgroundColor: theme.background }]}>
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
          },
        ]}
      >
        <ThemedText style={[styles.title, { color: theme.text }]}>
          Sync
        </ThemedText>

        <TouchableOpacity
          onPress={handleSync}
          activeOpacity={0.9}
          disabled={isSyncing}
          style={[
            styles.syncButton,
            {
              backgroundColor: theme.tint,
              opacity: isSyncing ? 0.8 : 1,
            },
          ]}
        >
          {isSyncing ? (
            <>
              <ActivityIndicator size="small" color="#fff" style={styles.buttonIcon} />
              <ThemedText style={[styles.syncButtonText, { color: '#fff' }]}>
                Syncing...
              </ThemedText>
            </>
          ) : (
            <>
              <Ionicons name="sync" size={20} color="#fff" style={styles.buttonIcon} />
              <ThemedText style={[styles.syncButtonText, { color: '#fff' }]}>
                Sync
              </ThemedText>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.statsRow}>
          <View
            style={[
              styles.statCard,
              {
                backgroundColor: theme.background,
                borderColor: theme.border,
              },
            ]}
          >
            <ThemedText style={[styles.statNumber, { color: theme.text }]}>
              {totalItemsSynced}
            </ThemedText>
            <ThemedText style={[styles.statLabel, { color: theme.textMuted }]}>
              Items
            </ThemedText>
          </View>

          <View
            style={[
              styles.statCard,
              {
                backgroundColor: theme.background,
                borderColor: theme.border,
              },
            ]}
          >
            <ThemedText style={[styles.statNumber, { color: theme.text }]}>
              {totalContainersSynced}
            </ThemedText>
            <ThemedText style={[styles.statLabel, { color: theme.textMuted }]}>
              Containers
            </ThemedText>
          </View>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: Spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 500,
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.xl,
    gap: Spacing.lg,
    ...Shadows.card,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
  },
  syncButton: {
    minHeight: 52,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  syncButtonText: {
    fontWeight: '700',
    fontSize: 16,
    textAlign: 'center',
  },
  buttonIcon: {
    marginRight: 8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  statCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
});
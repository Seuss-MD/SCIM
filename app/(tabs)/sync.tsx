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
  const [status, setStatus] = useState('Sync missing records between this device and the cloud.');
  const [result, setResult] = useState<SyncResult | null>(null);

  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  async function handleSync() {
    try {
      setIsSyncing(true);
      setStatus('Syncing...');

      const syncResult = await syncMissingData();

      setResult(syncResult);
      setStatus('Sync complete.');
    } catch (error: any) {
      console.error('Sync failed:', error);
      setStatus(error?.message ?? 'Sync failed.');
    } finally {
      setIsSyncing(false);
    }
  }

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
        <View style={styles.headerBlock}>
          <ThemedText style={[styles.title, { color: theme.text }]}>
            Sync
          </ThemedText>
          <ThemedText style={[styles.subtitle, { color: theme.textMuted }]}>
            Add what is missing on this device from the cloud, and add what is
            missing in the cloud from this device.
          </ThemedText>
        </View>

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
              <Ionicons
                name="sync-circle"
                size={20}
                color="#fff"
                style={styles.buttonIcon}
              />
              <ThemedText style={[styles.syncButtonText, { color: '#fff' }]}>
                Sync Now
              </ThemedText>
            </>
          )}
        </TouchableOpacity>

        <View
          style={[
            styles.statusBox,
            {
              backgroundColor: theme.background,
              borderColor: theme.border,
            },
          ]}
        >
          <ThemedText style={[styles.statusText, { color: theme.text }]}>
            {status}
          </ThemedText>
        </View>

        <View style={styles.statsGrid}>
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
              {result?.pushedContainers ?? 0}
            </ThemedText>
            <ThemedText style={[styles.statLabel, { color: theme.textMuted }]}>
              Containers pushed
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
              {result?.pushedItems ?? 0}
            </ThemedText>
            <ThemedText style={[styles.statLabel, { color: theme.textMuted }]}>
              Items pushed
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
              {result?.pulledContainers ?? 0}
            </ThemedText>
            <ThemedText style={[styles.statLabel, { color: theme.textMuted }]}>
              Containers pulled
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
              {result?.pulledItems ?? 0}
            </ThemedText>
            <ThemedText style={[styles.statLabel, { color: theme.textMuted }]}>
              Items pulled
            </ThemedText>
          </View>
        </View>

        <ThemedText style={[styles.note, { color: theme.textMuted }]}>
          This sync only handles missing records. It does not merge edits or deletes yet.
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: Spacing.xl,
  },
  card: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.xl,
    gap: Spacing.lg,
    ...Shadows.card,
  },
  headerBlock: {
    gap: 6,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
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
  },
  buttonIcon: {
    marginRight: 8,
  },
  statusBox: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  statusText: {
    fontSize: 15,
    lineHeight: 21,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  statCard: {
    width: '47%',
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
    minHeight: 94,
    justifyContent: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 14,
    marginTop: 4,
  },
  note: {
    fontSize: 13,
    lineHeight: 19,
  },
});
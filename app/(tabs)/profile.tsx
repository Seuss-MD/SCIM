import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import { signOut } from 'firebase/auth';
import { Ionicons } from '@expo/vector-icons';

import { auth } from '../../firebase';
import { useAuthUser } from '@/components/authGate';
import { Colors, Radius, Spacing, Shadows } from '@/constants/theme';

export default function ProfileScreen() {
  const { user, loading } = useAuthUser();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  const handleLogout = async () => {
    await signOut(auth);
  };

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          styles.centered,
          { backgroundColor: theme.background },
        ]}
      >
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.textMuted }]}>
          Loading...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.headerBlock}>
        <Text style={[styles.title, { color: theme.text }]}>Profile</Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>
          Account details and sign out
        </Text>
      </View>

      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
          },
        ]}
      >
        <View
          style={[
            styles.avatarWrap,
            { backgroundColor: theme.surfaceAlt, borderColor: theme.border },
          ]}
        >
          <Ionicons name="person-outline" size={28} color={theme.text} />
        </View>

        <View style={styles.infoBlock}>
          <Text style={[styles.label, { color: theme.textMuted }]}>Email</Text>
          <Text style={[styles.value, { color: theme.text }]}>
            {user?.email ?? 'Not signed in'}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.logoutButton,
          {
            backgroundColor: theme.danger,
          },
        ]}
        onPress={handleLogout}
        activeOpacity={0.85}
      >
        <Ionicons
          name="log-out-outline"
          size={18}
          color={theme.dangerText}
          style={styles.logoutIcon}
        />
        <Text style={[styles.logoutText, { color: theme.dangerText }]}>
          Log Out
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.xl,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerBlock: {
    marginBottom: Spacing.xl,
  },
  eyebrow: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  card: {
    borderRadius: Radius.lg,
    padding: 20,
    borderWidth: 1,
    marginBottom: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    ...Shadows.card,
  },
  avatarWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBlock: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    marginBottom: 4,
  },
  value: {
    fontSize: 18,
    fontWeight: '700',
  },
  logoutButton: {
    minHeight: 52,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  logoutIcon: {
    marginRight: 8,
  },
  logoutText: {
    fontWeight: '700',
    fontSize: 16,
  },
});
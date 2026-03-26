import { Link } from 'expo-router';
import { StyleSheet, useColorScheme, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Radius, Spacing, Shadows } from '@/constants/theme';

export default function ModalScreen() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
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
            styles.iconWrap,
            { backgroundColor: theme.surfaceAlt, borderColor: theme.border },
          ]}
        >
          <Ionicons name="information-circle-outline" size={30} color={theme.text} />
        </View>

        <ThemedText style={[styles.title, { color: theme.text }]}>
          This is a modal
        </ThemedText>

        <ThemedText style={[styles.subtitle, { color: theme.textMuted }]}>
          You can use this screen for extra details or quick actions.
        </ThemedText>

        <Link href="/" dismissTo asChild>
          <View
            style={[
              styles.button,
              { backgroundColor: theme.primary },
            ]}
          >
            <ThemedText style={[styles.buttonText, { color: theme.primaryText }]}>
              Go to home screen
            </ThemedText>
          </View>
        </Link>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: '100%',
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.md,
    ...Shadows.card,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  button: {
    marginTop: 8,
    minHeight: 50,
    minWidth: 200,
    paddingHorizontal: 20,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
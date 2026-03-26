// app/_layout.tsx
import { ThemeProvider, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { Stack, router, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '../firebase';
import { Colors } from '@/constants/theme';

export default function RootLayout() {
  const colorScheme = useColorScheme() ?? 'light';
  const segments = useSegments();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const theme = Colors[colorScheme];

  const navigationTheme = useMemo(() => {
    const baseTheme = colorScheme === 'dark' ? DarkTheme : DefaultTheme;

    return {
      ...baseTheme,
      colors: {
        ...baseTheme.colors,
        background: theme.background,
        card: theme.surface,
        text: theme.text,
        border: theme.border,
        primary: theme.primary,
        notification: theme.danger,
      },
    };
  }, [colorScheme, theme]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (loading) return;

    const inAuthScreens =
      segments[0] === 'login' || segments[0] === 'signup';

    if (!user && !inAuthScreens) {
      router.replace('/login');
    } else if (user && inAuthScreens) {
      router.replace('/(tabs)');
    }
  }, [user, loading, segments]);

  if (loading) {
    return null;
  }

  return (
    <ThemeProvider value={navigationTheme}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.background },
          headerStyle: {
            backgroundColor: theme.surface,
          },
          headerTintColor: theme.text,
          headerTitleStyle: {
            color: theme.text,
            fontWeight: '700',
          },
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />

        <Stack.Screen name="(tabs)" />

        <Stack.Screen
          name="container/[id]"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
            headerShown: true,
          }}
        />

        <Stack.Screen
          name="container/create"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
            title: 'Create Container',
            headerShown: true,
          }}
        />

        <Stack.Screen
          name="item/[id]"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
            headerShown: true,
          }}
        />

        <Stack.Screen
          name="item/create"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
            title: 'Create Item',
            headerShown: true,
          }}
        />

        <Stack.Screen
          name="item/edit"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
            title: 'Edit Item',
            headerShown: true,
          }}
        />

        <Stack.Screen
          name="item/select-container"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
            title: 'Select Container',
            headerShown: true,
          }}
        />
      </Stack>

      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}
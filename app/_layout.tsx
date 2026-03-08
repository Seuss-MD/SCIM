import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, router, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '../firebase';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const segments = useSegments();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

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
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
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
      </Stack>

      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
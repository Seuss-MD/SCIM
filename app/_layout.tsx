// app/_layout.tsx
import { ThemeProvider, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { Stack, router, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useEffect, useMemo, useRef, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import * as Notifications from 'expo-notifications';
import type { EventSubscription, Notification, NotificationResponse } from 'expo-notifications';

import { auth } from '../firebase';
import { Colors } from '@/constants/theme';

export default function RootLayout() {
  const colorScheme = useColorScheme() ?? 'light';
  const segments = useSegments();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const notificationListener = useRef<EventSubscription | null>(null);
  const responseListener = useRef<EventSubscription | null>(null);

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
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification: Notification) => {
        //console.log('Notification received:', notification);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener(
        (response: NotificationResponse) => {
          //console.log('Notification tapped:', response);

          const data = response.notification.request.content.data;
          const screen = typeof data?.screen === 'string' ? data.screen : null;
          const id = typeof data?.id === 'string' ? data.id : null;

          if (screen === 'profile') {
            router.push('/(tabs)/profile');
            return;
          }

          if (screen === 'item' && id) {
            router.push(`/item/${id}`);
            return;
          }

          if (screen === 'container' && id) {
            router.push(`/container/${id}`);
          }
        }
      );

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
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
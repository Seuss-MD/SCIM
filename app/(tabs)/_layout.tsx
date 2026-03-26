// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { HapticTab } from '@/components/haptic-tab';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { initDatabase } from '@/components/database';

export default function TabLayout() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  useEffect(() => {
    initDatabase();
  }, []);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarActiveTintColor: theme.tabIconSelected,
        tabBarInactiveTintColor: theme.tabIconDefault,
        tabBarShowLabel: true,
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
          borderTopWidth: 1,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              size={24}
              color={color}
              name={focused ? 'home' : 'home-outline'}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="storage"
        options={{
          title: 'Storage',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              size={24}
              color={color}
              name={focused ? 'folder' : 'folder-outline'}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              size={24}
              color={color}
              name={focused ? 'person' : 'person-outline'}
            />
          ),
        }}
      />
    </Tabs>
  );
}
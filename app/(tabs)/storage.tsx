import { useState, useCallback } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

import { getAllContainers } from '@/components/database';

export default function StorageScreen() {
  const router = useRouter();
  const [containers, setContainers] = useState<any[]>([]);

  const loadContainers = () => {
    const data = getAllContainers();
    setContainers(data);
  };

  // 🔥 This reloads every time screen comes back into focus
  useFocusEffect(
    useCallback(() => {
      loadContainers();
    }, [])
  );

  return (
    <ParallaxScrollView
      headerTitle="Containers"

      headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
    >
      <ThemedView style={styles.container}>

        <TouchableOpacity
          style={styles.createButton}
          activeOpacity={0.8}
          onPress={() => router.push('/container/create')}
        >
          <View style={styles.buttonContent}>
            <ThemedText style={styles.plus}>＋</ThemedText>
            <ThemedText style={styles.buttonText}>
              Create Container
            </ThemedText>
          </View>
        </TouchableOpacity>

        <ThemedText type="subtitle" style={{ marginTop: 20 }}>
          Existing Containers:
        </ThemedText>

        {containers.map((container) => (
          <ThemedText
            key={container.id}
            style={{ fontSize: 18 }}
            onPress={() =>
              router.push(`/container/${container.id}`)
            }
          >
            📁 {container.name}
          </ThemedText>
        ))}
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
  },
  createButton: {
    backgroundColor: '#4F46E5', 
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5, // Android shadow
  },

  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },

  plus: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },

});

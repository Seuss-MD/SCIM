import { useEffect, useState } from 'react';
import { Button, StyleSheet, TextInput } from 'react-native';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { insertContainer, getAllContainers } from '@/components/database';

export default function StorageScreen() {
  const [containers, setContainers] = useState<any[]>([]);
  const [name, setName] = useState('');

  const loadContainers = () => {
    const data = getAllContainers();
    setContainers(data);
  };

  const createContainer = () => {
    if (!name.trim()) return;
    insertContainer(name);
    setName('');
    loadContainers();
  };

  useEffect(() => {
    loadContainers();
  }, []);

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
    >
      <ThemedView style={styles.container}>
        <ThemedText type="title">Containers</ThemedText>

        <TextInput
          placeholder="New container name"
          placeholderTextColor={ '#888' }
          value={name}
          onChangeText={setName}
          style={styles.input}
        />

        <Button title="Create Container" onPress={createContainer} />

        <ThemedText type="subtitle" style={{ marginTop: 20 }}>
          Existing Containers:
        </ThemedText>

        {containers.map((container) => (
          <ThemedText key={container.id}>
            {container.id} — {container.name}
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
  input: {
    borderWidth: 1,
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#fff',
    
  },
});

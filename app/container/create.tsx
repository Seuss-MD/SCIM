import { useState } from 'react';
import { StyleSheet, TextInput, Button } from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedView } from '@/components/themed-view';
import { insertContainer } from '@/components/database';

export default function CreateContainer() {
  const router = useRouter();
  const [name, setName] = useState('');

  function handleCreate() {
    if (!name.trim()) return;

    insertContainer(name.trim());

    router.back(); // close modal
  }

  return (
    <ThemedView style={styles.container}>
      <TextInput
        placeholder="Container name"
        value={name}
        onChangeText={setName}
        style={styles.input}
      />

      <Button title="Create" onPress={handleCreate} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    borderRadius: 8,
  },
});

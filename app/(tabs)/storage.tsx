//storage.tsx
import { useState, useCallback } from 'react';
import { StyleSheet, TouchableOpacity, View, Image, FlatList, Dimensions, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

import { getAllContainers, deleteContainer, consoleAllData } from '@/components/database';

export default function StorageScreen() {
  const router = useRouter();
  const [containers, setContainers] = useState<any[]>([]);
  const numColumns = 2;
  const screenWidth = Dimensions.get('window').width;
  const spacing = 16;
  const imageSize =
    (screenWidth - spacing * (numColumns + 1)) / numColumns;

  const loadContainers = () => {
    const data = getAllContainers();
    setContainers(data);
    //for debugging
    //consoleAllData();

  };

  // This reloads every time screen comes back into focus
  useFocusEffect(
    useCallback(() => {
      loadContainers();
    }, [])
  );
  const handleDelete = (id: number) => {
    Alert.alert(
      'Delete Container',
      'Are you sure you want to delete this container?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteContainer(id);
            loadContainers(); // refresh list
          },
        },
      ]
    );
  };


  return (
    <ThemedView 
      style={{ flex: 1 }}
      >
      <FlatList
        data={containers}
        keyExtractor={(item) => item.id.toString()}
        numColumns={numColumns}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={{ gap: spacing }}


        ListHeaderComponent={
          <View style={{ marginBottom: 20 }}>
            
            <ThemedText style={styles.title}>
              Containers
            </ThemedText>

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

          </View>
        }

        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.imageWrapper}
            onPress={() => router.push(`/container/${item.id}`)}
            onLongPress={() => handleDelete(item.id)}  
            delayLongPress={400}
            activeOpacity={0.8}
          >
            <Image
              source={{ uri: item.image_uri }}
              style={[
                styles.image,
                { width: imageSize, height: imageSize }
              ]}
            />

          </TouchableOpacity>
        )}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
  },
  title: {
    paddingTop: 30,
    fontSize: 56,
    fontWeight: '700',
    marginBottom: 20,
    lineHeight: 64,
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
  imageWrapper: {
    marginBottom: 16,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },


  image: {
    borderRadius: 14,
    backgroundColor: '#eee',
  },


  listContent: {
    padding: 16,
  },


});

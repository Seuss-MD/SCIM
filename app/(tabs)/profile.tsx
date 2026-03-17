import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';
import { useAuthUser } from "@/components/authGate";


export default function ProfileScreen() {
  const { user, loading } = useAuthUser();
  const handleLogout = async () => {
    await signOut(auth);
  };
  if (loading) {
    return (
      <View style={styles.container}>
        <Text >Loading...</Text>
      </View>
    );
  }


  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>
          {user ? user.email : "not signed in"}
        </Text>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#f4f6f8',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    color: '#777',
  },
  value: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 4,
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  ActivityIndicator,
  TextInput,
  Switch,
  Alert,
  Image,
  ScrollView,
} from 'react-native';
import { signOut, updateEmail, updatePassword } from 'firebase/auth';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

import { auth } from '../../firebase';
import { useAuthUser } from '@/components/authGate';
import { Colors, Radius, Spacing, Shadows } from '@/constants/theme';

export default function ProfileScreen() {
  const { user, loading } = useAuthUser();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState(user?.email ?? '');
  const [newPassword, setNewPassword] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [createGroupName, setCreateGroupName] = useState('');
  const [joinGroupCode, setJoinGroupCode] = useState('');

  const handleLogout = async () => {
    await signOut(auth);
  };

  const pickImageFromLibrary = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        'Permission needed',
        'Please allow photo library access to choose a profile picture.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.length > 0) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const takePhotoWithCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        'Permission needed',
        'Please allow camera access to take a profile picture.'
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.length > 0) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const handleChangeEmail = async () => {
    if (!auth.currentUser || !newEmail.trim()) return;

    try {
      setSavingEmail(true);
      await updateEmail(auth.currentUser, newEmail.trim());
      Alert.alert('Success', 'Your email has been updated.');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Could not update email.');
    } finally {
      setSavingEmail(false);
    }
  };

  const handleChangePassword = async () => {
    if (!auth.currentUser || !newPassword.trim()) return;

    try {
      setSavingPassword(true);
      await updatePassword(auth.currentUser, newPassword.trim());
      setNewPassword('');
      Alert.alert('Success', 'Your password has been updated.');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Could not update password.');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleToggleNotifications = (value: boolean) => {
    setNotificationsEnabled(value);
  };

  const handleCreateGroup = () => {
    if (!createGroupName.trim()) {
      Alert.alert('Missing group name', 'Enter a group name first.');
      return;
    }

    Alert.alert(
      'Group created',
      `Group "${createGroupName.trim()}" was created.`
    );
    setCreateGroupName('');
  };

  const handleJoinGroup = () => {
    if (!joinGroupCode.trim()) {
      Alert.alert('Missing code', 'Enter a group code first.');
      return;
    }

    Alert.alert('Joined group', `Joined group with code ${joinGroupCode.trim()}.`);
    setJoinGroupCode('');
  };

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          styles.centered,
          { backgroundColor: theme.background },
        ]}
      >
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.textMuted }]}>
          Loading...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerBlock}>
        <Text style={[styles.title, { color: theme.text }]}>Profile</Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>
          Manage your account, groups, and notifications
        </Text>
      </View>

      <View
        style={[
          styles.profileCard,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
          },
        ]}
      >
        <View
          style={[
            styles.avatarOuter,
            { backgroundColor: theme.surfaceAlt, borderColor: theme.border },
          ]}
        >
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.avatarImage} />
          ) : (
            <Ionicons name="person-outline" size={34} color={theme.text} />
          )}
        </View>

        <View style={styles.infoBlock}>
          <Text style={[styles.nameText, { color: theme.text }]}>
            {user?.email?.split('@')[0] ?? 'Profile'}
          </Text>
          <Text style={[styles.emailText, { color: theme.textMuted }]}>
            {user?.email ?? 'Not signed in'}
          </Text>
        </View>
      </View>

      <View
        style={[
          styles.section,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
          },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Profile Info
        </Text>

        <Text style={[styles.label, { color: theme.textMuted }]}>
          Profile Picture
        </Text>

        <View style={styles.photoActionsRow}>
          <TouchableOpacity
            style={[styles.smallButton, { backgroundColor: theme.primary }]}
            onPress={pickImageFromLibrary}
            activeOpacity={0.85}
          >
            <Ionicons name="images-outline" size={16} color="#fff" />
            <Text style={styles.smallButtonText}>Upload</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.smallButton, { backgroundColor: theme.primary }]}
            onPress={takePhotoWithCamera}
            activeOpacity={0.85}
          >
            <Ionicons name="camera-outline" size={16} color="#fff" />
            <Text style={styles.smallButtonText}>Take Photo</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.label, { color: theme.textMuted }]}>
          Change Email
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.surfaceAlt,
              borderColor: theme.border,
              color: theme.text,
            },
          ]}
          placeholder="Enter new email"
          placeholderTextColor={theme.textMuted}
          value={newEmail}
          onChangeText={setNewEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.primary }]}
          onPress={handleChangeEmail}
          activeOpacity={0.85}
          disabled={savingEmail}
        >
          <Text style={styles.actionButtonText}>
            {savingEmail ? 'Updating...' : 'Update Email'}
          </Text>
        </TouchableOpacity>

        <Text
          style={[
            styles.label,
            { color: theme.textMuted, marginTop: 16 },
          ]}
        >
          Change Password
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.surfaceAlt,
              borderColor: theme.border,
              color: theme.text,
            },
          ]}
          placeholder="Enter new password"
          placeholderTextColor={theme.textMuted}
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
        />
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.primary }]}
          onPress={handleChangePassword}
          activeOpacity={0.85}
          disabled={savingPassword}
        >
          <Text style={styles.actionButtonText}>
            {savingPassword ? 'Updating...' : 'Update Password'}
          </Text>
        </TouchableOpacity>
      </View>

      <View
        style={[
          styles.section,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
          },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Create Group
        </Text>

        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.surfaceAlt,
              borderColor: theme.border,
              color: theme.text,
            },
          ]}
          placeholder="Enter group name"
          placeholderTextColor={theme.textMuted}
          value={createGroupName}
          onChangeText={setCreateGroupName}
        />

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.primary }]}
          onPress={handleCreateGroup}
          activeOpacity={0.85}
        >
          <Text style={styles.actionButtonText}>Create Group</Text>
        </TouchableOpacity>
      </View>

      <View
        style={[
          styles.section,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
          },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Join Group
        </Text>

        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.surfaceAlt,
              borderColor: theme.border,
              color: theme.text,
            },
          ]}
          placeholder="Enter invite code"
          placeholderTextColor={theme.textMuted}
          value={joinGroupCode}
          onChangeText={setJoinGroupCode}
          autoCapitalize="characters"
        />

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.primary }]}
          onPress={handleJoinGroup}
          activeOpacity={0.85}
        >
          <Text style={styles.actionButtonText}>Join Group</Text>
        </TouchableOpacity>
      </View>

      <View
        style={[
          styles.section,
          styles.notificationRow,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
          },
        ]}
      >
        <View style={{ flex: 1 }}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Notifications
          </Text>
          <Text style={[styles.notificationText, { color: theme.textMuted }]}>
            Turn app notifications on or off
          </Text>
        </View>

        <Switch
          value={notificationsEnabled}
          onValueChange={handleToggleNotifications}
          trackColor={{ false: '#999', true: theme.primary }}
        />
      </View>

      <TouchableOpacity
        style={[
          styles.logoutButton,
          {
            backgroundColor: theme.danger,
          },
        ]}
        onPress={handleLogout}
        activeOpacity={0.85}
      >
        <Ionicons
          name="log-out-outline"
          size={18}
          color={theme.dangerText}
          style={styles.logoutIcon}
        />
        <Text style={[styles.logoutText, { color: theme.dangerText }]}>
          Log Out
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.xl,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerBlock: {
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  profileCard: {
    borderRadius: Radius.lg,
    padding: 20,
    borderWidth: 1,
    marginBottom: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    ...Shadows.card,
  },
  avatarOuter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  infoBlock: {
    flex: 1,
  },
  nameText: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  emailText: {
    fontSize: 14,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
  },
  section: {
    borderRadius: Radius.lg,
    padding: 16,
    borderWidth: 1,
    marginBottom: Spacing.lg,
    ...Shadows.card,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 12,
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    fontSize: 15,
    marginBottom: 14,
  },
  actionButton: {
    minHeight: 48,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  photoActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  smallButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 42,
    paddingHorizontal: 14,
    borderRadius: Radius.md,
    gap: 8,
  },
  smallButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  notificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  notificationText: {
    fontSize: 14,
    lineHeight: 20,
  },
  logoutButton: {
    minHeight: 52,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  logoutIcon: {
    marginRight: 8,
  },
  logoutText: {
    fontWeight: '700',
    fontSize: 16,
  },
});
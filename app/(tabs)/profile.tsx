import React, { useEffect, useState } from 'react';
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
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

import { auth, db } from '../../firebase';
import { useAuthUser } from '@/components/authGate';
import { Colors, Radius, Spacing, Shadows } from '@/constants/theme';
import { registerForPushNotificationsAsync } from '@/functions/lib/notifications';

export default function ProfileScreen() {
  const { user, loading } = useAuthUser();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState(user?.email ?? '');
  const [newPassword, setNewPassword] = useState('');

  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notifyOnNewItems, setNotifyOnNewItems] = useState(true);
  const [notifyOnNewContainers, setNotifyOnNewContainers] = useState(true);
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [registeringPush, setRegisteringPush] = useState(false);
  const [loadingPrefs, setLoadingPrefs] = useState(true);

  const [savingEmail, setSavingEmail] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [createGroupName, setCreateGroupName] = useState('');
  const [joinGroupCode, setJoinGroupCode] = useState('');

  useEffect(() => {
    const loadNotificationPrefs = async () => {
      if (!auth.currentUser) {
        setLoadingPrefs(false);
        return;
      }

      try {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        const snap = await getDoc(userRef);

        if (snap.exists()) {
          const data = snap.data();

          setNotificationsEnabled(Boolean(data.notificationsEnabled));
          setNotifyOnNewItems(data.notifyOnNewItems !== false);
          setNotifyOnNewContainers(data.notifyOnNewContainers !== false);
          setExpoPushToken(data.expoPushToken ?? null);
        }
      } catch (error) {
        console.error('Failed to load notification prefs:', error);
      } finally {
        setLoadingPrefs(false);
      }
    };

    loadNotificationPrefs();
  }, []);

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
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
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

  const saveNotificationPrefs = async (updates: Record<string, unknown>) => {
    if (!auth.currentUser) return;

    await setDoc(
      doc(db, 'users', auth.currentUser.uid),
      {
        email: auth.currentUser.email ?? null,
        updatedAt: serverTimestamp(),
        ...updates,
      },
      { merge: true }
    );
  };

  const enableNotifications = async () => {
    if (!auth.currentUser) {
      Alert.alert('Not signed in', 'You need to be signed in first.');
      return;
    }

    try {
      setRegisteringPush(true);

      const token = await registerForPushNotificationsAsync();

      setExpoPushToken(token);
      setNotificationsEnabled(true);

      await saveNotificationPrefs({
        expoPushToken: token,
        notificationsEnabled: true,
        notifyOnNewItems,
        notifyOnNewContainers,
      });

      Alert.alert(
        'Notifications enabled',
        'Push notifications are enabled on this device.'
      );
    } catch (error: any) {
      setNotificationsEnabled(false);
      Alert.alert(
        'Notifications error',
        error?.message ?? 'Could not enable notifications.'
      );
    } finally {
      setRegisteringPush(false);
    }
  };

  const disableNotifications = async () => {
    if (!auth.currentUser) {
      setNotificationsEnabled(false);
      setExpoPushToken(null);
      return;
    }

    try {
      await saveNotificationPrefs({
        notificationsEnabled: false,
        expoPushToken: null,
      });

      setNotificationsEnabled(false);
      setExpoPushToken(null);

      Alert.alert(
        'Notifications disabled',
        'Push notifications were disabled for this device.'
      );
    } catch (error: any) {
      Alert.alert(
        'Error',
        error?.message ?? 'Could not disable notifications.'
      );
    }
  };

  const handleToggleNotifications = async (value: boolean) => {
    if (value) {
      await enableNotifications();
    } else {
      await disableNotifications();
    }
  };

  const handleToggleNewItems = async (value: boolean) => {
    setNotifyOnNewItems(value);

    try {
      await saveNotificationPrefs({
        notifyOnNewItems: value,
      });
    } catch (error: any) {
      setNotifyOnNewItems(!value);
      Alert.alert('Error', error?.message ?? 'Could not save preference.');
    }
  };

  const handleToggleNewContainers = async (value: boolean) => {
    setNotifyOnNewContainers(value);

    try {
      await saveNotificationPrefs({
        notifyOnNewContainers: value,
      });
    } catch (error: any) {
      setNotifyOnNewContainers(!value);
      Alert.alert('Error', error?.message ?? 'Could not save preference.');
    }
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

  if (loading || loadingPrefs) {
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
      </View>

      <View
        style={[
          styles.profileCard,
          {
            backgroundColor: theme.surfaceAlt,
            borderColor: theme.border,
          },
        ]}
      >
        <View
          style={[
            styles.avatarOuter,
            { backgroundColor: theme.surface, borderColor: theme.border },
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

        <Text style={[styles.label, { color: theme.textMuted, marginTop: 16 }]}>
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
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
          },
        ]}
      >
        <View style={styles.notificationHeaderRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Notifications
            </Text>
            <Text style={[styles.notificationText, { color: theme.textMuted }]}>
              Choose which alerts you want
            </Text>
          </View>

          <Switch
            value={notificationsEnabled}
            onValueChange={handleToggleNotifications}
            trackColor={{ false: '#999', true: theme.primary }}
            disabled={registeringPush}
          />
        </View>

        <View style={styles.preferenceRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.preferenceTitle, { color: theme.text }]}>
              New items
            </Text>
            <Text style={[styles.preferenceText, { color: theme.textMuted }]}>
              Notify me when an item is added
            </Text>
          </View>

          <Switch
            value={notifyOnNewItems}
            onValueChange={handleToggleNewItems}
            trackColor={{ false: '#999', true: theme.primary }}
            disabled={!notificationsEnabled}
          />
        </View>

        <View style={styles.preferenceRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.preferenceTitle, { color: theme.text }]}>
              New containers
            </Text>
            <Text style={[styles.preferenceText, { color: theme.textMuted }]}>
              Notify me when a container is created
            </Text>
          </View>

          <Switch
            value={notifyOnNewContainers}
            onValueChange={handleToggleNewContainers}
            trackColor={{ false: '#999', true: theme.primary }}
            disabled={!notificationsEnabled}
          />
        </View>

        {expoPushToken ? (
          <View
            style={[
              styles.tokenBox,
              {
                backgroundColor: theme.surfaceAlt,
                borderColor: theme.border,
              },
            ]}
          >
            <Text style={[styles.tokenLabel, { color: theme.textMuted }]}>
              Expo Push Token
            </Text>
            <Text selectable style={[styles.tokenValue, { color: theme.text }]}>
              {expoPushToken}
            </Text>
          </View>
        ) : null}
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
    paddingTop: Spacing.lg,
    fontSize: 48,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 6,
    lineHeight: 52,
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
  notificationHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  notificationText: {
    fontSize: 14,
    lineHeight: 20,
  },
  preferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 14,
    paddingBottom: 8,
  },
  preferenceTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  preferenceText: {
    fontSize: 13,
    lineHeight: 18,
  },
  tokenBox: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: 12,
    marginTop: 14,
  },
  tokenLabel: {
    fontSize: 13,
    marginBottom: 6,
  },
  tokenValue: {
    fontSize: 12,
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
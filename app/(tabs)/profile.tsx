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
import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
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
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [joiningGroup, setJoiningGroup] = useState(false);

  const [groupId, setGroupId] = useState<string | null>(null);
  const [groupName, setGroupName] = useState<string | null>(null);
  const [groupCode, setGroupCode] = useState<string | null>(null);

  const isInGroup = Boolean(groupId || groupName || groupCode);

  useEffect(() => {
    const loadUserPrefs = async () => {
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

          const loadedGroupId =
            typeof data.groupId === 'string'
              ? data.groupId
              : typeof data.group?.id === 'string'
              ? data.group.id
              : null;

          const loadedGroupName =
            typeof data.groupName === 'string'
              ? data.groupName
              : typeof data.group?.name === 'string'
              ? data.group.name
              : null;

          const loadedGroupCode =
            typeof data.groupCode === 'string'
              ? data.groupCode
              : typeof data.group?.code === 'string'
              ? data.group.code
              : null;

          setGroupId(loadedGroupId);
          setGroupName(loadedGroupName);
          setGroupCode(loadedGroupCode);
        }
      } catch (error) {
        console.error('Failed to load user prefs:', error);
      } finally {
        setLoadingPrefs(false);
      }
    };

    loadUserPrefs();
  }, []);

  const generateRandomGroupCode = (length = 6) => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';

    for (let i = 0; i < length; i += 1) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return result;
  };

  const getUniqueGroupCode = async () => {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const code = generateRandomGroupCode(6);
      const q = query(collection(db, 'groups'), where('code', '==', code));
      const snap = await getDocs(q);

      if (snap.empty) return code;
    }

    throw new Error('Could not generate a unique group code. Please try again.');
  };

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
      Alert.alert('Success', 'Email updated.');
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
      Alert.alert('Success', 'Password updated.');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Could not update password.');
    } finally {
      setSavingPassword(false);
    }
  };

  const saveUserPrefs = async (updates: Record<string, unknown>) => {
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

      await saveUserPrefs({
        expoPushToken: token,
        notificationsEnabled: true,
        notifyOnNewItems,
        notifyOnNewContainers,
      });

      Alert.alert('Notifications on', 'Push notifications are enabled.');
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
      await saveUserPrefs({
        notificationsEnabled: false,
        expoPushToken: null,
      });

      setNotificationsEnabled(false);
      setExpoPushToken(null);

      Alert.alert('Notifications off', 'Push notifications are disabled.');
    } catch (error: any) {
      Alert.alert('Error', error?.message ?? 'Could not disable notifications.');
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
      await saveUserPrefs({
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
      await saveUserPrefs({
        notifyOnNewContainers: value,
      });
    } catch (error: any) {
      setNotifyOnNewContainers(!value);
      Alert.alert('Error', error?.message ?? 'Could not save preference.');
    }
  };

  const handleCreateGroup = async () => {
    if (!auth.currentUser) {
      Alert.alert('Not signed in', 'You need to be signed in first.');
      return;
    }

    const trimmedName = createGroupName.trim();

    if (!trimmedName) {
      Alert.alert('Missing group name', 'Enter a group name first.');
      return;
    }

    if (isInGroup) {
      Alert.alert('Already in a group', 'Leave your current group first.');
      return;
    }

    try {
      setCreatingGroup(true);

      const code = await getUniqueGroupCode();

      const groupRef = await addDoc(collection(db, 'groups'), {
        name: trimmedName,
        code,
        ownerId: auth.currentUser.uid,
        members: [auth.currentUser.uid],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await saveUserPrefs({
        groupId: groupRef.id,
        groupName: trimmedName,
        groupCode: code,
      });

      setGroupId(groupRef.id);
      setGroupName(trimmedName);
      setGroupCode(code);
      setCreateGroupName('');

      Alert.alert('Group created', `You joined "${trimmedName}".`);
    } catch (error: any) {
      Alert.alert('Error', error?.message ?? 'Could not create group.');
    } finally {
      setCreatingGroup(false);
    }
  };

  const handleJoinGroup = async () => {
    if (!auth.currentUser) {
      Alert.alert('Not signed in', 'You need to be signed in first.');
      return;
    }

    const trimmedCode = joinGroupCode.trim().toUpperCase();

    if (!trimmedCode) {
      Alert.alert('Missing code', 'Enter a group code first.');
      return;
    }

    if (isInGroup) {
      Alert.alert('Already in a group', 'Leave your current group first.');
      return;
    }

    try {
      setJoiningGroup(true);

      const q = query(collection(db, 'groups'), where('code', '==', trimmedCode));
      const snap = await getDocs(q);

      if (snap.empty) {
        Alert.alert('Group not found', 'That code does not exist.');
        return;
      }

      const groupDoc = snap.docs[0];
      const groupData = groupDoc.data();

      await updateDoc(doc(db, 'groups', groupDoc.id), {
        members: arrayUnion(auth.currentUser.uid),
        updatedAt: serverTimestamp(),
      });

      await saveUserPrefs({
        groupId: groupDoc.id,
        groupName:
          typeof groupData.name === 'string' ? groupData.name : 'Group',
        groupCode:
          typeof groupData.code === 'string' ? groupData.code : trimmedCode,
      });

      setGroupId(groupDoc.id);
      setGroupName(
        typeof groupData.name === 'string' ? groupData.name : 'Group'
      );
      setGroupCode(
        typeof groupData.code === 'string' ? groupData.code : trimmedCode
      );
      setJoinGroupCode('');

      Alert.alert('Joined group', 'You joined successfully.');
    } catch (error: any) {
      Alert.alert('Error', error?.message ?? 'Could not join group.');
    } finally {
      setJoiningGroup(false);
    }
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
            <Ionicons name="person-outline" size={30} color={theme.text} />
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
          styles.mainCard,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
          },
        ]}
      >
        <Text style={[styles.cardTitle, { color: theme.text }]}>Settings</Text>

        <View
          style={[
            styles.block,
            {
              backgroundColor: theme.surfaceAlt,
              borderColor: theme.border,
            },
          ]}
        >
          <View style={styles.blockHeader}>
            <Text style={[styles.blockTitle, { color: theme.text }]}>Photo</Text>
          </View>

          <View style={styles.photoActionsRow}>
            <TouchableOpacity
              style={[styles.smallButton, { backgroundColor: theme.primary }]}
              onPress={pickImageFromLibrary}
              activeOpacity={0.88}
            >
              <Ionicons name="images-outline" size={16} color="#fff" />
              <Text style={styles.smallButtonText}>Upload</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.smallButton, { backgroundColor: theme.primary }]}
              onPress={takePhotoWithCamera}
              activeOpacity={0.88}
            >
              <Ionicons name="camera-outline" size={16} color="#fff" />
              <Text style={styles.smallButtonText}>Camera</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View
          style={[
            styles.block,
            {
              backgroundColor: theme.surfaceAlt,
              borderColor: theme.border,
            },
          ]}
        >
          <View style={styles.blockHeader}>
            <Text style={[styles.blockTitle, { color: theme.text }]}>Email</Text>
          </View>

          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                color: theme.text,
              },
            ]}
            placeholder="New email"
            placeholderTextColor={theme.textMuted}
            value={newEmail}
            onChangeText={setNewEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.primary }]}
            onPress={handleChangeEmail}
            activeOpacity={0.88}
            disabled={savingEmail}
          >
            <Text style={styles.actionButtonText}>
              {savingEmail ? 'Saving...' : 'Update Email'}
            </Text>
          </TouchableOpacity>
        </View>

        <View
          style={[
            styles.block,
            {
              backgroundColor: theme.surfaceAlt,
              borderColor: theme.border,
            },
          ]}
        >
          <View style={styles.blockHeader}>
            <Text style={[styles.blockTitle, { color: theme.text }]}>
              Password
            </Text>
          </View>

          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                color: theme.text,
              },
            ]}
            placeholder="New password"
            placeholderTextColor={theme.textMuted}
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.primary }]}
            onPress={handleChangePassword}
            activeOpacity={0.88}
            disabled={savingPassword}
          >
            <Text style={styles.actionButtonText}>
              {savingPassword ? 'Saving...' : 'Update Password'}
            </Text>
          </TouchableOpacity>
        </View>

        <View
          style={[
            styles.block,
            {
              backgroundColor: theme.surfaceAlt,
              borderColor: theme.border,
            },
          ]}
        >
          <View style={styles.switchRow}>
            <Text style={[styles.blockTitle, { color: theme.text }]}>
              Notifications
            </Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleToggleNotifications}
              trackColor={{ false: '#999', true: theme.primary }}
              disabled={registeringPush}
            />
          </View>

          <View style={styles.preferenceRow}>
            <Text style={[styles.preferenceLabel, { color: theme.text }]}>
              New items
            </Text>
            <Switch
              value={notifyOnNewItems}
              onValueChange={handleToggleNewItems}
              trackColor={{ false: '#999', true: theme.primary }}
              disabled={!notificationsEnabled}
            />
          </View>

          <View style={[styles.preferenceRow, { marginBottom: 0 }]}>
            <Text style={[styles.preferenceLabel, { color: theme.text }]}>
              New containers
            </Text>
            <Switch
              value={notifyOnNewContainers}
              onValueChange={handleToggleNewContainers}
              trackColor={{ false: '#999', true: theme.primary }}
              disabled={!notificationsEnabled}
            />
          </View>
        </View>

        <View
          style={[
            styles.block,
            {
              backgroundColor: theme.surfaceAlt,
              borderColor: theme.border,
            },
          ]}
        >
          <View style={styles.blockHeader}>
            <Text style={[styles.blockTitle, { color: theme.text }]}>Group</Text>
          </View>

          {isInGroup ? (
            <View style={styles.groupInfoWrap}>
              <View style={styles.groupInfoRow}>
                <Text style={[styles.groupKey, { color: theme.textMuted }]}>
                  Name
                </Text>
                <Text style={[styles.groupValue, { color: theme.text }]}>
                  {groupName || '—'}
                </Text>
              </View>

              <View style={styles.groupInfoRow}>
                <Text style={[styles.groupKey, { color: theme.textMuted }]}>
                  Code
                </Text>
                <Text style={[styles.groupValue, { color: theme.text }]}>
                  {groupCode || '—'}
                </Text>
              </View>
            </View>
          ) : (
            <>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                    color: theme.text,
                  },
                ]}
                placeholder="Group name"
                placeholderTextColor={theme.textMuted}
                value={createGroupName}
                onChangeText={setCreateGroupName}
              />

              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: theme.primary }]}
                onPress={handleCreateGroup}
                activeOpacity={0.88}
                disabled={creatingGroup}
              >
                <Text style={styles.actionButtonText}>
                  {creatingGroup ? 'Creating...' : 'Create Group'}
                </Text>
              </TouchableOpacity>

              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                    color: theme.text,
                    marginTop: 12,
                  },
                ]}
                placeholder="Invite code"
                placeholderTextColor={theme.textMuted}
                value={joinGroupCode}
                onChangeText={setJoinGroupCode}
                autoCapitalize="characters"
              />

              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: theme.primary }]}
                onPress={handleJoinGroup}
                activeOpacity={0.88}
                disabled={joiningGroup}
              >
                <Text style={styles.actionButtonText}>
                  {joiningGroup ? 'Joining...' : 'Join Group'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.logoutButton,
          {
            backgroundColor: theme.danger,
          },
        ]}
        onPress={handleLogout}
        activeOpacity={0.88}
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
    marginBottom: 18,
  },
  title: {
    paddingTop: Spacing.lg,
    fontSize: 42,
    fontWeight: '800',
    letterSpacing: -0.5,
    lineHeight: 46,
  },
  profileCard: {
    borderRadius: Radius.lg,
    padding: 18,
    borderWidth: 1,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    ...Shadows.card,
  },
  avatarOuter: {
    width: 68,
    height: 68,
    borderRadius: 34,
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
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 4,
  },
  emailText: {
    fontSize: 14,
  },
  mainCard: {
    borderRadius: Radius.lg,
    padding: 14,
    borderWidth: 1,
    marginBottom: 16,
    gap: 12,
    ...Shadows.card,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 2,
    paddingHorizontal: 4,
  },
  block: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: 14,
  },
  blockHeader: {
    marginBottom: 10,
  },
  blockTitle: {
    fontSize: 22,
    fontWeight: '900',
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    fontSize: 15,
    marginBottom: 12,
  },
  actionButton: {
    minHeight: 48,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  photoActionsRow: {
    flexDirection: 'row',
    gap: 10,
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
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  preferenceRow: {
    minHeight: 48,
    borderRadius: Radius.md,
    paddingHorizontal: 2,
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  preferenceLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  groupInfoWrap: {
    gap: 12,
  },
  groupInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  groupKey: {
    fontSize: 14,
    fontWeight: '600',
  },
  groupValue: {
    fontSize: 15,
    fontWeight: '800',
  },
  logoutButton: {
    minHeight: 52,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 2,
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
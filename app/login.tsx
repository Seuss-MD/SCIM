// app/login.tsx
import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  useColorScheme,
} from 'react-native';
import { router } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Ionicons } from '@expo/vector-icons';

import { auth } from '../firebase';
import { Colors, Radius, Spacing, Shadows } from '../constants/theme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing info', 'Please enter your email and password.');
      return;
    }

    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email.trim(), password);
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Login failed', error?.message ?? 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const goToSignup = () => {
    router.push('/signup');
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
          },
        ]}
      >
        <View style={styles.headerBlock}>
          <Text style={[styles.eyebrow, { color: theme.tint }]}>SCIM</Text>
          <Text style={[styles.title, { color: theme.text }]}>Welcome back</Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>
            Log in to your SCIM account
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
          placeholder="Email"
          placeholderTextColor={theme.textSoft}
          autoCapitalize="none"
          keyboardType="email-address"
          autoCorrect={false}
          value={email}
          onChangeText={setEmail}
        />

        <View
          style={[
            styles.inputContainer,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
        >
          <TextInput
            style={[styles.passwordInput, { color: theme.text }]}
            placeholder="Password"
            placeholderTextColor={theme.textSoft}
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
            autoCapitalize="none"
          />

          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeButton}
          >
            <Ionicons
              name={showPassword ? 'eye-off' : 'eye'}
              size={22}
              color={theme.textMuted}
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: theme.primary },
            loading && styles.buttonDisabled,
          ]}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={theme.primaryText} />
          ) : (
            <Text style={[styles.buttonText, { color: theme.primaryText }]}>
              Log In
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={goToSignup} activeOpacity={0.8}>
          <Text style={[styles.link, { color: theme.danger }]}>
            Don’t have an account? Sign up
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  card: {
    borderRadius: 20,
    padding: Spacing.xl,
    borderWidth: 1,
    ...Shadows.card,
  },
  headerBlock: {
    marginBottom: Spacing.xl,
    alignItems: 'center',
  },
  eyebrow: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  input: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.md,
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: 16,
  },
  eyeButton: {
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    paddingVertical: 15,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    fontWeight: '700',
    fontSize: 16,
  },
  link: {
    marginTop: 18,
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 15,
  },
});
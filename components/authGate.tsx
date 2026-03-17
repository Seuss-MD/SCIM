import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "../firebase";

export function useAuthUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });

    return unsub;
  }, []);

  return { user, loading };
}

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { loading } = useAuthUser();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return <>{children}</>;
}
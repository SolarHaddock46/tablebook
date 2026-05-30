import { Link, useRouter, type Href } from "expo-router";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { Screen, ui } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";

export default function SignupScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<"user" | "restaurant_owner">("user");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSignup() {
    setLoading(true);
    setError(null);
    try {
      await register(email.trim(), password, role, displayName.trim() || undefined);
      router.replace("/(auth)/verify-email" as Href);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen title="Регистрация" scrollable>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <Pressable
          style={[ui.card, { flex: 1, borderColor: role === "user" ? "#06b6d4" : "#334155" }]}
          onPress={() => setRole("user")}
        >
          <Text style={ui.value}>Гость</Text>
        </Pressable>
        <Pressable
          style={[ui.card, { flex: 1, borderColor: role === "restaurant_owner" ? "#06b6d4" : "#334155" }]}
          onPress={() => setRole("restaurant_owner")}
        >
          <Text style={ui.value}>Ресторан</Text>
        </Pressable>
      </View>
      <TextInput
        style={ui.input}
        placeholder="Имя"
        placeholderTextColor="#64748b"
        value={displayName}
        onChangeText={setDisplayName}
      />
      <TextInput
        style={ui.input}
        placeholder="Email"
        placeholderTextColor="#64748b"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={ui.input}
        placeholder="Password (min 8)"
        placeholderTextColor="#64748b"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      {error ? <Text style={{ color: "#f87171" }}>{error}</Text> : null}
      <Pressable style={ui.button} onPress={handleSignup} disabled={loading}>
        <Text style={ui.buttonText}>{loading ? "..." : "Создать аккаунт"}</Text>
      </Pressable>
      <Link href="/(auth)/login" style={ui.link}>
        Уже есть аккаунт
      </Link>
    </Screen>
  );
}

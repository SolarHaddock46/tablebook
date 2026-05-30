import { Link, useRouter, type Href } from "expo-router";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { Screen, ui } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoading(true);
    setError(null);
    setWarning(null);
    try {
      const result = await login(email.trim(), password);
      if (!result.email_verified) {
        setWarning("Email не подтверждён. Проверьте почту или отправьте письмо снова.");
        router.replace("/(auth)/verify-email" as Href);
        return;
      }
      router.replace("/(tabs)/search");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen title="TableBook" scrollable>
      <Text style={ui.muted}>Вход в аккаунт</Text>
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
        placeholder="Password"
        placeholderTextColor="#64748b"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      {warning ? <Text style={{ color: "#fbbf24" }}>{warning}</Text> : null}
      {error ? <Text style={{ color: "#f87171" }}>{error}</Text> : null}
      <Pressable style={ui.button} onPress={handleLogin} disabled={loading}>
        <Text style={ui.buttonText}>{loading ? "..." : "Войти"}</Text>
      </Pressable>
      <View style={{ gap: 8 }}>
        <Link href="/(auth)/signup" style={ui.link}>
          Регистрация
        </Link>
        <Link href={"/(auth)/forgot-password" as Href} style={ui.link}>
          Забыли пароль?
        </Link>
      </View>
    </Screen>
  );
}

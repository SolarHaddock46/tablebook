import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, Text, TextInput } from "react-native";
import { Screen, ui } from "@/components/ui";
import { api } from "@/lib/api";
import { useLocale } from "@/lib/use-locale";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token?: string }>();
  const { dict } = useLocale();
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!token) {
      setError(dict.resetPasswordInvalidLink);
      return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      await api.resetPassword({ token, password });
      setMessage(dict.resetPasswordSuccess);
    } catch (err) {
      setError(err instanceof Error ? err.message : dict.genericError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen title={dict.resetPasswordTitle} scrollable>
      <Text style={ui.muted}>{dict.resetPasswordHint}</Text>
      <TextInput
        style={ui.input}
        placeholder={dict.newPassword}
        placeholderTextColor="#64748b"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      {message ? <Text style={{ color: "#4ade80" }}>{message}</Text> : null}
      {error ? <Text style={{ color: "#f87171" }}>{error}</Text> : null}
      <Pressable style={ui.button} onPress={handleSubmit} disabled={loading || !token}>
        <Text style={ui.buttonText}>{loading ? "..." : dict.resetPasswordSave}</Text>
      </Pressable>
      {message ? (
        <Pressable
          style={[ui.button, { backgroundColor: "#334155" }]}
          onPress={() => router.replace("/(auth)/login")}
        >
          <Text style={ui.buttonText}>{dict.resetPasswordBackToLogin}</Text>
        </Pressable>
      ) : (
        <Link href="/(auth)/login" style={ui.link}>
          {dict.backToLogin}
        </Link>
      )}
    </Screen>
  );
}

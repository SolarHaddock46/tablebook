import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, Text, TextInput } from "react-native";
import { Screen, ui } from "@/components/ui";
import { api } from "@/lib/api";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token?: string }>();
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!token) {
      setError("Ссылка для сброса недействительна");
      return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      await api.resetPassword({ token, password });
      setMessage("Пароль обновлён. Теперь можно войти.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось обновить пароль");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen title="Новый пароль" scrollable>
      <Text style={ui.muted}>Введите новый пароль для вашего аккаунта.</Text>
      <TextInput
        style={ui.input}
        placeholder="Новый пароль (min 8)"
        placeholderTextColor="#64748b"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      {message ? <Text style={{ color: "#4ade80" }}>{message}</Text> : null}
      {error ? <Text style={{ color: "#f87171" }}>{error}</Text> : null}
      <Pressable style={ui.button} onPress={handleSubmit} disabled={loading || !token}>
        <Text style={ui.buttonText}>{loading ? "..." : "Сохранить пароль"}</Text>
      </Pressable>
      {message ? (
        <Pressable
          style={[ui.button, { backgroundColor: "#334155" }]}
          onPress={() => router.replace("/(auth)/login")}
        >
          <Text style={ui.buttonText}>Ко входу</Text>
        </Pressable>
      ) : (
        <Link href="/(auth)/login" style={ui.link}>
          Назад ко входу
        </Link>
      )}
    </Screen>
  );
}

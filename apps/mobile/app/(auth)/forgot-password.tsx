import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, Text, TextInput } from "react-native";
import { Screen, ui } from "@/components/ui";
import { api } from "@/lib/api";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      await api.forgotPassword({ email: email.trim() });
      setMessage("Если аккаунт существует, мы отправили письмо со ссылкой для сброса.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось отправить запрос");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen title="Сброс пароля" scrollable>
      <Text style={ui.muted}>Введите email — мы отправим ссылку для сброса пароля.</Text>
      <TextInput
        style={ui.input}
        placeholder="Email"
        placeholderTextColor="#64748b"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      {message ? <Text style={{ color: "#4ade80" }}>{message}</Text> : null}
      {error ? <Text style={{ color: "#f87171" }}>{error}</Text> : null}
      <Pressable style={ui.button} onPress={handleSubmit} disabled={loading}>
        <Text style={ui.buttonText}>{loading ? "..." : "Отправить"}</Text>
      </Pressable>
      <Link href="/(auth)/login" style={ui.link}>
        Назад ко входу
      </Link>
      {message ? (
        <Pressable
          style={[ui.button, { backgroundColor: "#334155" }]}
          onPress={() => router.replace("/(auth)/login")}
        >
          <Text style={ui.buttonText}>Ко входу</Text>
        </Pressable>
      ) : null}
    </Screen>
  );
}

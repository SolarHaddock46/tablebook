import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, Text } from "react-native";
import { Screen, ui } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { user, refreshMe } = useAuth();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleResend() {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      await api.sendVerificationEmail();
      setMessage("Письмо отправлено");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось отправить письмо");
    } finally {
      setLoading(false);
    }
  }

  async function handleContinue() {
    setLoading(true);
    setError(null);
    try {
      await refreshMe();
      navigateToApp();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  }

  function navigateToApp() {
    if (user?.role === "restaurant_owner") {
      router.replace("/(owner)/bookings");
      return;
    }
    router.replace("/(tabs)/search");
  }

  if (!user) {
    return (
      <Screen title="Подтвердите email">
        <Text style={ui.muted}>Войдите в аккаунт, чтобы отправить письмо подтверждения.</Text>
        <Pressable style={ui.button} onPress={() => router.replace("/(auth)/login")}>
          <Text style={ui.buttonText}>Войти</Text>
        </Pressable>
      </Screen>
    );
  }

  if (user.email_verified) {
    return (
      <Screen title="Email подтверждён">
        <Text style={ui.muted}>Ваш email уже подтверждён.</Text>
        <Pressable style={ui.button} onPress={navigateToApp}>
          <Text style={ui.buttonText}>Продолжить</Text>
        </Pressable>
      </Screen>
    );
  }

  return (
    <Screen title="Подтвердите email" scrollable>
      <Text style={ui.muted}>
        Мы отправили письмо на {user.email}. Перейдите по ссылке в письме, чтобы подтвердить аккаунт.
      </Text>
      {message ? <Text style={{ color: "#4ade80" }}>{message}</Text> : null}
      {error ? <Text style={{ color: "#f87171" }}>{error}</Text> : null}
      <Pressable style={ui.button} onPress={handleResend} disabled={loading}>
        <Text style={ui.buttonText}>{loading ? "..." : "Отправить письмо снова"}</Text>
      </Pressable>
      <Pressable
        style={[ui.button, { backgroundColor: "#334155" }]}
        onPress={handleContinue}
        disabled={loading}
      >
        <Text style={ui.buttonText}>Я подтвердил email</Text>
      </Pressable>
      <Pressable onPress={navigateToApp}>
        <Text style={ui.link}>Продолжить без подтверждения</Text>
      </Pressable>
    </Screen>
  );
}

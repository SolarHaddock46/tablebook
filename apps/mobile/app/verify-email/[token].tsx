import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, Text } from "react-native";
import { Screen, ui } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function VerifyEmailTokenScreen() {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token?: string }>();
  const { refreshMe, user } = useAuth();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function confirm() {
      if (!token) {
        setStatus("error");
        setError("Ссылка недействительна");
        return;
      }
      try {
        await api.confirmEmail(token);
        if (user) {
          await refreshMe();
        }
        setStatus("success");
      } catch (err) {
        setStatus("error");
        setError(err instanceof Error ? err.message : "Ссылка недействительна или истекла");
      }
    }
    confirm();
  }, [refreshMe, token, user]);

  function navigateNext() {
    if (user) {
      if (user.role === "restaurant_owner") {
        router.replace("/(owner)/bookings");
        return;
      }
      router.replace("/(tabs)/search");
      return;
    }
    router.replace("/(auth)/login");
  }

  if (status === "loading") {
    return (
      <Screen title="Подтверждение email">
        <Text style={ui.muted}>Подтверждаем ваш email...</Text>
      </Screen>
    );
  }

  if (status === "error") {
    return (
      <Screen title="Подтверждение email">
        <Text style={{ color: "#f87171" }}>{error}</Text>
        <Pressable style={ui.button} onPress={() => router.replace("/(auth)/verify-email" as Href)}>
          <Text style={ui.buttonText}>Отправить письмо снова</Text>
        </Pressable>
      </Screen>
    );
  }

  return (
    <Screen title="Email подтверждён">
      <Text style={{ color: "#4ade80" }}>Email успешно подтверждён.</Text>
      <Pressable style={ui.button} onPress={navigateNext}>
        <Text style={ui.buttonText}>Продолжить</Text>
      </Pressable>
    </Screen>
  );
}

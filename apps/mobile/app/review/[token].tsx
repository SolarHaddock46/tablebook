import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Pressable, Text } from "react-native";
import { Screen, ui } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import {
  isSafeInAppRedirect,
  loginRedirectHref,
  normalizeRouteToken,
  restaurantHref
} from "@/lib/review-reminder-flow";

export default function ReviewReminderScreen() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const params = useLocalSearchParams<{ token?: string | string[] }>();
  const token = normalizeRouteToken(params.token);
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    async function redeem() {
      if (!token) {
        setStatus("error");
        setError("Ссылка недействительна");
        return;
      }

      if (startedRef.current) {
        return;
      }
      startedRef.current = true;

      try {
        const result = await api.redeemReviewReminderToken(token);
        setStatus("success");
        if (user) {
          router.replace(restaurantHref(result.restaurant_id));
          return;
        }
        router.replace(loginRedirectHref(result.restaurant_id));
      } catch (err) {
        setStatus("error");
        setError(err instanceof Error ? err.message : "Ссылка недействительна или истекла");
      }
    }

    redeem();
  }, [authLoading, router, token, user]);

  if (status === "loading") {
    return (
      <Screen title="Отзыв">
        <Text style={ui.muted}>Открываем страницу ресторана...</Text>
      </Screen>
    );
  }

  if (status === "error") {
    return (
      <Screen title="Отзыв">
        <Text style={{ color: "#f87171" }}>{error}</Text>
        <Pressable style={ui.button} onPress={() => router.replace("/(tabs)/search" as Href)}>
          <Text style={ui.buttonText}>На главную</Text>
        </Pressable>
      </Screen>
    );
  }

  return (
    <Screen title="Отзыв">
      <Text style={ui.muted}>Перенаправляем...</Text>
    </Screen>
  );
}

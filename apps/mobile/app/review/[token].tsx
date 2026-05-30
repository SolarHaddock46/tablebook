import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Pressable, Text } from "react-native";
import { Screen, ui } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { useLocale } from "@/lib/use-locale";
import {
  isSafeInAppRedirect,
  loginRedirectHref,
  normalizeRouteToken,
  restaurantHref
} from "@/lib/review-reminder-flow";

export default function ReviewReminderScreen() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { dict } = useLocale();
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
        setError(dict.invalidLink);
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
        setError(err instanceof Error ? err.message : dict.verifyEmailFailed);
      }
    }

    redeem();
  }, [authLoading, dict.invalidLink, dict.verifyEmailFailed, router, token, user]);

  if (status === "loading") {
    return (
      <Screen title={dict.reviewTitle}>
        <Text style={ui.muted}>{dict.reviewOpening}</Text>
      </Screen>
    );
  }

  if (status === "error") {
    return (
      <Screen title={dict.reviewTitle}>
        <Text style={{ color: "#f87171" }}>{error}</Text>
        <Pressable style={ui.button} onPress={() => router.replace("/(tabs)/search" as Href)}>
          <Text style={ui.buttonText}>{dict.home}</Text>
        </Pressable>
      </Screen>
    );
  }

  return (
    <Screen title={dict.reviewTitle}>
      <Text style={ui.muted}>{dict.redirecting}</Text>
    </Screen>
  );
}

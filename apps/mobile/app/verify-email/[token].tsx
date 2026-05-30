import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Pressable, Text } from "react-native";
import { Screen, ui } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useLocale } from "@/lib/use-locale";

const confirmedTokens = new Set<string>();

export default function VerifyEmailTokenScreen() {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token?: string }>();
  const { refreshMe, user } = useAuth();
  const { dict } = useLocale();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    async function confirm() {
      if (!token) {
        setStatus("error");
        setError(dict.invalidLink);
        return;
      }

      if (confirmedTokens.has(token)) {
        setStatus("success");
        return;
      }

      if (startedRef.current) {
        return;
      }
      startedRef.current = true;

      try {
        await api.confirmEmail(token);
        confirmedTokens.add(token);
        await refreshMe();
        setStatus("success");
      } catch (err) {
        setStatus("error");
        setError(err instanceof Error ? err.message : dict.verifyEmailFailed);
      }
    }
    confirm();
  }, [dict.invalidLink, dict.verifyEmailFailed, refreshMe, token]);

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
      <Screen title={dict.verifyEmailConfirmTitle}>
        <Text style={ui.muted}>{dict.verifyEmailConfirming}</Text>
      </Screen>
    );
  }

  if (status === "error") {
    return (
      <Screen title={dict.verifyEmailConfirmTitle}>
        <Text style={{ color: "#f87171" }}>{error}</Text>
        <Pressable style={ui.button} onPress={() => router.replace("/(auth)/verify-email" as Href)}>
          <Text style={ui.buttonText}>{dict.verifyEmailResend}</Text>
        </Pressable>
      </Screen>
    );
  }

  return (
    <Screen title={dict.verifyEmailSuccess}>
      <Text style={{ color: "#4ade80" }}>{dict.verifyEmailConfirmedMessage}</Text>
      <Pressable style={ui.button} onPress={navigateNext}>
        <Text style={ui.buttonText}>{dict.verifyEmailContinue}</Text>
      </Pressable>
    </Screen>
  );
}

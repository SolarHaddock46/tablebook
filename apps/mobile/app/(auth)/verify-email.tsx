import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, Text } from "react-native";
import { Screen, ui } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { useLocale } from "@/lib/use-locale";

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { user, refreshMe } = useAuth();
  const { dict } = useLocale();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleResend() {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      await api.sendVerificationEmail();
      setMessage(dict.verifyEmailResent);
    } catch (err) {
      setError(err instanceof Error ? err.message : dict.genericError);
    } finally {
      setLoading(false);
    }
  }

  async function handleContinue() {
    setLoading(true);
    setError(null);
    try {
      await refreshMe();
      if (!user?.email_verified) {
        setError(dict.verifyEmailFailed);
        return;
      }
      navigateToApp();
    } catch (err) {
      setError(err instanceof Error ? err.message : dict.genericError);
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
      <Screen title={dict.verifyEmailTitle}>
        <Text style={ui.muted}>{dict.verifyEmailSignInHint}</Text>
        <Pressable style={ui.button} onPress={() => router.replace("/(auth)/login")}>
          <Text style={ui.buttonText}>{dict.login}</Text>
        </Pressable>
      </Screen>
    );
  }

  if (user.email_verified) {
    return (
      <Screen title={dict.verifyEmailSuccess}>
        <Text style={ui.muted}>{dict.verifyEmailAlreadyConfirmed}</Text>
        <Pressable style={ui.button} onPress={navigateToApp}>
          <Text style={ui.buttonText}>{dict.verifyEmailContinue}</Text>
        </Pressable>
      </Screen>
    );
  }

  return (
    <Screen title={dict.verifyEmailTitle} scrollable>
      <Text style={ui.muted}>{dict.verifyEmailHint.replace("{email}", user.email)}</Text>
      {message ? <Text style={{ color: "#4ade80" }}>{message}</Text> : null}
      {error ? <Text style={{ color: "#f87171" }}>{error}</Text> : null}
      <Pressable style={ui.button} onPress={handleResend} disabled={loading}>
        <Text style={ui.buttonText}>{loading ? "..." : dict.verifyEmailResend}</Text>
      </Pressable>
      <Pressable
        style={[ui.button, { backgroundColor: "#334155" }]}
        onPress={handleContinue}
        disabled={loading}
      >
        <Text style={ui.buttonText}>{dict.verifyEmailIChecked}</Text>
      </Pressable>
      <Pressable onPress={navigateToApp}>
        <Text style={ui.link}>{dict.verifyEmailContinueWithout}</Text>
      </Pressable>
    </Screen>
  );
}

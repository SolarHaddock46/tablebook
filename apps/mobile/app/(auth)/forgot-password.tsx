import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, Text, TextInput } from "react-native";
import { Screen, ui } from "@/components/ui";
import { api } from "@/lib/api";
import { useLocale } from "@/lib/use-locale";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { dict } = useLocale();
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
      setMessage(dict.forgotPasswordSent);
    } catch (err) {
      setError(err instanceof Error ? err.message : dict.genericError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen title={dict.forgotPasswordTitle} scrollable>
      <Text style={ui.muted}>{dict.forgotPasswordHint}</Text>
      <TextInput
        style={ui.input}
        placeholder={dict.email}
        placeholderTextColor="#64748b"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      {message ? <Text style={{ color: "#4ade80" }}>{message}</Text> : null}
      {error ? <Text style={{ color: "#f87171" }}>{error}</Text> : null}
      <Pressable style={ui.button} onPress={handleSubmit} disabled={loading}>
        <Text style={ui.buttonText}>{loading ? "..." : dict.send}</Text>
      </Pressable>
      <Link href="/(auth)/login" style={ui.link}>
        {dict.backToLogin}
      </Link>
    </Screen>
  );
}

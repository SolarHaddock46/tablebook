import { Link, useLocalSearchParams, useRouter, type Href } from "expo-router";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { Screen, ui } from "@/components/ui";
import { useLocale } from "@/lib/use-locale";
import { useAuth } from "@/lib/auth-context";
import { isSafeInAppRedirect } from "@/lib/review-reminder-flow";
import { LanguageSwitcher } from "@/components/language-switcher";

export default function LoginScreen() {
  const router = useRouter();
  const { redirect } = useLocalSearchParams<{ redirect?: string | string[] }>();
  const redirectPath = Array.isArray(redirect) ? redirect[0] : redirect;
  const { login } = useAuth();
  const { dict } = useLocale();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoading(true);
    setError(null);
    setWarning(null);
    try {
      const result = await login(email.trim(), password);
      if (!result.email_verified) {
        setWarning(dict.emailNotVerifiedWarning);
        router.replace("/(auth)/verify-email" as Href);
        return;
      }
      if (isSafeInAppRedirect(redirectPath)) {
        router.replace(redirectPath as Href);
        return;
      }
      router.replace("/(tabs)/search");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen title={dict.title} scrollable>
      <LanguageSwitcher />
      <Text style={ui.muted}>{dict.login}</Text>
      <TextInput
        style={ui.input}
        placeholder={dict.email}
        placeholderTextColor="#64748b"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={ui.input}
        placeholder={dict.password}
        placeholderTextColor="#64748b"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      {warning ? <Text style={{ color: "#fbbf24" }}>{warning}</Text> : null}
      {error ? <Text style={{ color: "#f87171" }}>{error}</Text> : null}
      <Pressable style={ui.button} onPress={handleLogin} disabled={loading}>
        <Text style={ui.buttonText}>{loading ? "..." : dict.login}</Text>
      </Pressable>
      <View style={{ gap: 8 }}>
        <Link href="/(auth)/signup" style={ui.link}>
          {dict.signup}
        </Link>
        <Link href={"/(auth)/forgot-password" as Href} style={ui.link}>
          {dict.forgotPassword}
        </Link>
      </View>
    </Screen>
  );
}

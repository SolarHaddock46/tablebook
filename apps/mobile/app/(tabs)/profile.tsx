import { useState } from "react";
import { Pressable, Text, TextInput } from "react-native";
import { Screen, ui } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "expo-router";

export default function ProfileScreen() {
  const { user, logout, refreshMe } = useAuth();
  const router = useRouter();
  const [displayName, setDisplayName] = useState(user?.display_name ?? "");
  const [message, setMessage] = useState<string | null>(null);

  async function handleSave() {
    const { api } = await import("@/lib/api");
    await api.updateMe({ display_name: displayName });
    await refreshMe();
    setMessage("Сохранено");
  }

  async function handleLogout() {
    await logout();
    router.replace("/(auth)/login");
  }

  return (
    <Screen title="Профиль" scrollable>
      <Text style={ui.muted}>{user?.email}</Text>
      <TextInput
        style={ui.input}
        value={displayName}
        onChangeText={setDisplayName}
        placeholder="Имя"
        placeholderTextColor="#64748b"
      />
      {message ? <Text style={ui.link}>{message}</Text> : null}
      <Pressable style={ui.button} onPress={handleSave}>
        <Text style={ui.buttonText}>Сохранить</Text>
      </Pressable>
      <Pressable style={[ui.button, { backgroundColor: "#334155" }]} onPress={handleLogout}>
        <Text style={[ui.buttonText, { color: "#f8fafc" }]}>Выйти</Text>
      </Pressable>
    </Screen>
  );
}

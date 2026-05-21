import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, Text, TextInput } from "react-native";
import { Screen, ui } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import type { Restaurant } from "@tablebook/shared";

export default function OwnerProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [nameRu, setNameRu] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getMyRestaurant()
      .then((item) => {
        setRestaurant(item);
        setNameRu(item.name_ru);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "No restaurant"));
  }, []);

  async function save() {
    if (!restaurant) return;
    const updated = await api.updateRestaurant(restaurant.id, {
      name_ru: nameRu,
      has_availability: true
    });
    setRestaurant(updated);
  }

  async function handleLogout() {
    await logout();
    router.replace("/(auth)/login");
  }

  return (
    <Screen title="Профиль ресторана" scrollable>
      {user ? <Text style={ui.muted}>{user.email}</Text> : null}
      {error ? <Text style={{ color: "#f87171" }}>{error}</Text> : null}
      <TextInput
        style={ui.input}
        placeholder="Название RU"
        placeholderTextColor="#64748b"
        value={nameRu}
        onChangeText={setNameRu}
      />
      {restaurant ? <Text style={ui.muted}>★ {restaurant.rating}</Text> : null}
      <Pressable style={ui.button} onPress={save}>
        <Text style={ui.buttonText}>Сохранить</Text>
      </Pressable>
      <Pressable style={[ui.button, { backgroundColor: "#334155" }]} onPress={handleLogout}>
        <Text style={[ui.buttonText, { color: "#f8fafc" }]}>Выйти</Text>
      </Pressable>
    </Screen>
  );
}

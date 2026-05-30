import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { FlatList, Pressable, Text, TextInput, View } from "react-native";
import { ListSeparator, Screen, ui } from "@/components/ui";
import { api } from "@/lib/api";
import type { RestaurantBlacklistEntry } from "@tablebook/shared";

export default function OwnerBlacklistScreen() {
  const router = useRouter();
  const [entries, setEntries] = useState<RestaurantBlacklistEntry[]>([]);
  const [guestPhone, setGuestPhone] = useState("");
  const [guestName, setGuestName] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadEntries = useCallback(() => {
    setLoading(true);
    api
      .getOwnerBlacklist()
      .then((response) => {
        setEntries(response.entries);
        setError(null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Ошибка загрузки"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  async function handleAdd() {
    if (!guestPhone.trim()) {
      setError("Укажите телефон");
      return;
    }
    try {
      await api.addOwnerBlacklistEntry({
        guest_phone: guestPhone.trim(),
        guest_name: guestName.trim() || undefined,
        reason: reason.trim() || undefined
      });
      setGuestPhone("");
      setGuestName("");
      setReason("");
      setError(null);
      loadEntries();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось добавить");
    }
  }

  function renderEntry(item: RestaurantBlacklistEntry) {
    return (
      <View style={ui.card}>
        <Text style={ui.value}>{item.guest_phone}</Text>
        {item.guest_name ? <Text style={ui.muted}>{item.guest_name}</Text> : null}
        {item.reason ? <Text style={ui.muted}>{item.reason}</Text> : null}
        <Text style={ui.muted}>
          {new Date(item.created_at).toLocaleDateString("ru-RU")}
        </Text>
      </View>
    );
  }

  return (
    <Screen title="Чёрный список" scrollable>
      <Pressable onPress={() => router.back()}>
        <Text style={ui.link}>← Назад</Text>
      </Pressable>
      {loading ? <Text style={ui.muted}>Загрузка...</Text> : null}
      {error ? <Text style={{ color: "#f87171" }}>{error}</Text> : null}
      <Text style={ui.label}>Телефон</Text>
      <TextInput
        style={ui.input}
        value={guestPhone}
        onChangeText={setGuestPhone}
        keyboardType="phone-pad"
        placeholder="+7..."
        placeholderTextColor="#64748b"
      />
      <Text style={ui.label}>Имя (необязательно)</Text>
      <TextInput
        style={ui.input}
        value={guestName}
        onChangeText={setGuestName}
        placeholderTextColor="#64748b"
      />
      <Text style={ui.label}>Причина (необязательно)</Text>
      <TextInput
        style={ui.input}
        value={reason}
        onChangeText={setReason}
        placeholderTextColor="#64748b"
      />
      <Pressable style={ui.button} onPress={handleAdd}>
        <Text style={ui.buttonText}>Добавить</Text>
      </Pressable>
      <Text style={[ui.value, { marginTop: 8 }]}>Записи ({entries.length})</Text>
      <FlatList
        scrollEnabled={false}
        data={entries}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => renderEntry(item)}
        ItemSeparatorComponent={ListSeparator}
      />
    </Screen>
  );
}

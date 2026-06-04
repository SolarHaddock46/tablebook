import { useCallback, useEffect, useState } from "react";
import { FlatList, Pressable, Text, TextInput, View } from "react-native";
import { ListSeparator, Screen, ui } from "@/components/ui";
import { api } from "@/lib/api";
import { useLocale } from "@/lib/use-locale";
import type { RestaurantBlacklistEntry } from "@tablebook/shared";

export default function OwnerBlacklistScreen() {
  const { locale, dict } = useLocale();
  const [entries, setEntries] = useState<RestaurantBlacklistEntry[]>([]);
  const [guestPhone, setGuestPhone] = useState("");
  const [guestName, setGuestName] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const dateLocale = locale === "ru" ? "ru-RU" : "en-US";

  const loadEntries = useCallback(() => {
    setLoading(true);
    api
      .getOwnerBlacklist()
      .then((response) => {
        setEntries(response.entries);
        setError(null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : dict.loadError))
      .finally(() => setLoading(false));
  }, [dict.loadError]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  async function handleAdd() {
    if (!guestPhone.trim()) {
      setError(dict.blacklistPhoneRequired);
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
      setError(err instanceof Error ? err.message : dict.blacklistAddFailed);
    }
  }

  function renderEntry(item: RestaurantBlacklistEntry) {
    return (
      <View style={ui.card}>
        <Text style={ui.value}>{item.guest_phone}</Text>
        {item.guest_name ? <Text style={ui.muted}>{item.guest_name}</Text> : null}
        {item.reason ? <Text style={ui.muted}>{item.reason}</Text> : null}
        <Text style={ui.muted}>{new Date(item.created_at).toLocaleDateString(dateLocale)}</Text>
      </View>
    );
  }

  return (
    <Screen title={dict.blacklist} scrollable>
      {loading ? <Text style={ui.muted}>{dict.loading}</Text> : null}
      {error ? <Text style={{ color: "#f87171" }}>{error}</Text> : null}
      <Text style={ui.label}>{dict.blacklistPhoneLabel}</Text>
      <TextInput
        style={ui.input}
        value={guestPhone}
        onChangeText={setGuestPhone}
        keyboardType="phone-pad"
        placeholder="+7..."
        placeholderTextColor="#64748b"
      />
      <Text style={ui.label}>{dict.blacklistNameOptional}</Text>
      <TextInput
        style={ui.input}
        value={guestName}
        onChangeText={setGuestName}
        placeholderTextColor="#64748b"
      />
      <Text style={ui.label}>{dict.blacklistReasonOptional}</Text>
      <TextInput
        style={ui.input}
        value={reason}
        onChangeText={setReason}
        placeholderTextColor="#64748b"
      />
      <Pressable style={ui.button} onPress={handleAdd}>
        <Text style={ui.buttonText}>{dict.add}</Text>
      </Pressable>
      <Text style={[ui.value, { marginTop: 8 }]}>
        {dict.blacklistEntries.replace("{count}", String(entries.length))}
      </Text>
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

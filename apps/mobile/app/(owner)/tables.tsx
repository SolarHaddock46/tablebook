import { useEffect, useState } from "react";
import { FlatList, Pressable, Text, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { ListSeparator, Screen, ui } from "@/components/ui";
import { api } from "@/lib/api";
import type { Restaurant } from "@tablebook/shared";

export default function OwnerTablesScreen() {
  const router = useRouter();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [existingTables, setExistingTables] = useState<Restaurant["tables"]>([]);
  const [zoneRu, setZoneRu] = useState("Зал");
  const [zoneEn, setZoneEn] = useState("Main");
  const [capacity, setCapacity] = useState("4");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    api
      .getMyRestaurant()
      .then((item) => {
        setRestaurant(item);
        setExistingTables(item.tables);
      })
      .catch(() => setRestaurant(null));
  }, []);

  async function saveTables() {
    if (!restaurant) return;
    const nextTables = [
      ...existingTables,
      {
        zone_en: zoneEn,
        zone_ru: zoneRu,
        capacity: Number(capacity)
      }
    ];
    const updated = await api.updateTables(restaurant.id, nextTables);
    setExistingTables(updated.tables);
    setMessage("Столики сохранены");
    setZoneRu("Зал");
    setZoneEn("Main");
    setCapacity("4");
    router.push("/(owner)/profile");
  }

  return (
    <Screen title="Столики" scrollable>
      {!restaurant ? <Text style={ui.muted}>Сначала создайте ресторан</Text> : null}
      {existingTables.length > 0 ? (
        <FlatList
          scrollEnabled={false}
          data={existingTables}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={ListSeparator}
          renderItem={({ item }) => (
            <Pressable style={ui.card}>
              <Text style={ui.value}>
                {item.zone_ru} ({item.zone_en})
              </Text>
              <Text style={ui.muted}>
                ID: {item.id} · {item.capacity} гостей
              </Text>
            </Pressable>
          )}
        />
      ) : null}
      <TextInput
        style={ui.input}
        placeholder="Зона"
        placeholderTextColor="#64748b"
        value={zoneRu}
        onChangeText={setZoneRu}
      />
      <TextInput
        style={ui.input}
        placeholder="Zone EN"
        placeholderTextColor="#64748b"
        value={zoneEn}
        onChangeText={setZoneEn}
      />
      <TextInput
        style={ui.input}
        placeholder="Вместимость"
        placeholderTextColor="#64748b"
        value={capacity}
        onChangeText={setCapacity}
        keyboardType="number-pad"
      />
      {message ? <Text style={ui.link}>{message}</Text> : null}
      <Pressable style={ui.button} onPress={saveTables} disabled={!restaurant}>
        <Text style={ui.buttonText}>Добавить столик</Text>
      </Pressable>
    </Screen>
  );
}

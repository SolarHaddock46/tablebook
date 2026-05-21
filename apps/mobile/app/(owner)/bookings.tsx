import { useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { ListSeparator, Screen, ui } from "@/components/ui";
import { api } from "@/lib/api";
import type { Booking, Restaurant } from "@tablebook/shared";

export default function OwnerBookingsScreen() {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [items, setItems] = useState<Array<Booking & { guest_name?: string | null }>>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    api.getMyRestaurant().then(setRestaurant).catch(() => setRestaurant(null));
  }, []);

  useEffect(() => {
    if (!restaurant) return;
    api.getOwnerBookings(restaurant.id).then((data) => {
      setItems(data);
      if (data.length > 0) {
        setSelectedDate(data[0]?.date ?? null);
      }
    });
  }, [restaurant]);

  const calendarDates = useMemo(() => {
    const uniqueDates = new Set(items.map((item) => item.date));
    const today = new Date();
    for (let index = 0; index < 14; index += 1) {
      const date = new Date(today);
      date.setDate(today.getDate() + index);
      uniqueDates.add(date.toISOString().slice(0, 10));
    }
    return [...uniqueDates].sort();
  }, [items]);

  const selectedDateItems = useMemo(() => {
    if (!selectedDate) {
      return items;
    }
    return items.filter((item) => item.date === selectedDate);
  }, [items, selectedDate]);

  return (
    <Screen title="Брони ресторана">
      {!restaurant ? <Text style={ui.muted}>Сначала создайте ресторан</Text> : null}
      {restaurant ? (
        <View style={ui.card}>
          <Text style={ui.value}>Календарь бронирований</Text>
          <FlatList
            horizontal
            data={calendarDates}
            keyExtractor={(item) => item}
            contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => {
              const selected = item === selectedDate;
              const count = items.filter((booking) => booking.date === item).length;
              return (
                <Pressable
                  onPress={() => setSelectedDate(item)}
                  style={[
                    ui.card,
                    {
                      paddingVertical: 8,
                      paddingHorizontal: 10,
                      borderColor: selected ? "#06b6d4" : "#334155"
                    }
                  ]}
                >
                  <Text style={selected ? ui.link : ui.value}>{item}</Text>
                  <Text style={ui.muted}>{count} броней</Text>
                </Pressable>
              );
            }}
          />
        </View>
      ) : null}
      <FlatList
        style={ui.flatList}
        contentContainerStyle={ui.listContent}
        data={selectedDateItems}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={ListSeparator}
        ListEmptyComponent={
          <Text style={ui.muted}>
            {selectedDate ? `На ${selectedDate} нет броней` : "Нет броней"}
          </Text>
        }
        renderItem={({ item }) => (
          <Pressable style={ui.card}>
            <Text style={ui.value}>{item.date} · {item.time}</Text>
            <Text style={ui.muted}>{item.guest_name ?? "Гость"} · {item.guests} гостей</Text>
          </Pressable>
        )}
      />
    </Screen>
  );
}

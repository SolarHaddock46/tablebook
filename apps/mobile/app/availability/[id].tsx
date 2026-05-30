import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, Pressable, Text } from "react-native";
import { ApiError } from "@tablebook/api-client";
import { ListSeparator, Screen, ui } from "@/components/ui";
import { api } from "@/lib/api";
import { useLocale } from "@/lib/use-locale";
import { getRestaurantName, type Restaurant, type RestaurantTable } from "@tablebook/shared";

type AvailabilityLoadState = "loading" | "ready" | "empty" | "error";

export default function AvailabilityScreen() {
  const params = useLocalSearchParams<{ id: string; date?: string; time?: string; guests?: string; table_id?: string }>();
  const router = useRouter();
  const { locale, dict } = useLocale();
  const date = params.date ?? new Date().toISOString().slice(0, 10);
  const time = params.time ?? "19:00";
  const guests = Number(params.guests ?? "2");
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [loadState, setLoadState] = useState<AvailabilityLoadState>("loading");
  const [error, setError] = useState<string | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    if (!params.id) return;

    let cancelled = false;
    setLoadState("loading");
    setError(null);

    Promise.all([
      api.getRestaurant(params.id),
      api.getAvailability(params.id, { date, time, guests })
    ])
      .then(([restaurantResult, availabilityResult]) => {
        if (cancelled) return;
        setRestaurant(restaurantResult);
        setTables(availabilityResult.tables);
        setSelectedTableId(availabilityResult.tables[0]?.id ?? null);
        setLoadState(availabilityResult.tables.length > 0 ? "ready" : "empty");
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadState("error");
        setError(err instanceof Error ? err.message : "Не удалось загрузить доступность");
      });

    return () => {
      cancelled = true;
    };
  }, [date, guests, params.id, time]);

  useEffect(() => {
    if (loadState !== "empty" || !params.id) return;
    router.replace({
      pathname: "/no-availability/[id]",
      params: { id: params.id, date, time, guests: String(guests) }
    });
  }, [date, guests, loadState, params.id, router, time]);

  async function confirmBooking() {
    if (!params.id || !selectedTableId) return;
    setBookingLoading(true);
    setError(null);
    try {
      const result = await api.createBooking({
        restaurant_id: params.id,
        table_id: selectedTableId,
        date,
        time,
        guests,
        source: "direct"
      });
      router.replace({
        pathname: "/confirmation",
        params: {
          booking_id: result.booking.id,
          restaurant_id: result.restaurant.id,
          date,
          time,
          guests: String(guests),
          status: result.booking.status
        }
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Booking failed";
      setError(message);
      if (err instanceof ApiError && err.status === 409) {
        router.push({
          pathname: "/no-availability/[id]",
          params: { id: params.id, date, time, guests: String(guests) }
        });
      }
    } finally {
      setBookingLoading(false);
    }
  }

  if (loadState === "loading" || !restaurant) {
    return (
      <Screen>
        <Text style={ui.muted}>{dict.loadingTables}</Text>
      </Screen>
    );
  }

  if (loadState === "error") {
    return (
      <Screen title={dict.bookingTitle}>
        <Text style={{ color: "#f87171" }}>{error ?? dict.loadError}</Text>
      </Screen>
    );
  }

  if (loadState === "empty") {
    return (
      <Screen>
        <Text style={ui.muted}>{dict.searchingAlternatives}</Text>
      </Screen>
    );
  }

  return (
    <Screen title={getRestaurantName(restaurant, locale)}>
      <Text style={ui.muted}>{date} · {time} · {guests} {dict.forGuests}</Text>
      <FlatList
        style={ui.flatList}
        contentContainerStyle={ui.listContent}
        data={tables}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={ListSeparator}
        renderItem={({ item }) => (
          <Pressable
            style={[ui.card, { borderColor: selectedTableId === item.id ? "#06b6d4" : "#334155" }]}
            onPress={() => setSelectedTableId(item.id)}
          >
            <Text style={ui.value}>{locale === "ru" ? item.zone_ru : item.zone_en}</Text>
            <Text style={ui.muted}>{item.capacity} {dict.forGuests}</Text>
          </Pressable>
        )}
      />
      {error ? <Text style={{ color: "#f87171" }}>{error}</Text> : null}
      <Pressable style={ui.button} onPress={confirmBooking} disabled={bookingLoading || !selectedTableId}>
        <Text style={ui.buttonText}>{bookingLoading ? "..." : dict.confirmBooking}</Text>
      </Pressable>
    </Screen>
  );
}

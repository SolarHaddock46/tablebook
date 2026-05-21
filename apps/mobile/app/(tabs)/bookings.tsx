import { useCallback, useEffect, useState } from "react";
import { FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { ListSeparator, Screen, ui } from "@/components/ui";
import { api } from "@/lib/api";
import { isPastVisitBooking, t, type Booking, type Locale } from "@tablebook/shared";

export default function BookingsScreen() {
  const router = useRouter();
  const locale: Locale = "ru";
  const dict = t(locale);
  const [items, setItems] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [scope, setScope] = useState<"upcoming" | "past">("upcoming");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getMyBookings({ upcoming: scope === "upcoming" });
      setItems(data);
    } finally {
      setLoading(false);
    }
  }, [scope]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Screen title="Мои брони">
      <Pressable
        style={[ui.card, { flexDirection: "row", justifyContent: "space-between" }]}
        onPress={() => setScope((prev) => (prev === "upcoming" ? "past" : "upcoming"))}
      >
        <Text style={ui.value}>{scope === "upcoming" ? "Ближайшие" : "Прошедшие"}</Text>
        <Text style={ui.link}>Сменить</Text>
      </Pressable>
      <FlatList
        style={ui.flatList}
        contentContainerStyle={ui.listContent}
        data={items}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={ListSeparator}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor="#67e8f9" />}
        ListEmptyComponent={<Text style={ui.muted}>{loading ? "Загрузка..." : "Нет броней"}</Text>}
        renderItem={({ item }) => (
          <BookingCard
            booking={item}
            showReviewAction={scope === "past" && isPastVisitBooking(item)}
            onOpenBooking={() => router.push(`/booking/${item.id}`)}
            onLeaveReview={() =>
              router.push({
                pathname: "/restaurant/[id]",
                params: { id: item.restaurant_id }
              })
            }
            reviewLabel={dict.writeReview}
          />
        )}
      />
    </Screen>
  );
}

function BookingCard({
  booking,
  showReviewAction,
  onOpenBooking,
  onLeaveReview,
  reviewLabel
}: {
  booking: Booking;
  showReviewAction: boolean;
  onOpenBooking: () => void;
  onLeaveReview: () => void;
  reviewLabel: string;
}) {
  return (
    <View style={ui.card}>
      <Pressable onPress={onOpenBooking}>
        <Text style={ui.value}>
          {booking.date} · {booking.time}
        </Text>
        <Text style={ui.muted}>
          {booking.guests} гостей · {booking.status}
        </Text>
      </Pressable>
      {showReviewAction ? (
        <Pressable style={[ui.button, { marginTop: 8 }]} onPress={onLeaveReview}>
          <Text style={ui.buttonText}>{reviewLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

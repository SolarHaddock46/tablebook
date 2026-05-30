import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { ListSeparator, Screen, ui } from "@/components/ui";
import { api } from "@/lib/api";
import { useLocale } from "@/lib/use-locale";
import { getBookingStatusLabel, isPastVisitBooking, type Booking, type Locale } from "@tablebook/shared";

export default function BookingsScreen() {
  const router = useRouter();
  const { locale, dict } = useLocale();
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

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <Screen title={dict.myBookings}>
      <Pressable
        style={[ui.card, { flexDirection: "row", justifyContent: "space-between" }]}
        onPress={() => setScope((prev) => (prev === "upcoming" ? "past" : "upcoming"))}
      >
        <Text style={ui.value}>{scope === "upcoming" ? dict.upcomingBookings : dict.pastBookings}</Text>
        <Text style={ui.link}>{dict.switchScope}</Text>
      </Pressable>
      <FlatList
        style={ui.flatList}
        contentContainerStyle={ui.listContent}
        data={items}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={ListSeparator}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor="#67e8f9" />}
        ListEmptyComponent={<Text style={ui.muted}>{loading ? dict.loading : dict.ownerNoBookings}</Text>}
        renderItem={({ item }) => (
          <BookingCard
            booking={item}
            locale={locale}
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
  locale,
  showReviewAction,
  onOpenBooking,
  onLeaveReview,
  reviewLabel
}: {
  booking: Booking;
  locale: Locale;
  showReviewAction: boolean;
  onOpenBooking: () => void;
  onLeaveReview: () => void;
  reviewLabel: string;
}) {
  const statusLabel = getBookingStatusLabel(booking.status, locale);
  return (
    <View style={ui.card}>
      <Pressable onPress={onOpenBooking}>
        <Text style={ui.value}>
          {booking.date} · {booking.time}
        </Text>
        <Text style={ui.muted}>
          {booking.guests} гостей · {statusLabel}
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

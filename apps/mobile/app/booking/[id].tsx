import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, Text } from "react-native";
import { Screen, ui } from "@/components/ui";
import { api } from "@/lib/api";
import {
  getRestaurantName,
  isPastVisitBooking,
  t,
  type Booking,
  type Locale,
  type Restaurant
} from "@tablebook/shared";

export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const locale: Locale = "ru";
  const dict = t(locale);
  const [booking, setBooking] = useState<(Booking & { restaurant?: Restaurant }) | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api.getBooking(id).then(setBooking);
  }, [id]);

  const canLeaveReview = useMemo(() => {
    if (!booking) return false;
    return isPastVisitBooking(booking);
  }, [booking]);

  async function cancel() {
    if (!id) return;
    await api.cancelBooking(id);
    setMessage("Бронь отменена");
    setBooking(await api.getBooking(id));
  }

  function openReview() {
    if (!booking) return;
    router.push({
      pathname: "/restaurant/[id]",
      params: { id: booking.restaurant_id }
    });
  }

  if (!booking) {
    return (
      <Screen>
        <Text style={ui.muted}>Загрузка...</Text>
      </Screen>
    );
  }

  return (
    <Screen title="Детали брони" scrollable>
      {booking.restaurant ? (
        <Text style={ui.value}>{getRestaurantName(booking.restaurant, locale)}</Text>
      ) : null}
      <Text style={ui.muted}>
        {booking.date} · {booking.time}
      </Text>
      <Text style={ui.muted}>Статус: {booking.status}</Text>
      {message ? <Text style={ui.link}>{message}</Text> : null}
      {canLeaveReview ? (
        <Pressable style={ui.button} onPress={openReview}>
          <Text style={ui.buttonText}>{dict.writeReview}</Text>
        </Pressable>
      ) : null}
      {booking.status === "confirmed" && !isPastVisitBooking(booking) ? (
        <Pressable style={[ui.button, { backgroundColor: "#ef4444" }]} onPress={cancel}>
          <Text style={ui.buttonText}>Отменить</Text>
        </Pressable>
      ) : null}
      <Pressable style={[ui.button, { backgroundColor: "#334155" }]} onPress={() => router.back()}>
        <Text style={[ui.buttonText, { color: "#f8fafc" }]}>Назад</Text>
      </Pressable>
    </Screen>
  );
}

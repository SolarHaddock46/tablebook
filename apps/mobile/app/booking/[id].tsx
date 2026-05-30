import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, Text } from "react-native";
import { Screen, ui } from "@/components/ui";
import { api } from "@/lib/api";
import { ApiError } from "@tablebook/api-client";
import { useLocale } from "@/lib/use-locale";
import {
  canCancelBooking,
  getBookingStatusLabel,
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
  const { locale, dict } = useLocale();
  const [booking, setBooking] = useState<(Booking & { restaurant?: Restaurant }) | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    if (!id) return;
    api.getBooking(id).then(setBooking);
  }, [id]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const canLeaveReview = useMemo(() => {
    if (!booking) return false;
    return isPastVisitBooking(booking);
  }, [booking]);

  const cancellation = useMemo(() => {
    if (!booking) return null;
    return canCancelBooking(booking, now);
  }, [booking, now]);

  async function cancel() {
    if (!id || !cancellation?.allowed) return;
    setError(null);
    try {
      await api.cancelBooking(id);
      setMessage(dict.bookingCancelled);
      setBooking(await api.getBooking(id));
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 403) {
        setError(dict.cancelWindowExpired);
        return;
      }
      setError(caught instanceof Error ? caught.message : dict.cancelBookingFailed);
    }
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
        <Text style={ui.muted}>{dict.loading}</Text>
      </Screen>
    );
  }

  return (
    <Screen title={dict.bookingDetails} scrollable>
      {booking.restaurant ? (
        <Text style={ui.value}>{getRestaurantName(booking.restaurant, locale)}</Text>
      ) : null}
      <Text style={ui.muted}>
        {booking.date} · {booking.time}
      </Text>
      <Text style={ui.muted}>
        {dict.status}: {getBookingStatusLabel(booking.status, locale)}
      </Text>
      {booking.status === "rejected" && booking.rejection_reason ? (
        <Text style={ui.muted}>{booking.rejection_reason}</Text>
      ) : null}
      {booking.status === "pending" ? (
        <Text style={ui.muted}>{dict.pendingConfirmationHint}</Text>
      ) : null}
      {renderCancellationHint(cancellation, dict, locale)}
      {message ? <Text style={ui.link}>{message}</Text> : null}
      {error ? <Text style={[ui.muted, { color: "#f87171" }]}>{error}</Text> : null}
      {canLeaveReview ? (
        <Pressable style={ui.button} onPress={openReview}>
          <Text style={ui.buttonText}>{dict.writeReview}</Text>
        </Pressable>
      ) : null}
      {renderCancelButton(booking, cancellation, dict, cancel)}
      <Pressable style={[ui.button, { backgroundColor: "#334155" }]} onPress={() => router.back()}>
        <Text style={[ui.buttonText, { color: "#f8fafc" }]}>{dict.back}</Text>
      </Pressable>
    </Screen>
  );
}

function renderCancellationHint(
  cancellation: ReturnType<typeof canCancelBooking> | null,
  dict: ReturnType<typeof t>,
  locale: Locale
) {
  if (!cancellation) {
    return null;
  }

  if (cancellation.allowed) {
    return (
      <Text style={ui.muted}>
        {dict.cancelUntil.replace("{deadline}", formatDeadline(cancellation.deadline, locale))}
      </Text>
    );
  }

  if (cancellation.reason === "not_cancellable") {
    return null;
  }

  if (cancellation.reason === "window_expired") {
    return <Text style={ui.muted}>{dict.cancelWindowExpired}</Text>;
  }

  return null;
}

function renderCancelButton(
  booking: Booking,
  cancellation: ReturnType<typeof canCancelBooking> | null,
  dict: ReturnType<typeof t>,
  onCancel: () => void
) {
  if (booking.status !== "confirmed" && booking.status !== "pending") {
    return null;
  }
  if (isPastVisitBooking(booking)) {
    return null;
  }

  const disabled = !cancellation?.allowed;
  return (
    <Pressable
      style={[ui.button, { backgroundColor: disabled ? "#64748b" : "#ef4444" }]}
      onPress={onCancel}
      disabled={disabled}
    >
      <Text style={ui.buttonText}>{dict.cancelBooking}</Text>
    </Pressable>
  );
}

function formatDeadline(deadline: Date, locale: Locale): string {
  return deadline.toLocaleString(locale === "ru" ? "ru-RU" : "en-US", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit"
  });
}

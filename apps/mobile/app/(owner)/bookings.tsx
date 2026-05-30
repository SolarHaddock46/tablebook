import { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, Text, TextInput, View } from "react-native";
import { ListSeparator, Screen, ui } from "@/components/ui";
import { api } from "@/lib/api";
import { getBookingStatusLabel, t, type Booking, type Locale, type Restaurant } from "@tablebook/shared";

type OwnerBooking = Booking & { guest_name?: string | null };
type OwnerTab = "pending" | "confirmed" | "all";

export default function OwnerBookingsScreen() {
  const locale: Locale = "ru";
  const dict = t(locale);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [items, setItems] = useState<OwnerBooking[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [tab, setTab] = useState<OwnerTab>("pending");
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualGuestName, setManualGuestName] = useState("");
  const [manualGuestPhone, setManualGuestPhone] = useState("");
  const [manualDate, setManualDate] = useState("");
  const [manualTime, setManualTime] = useState("19:00");
  const [manualGuests, setManualGuests] = useState("2");
  const [manualTableId, setManualTableId] = useState("");
  const [manualNote, setManualNote] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadRestaurant = useCallback(() => {
    api.getMyRestaurant().then(setRestaurant).catch(() => setRestaurant(null));
  }, []);

  const loadBookings = useCallback(() => {
    if (!restaurant) return;
    api.getOwnerBookings(restaurant.id).then((data) => {
      setItems(data);
      if (data.length > 0 && !selectedDate) {
        setSelectedDate(data[0]?.date ?? null);
      }
    });
  }, [restaurant, selectedDate]);

  useEffect(() => {
    loadRestaurant();
  }, [loadRestaurant]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const pendingCount = useMemo(
    () => items.filter((item) => item.status === "pending").length,
    [items]
  );

  const calendarDates = useMemo(() => {
    const uniqueDates = new Set(items.map((item) => item.date));
    const today = new Date();
    for (let index = 0; index < Constants.CalendarDays; index += 1) {
      const date = new Date(today);
      date.setDate(today.getDate() + index);
      uniqueDates.add(date.toISOString().slice(0, 10));
    }
    return [...uniqueDates].sort();
  }, [items]);

  const filteredItems = useMemo(() => {
    let result = items;
    if (tab === "pending") {
      result = result.filter((item) => item.status === "pending");
    } else if (tab === "confirmed") {
      result = result.filter((item) => item.status === "confirmed");
    }
    if (selectedDate) {
      result = result.filter((item) => item.date === selectedDate);
    }
    return result;
  }, [items, selectedDate, tab]);

  async function handleConfirm(bookingId: string) {
    setError(null);
    setMessage(null);
    try {
      await api.confirmOwnerBooking(bookingId);
      setMessage("Бронь подтверждена");
      loadBookings();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Не удалось подтвердить бронь");
    }
  }

  async function handleReject(bookingId: string) {
    setError(null);
    setMessage(null);
    try {
      await api.rejectOwnerBooking(bookingId, { reason: rejectReason || undefined });
      setRejectingId(null);
      setRejectReason("");
      setMessage("Бронь отклонена");
      loadBookings();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Не удалось отклонить бронь");
    }
  }

  async function handleManualBooking() {
    if (!restaurant || !manualTableId) return;
    setError(null);
    setMessage(null);
    try {
      await api.createManualBooking({
        restaurant_id: restaurant.id,
        table_id: manualTableId,
        date: manualDate,
        time: manualTime,
        guests: Number(manualGuests),
        guest_name: manualGuestName,
        guest_phone: manualGuestPhone,
        manual_note: manualNote || undefined
      });
      setShowManualForm(false);
      setManualGuestName("");
      setManualGuestPhone("");
      setManualNote("");
      setMessage("Ручная бронь создана");
      loadBookings();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Не удалось создать бронь");
    }
  }

  function openManualForm() {
    const today = new Date().toISOString().slice(0, 10);
    setManualDate(selectedDate ?? today);
    setManualTableId(restaurant?.tables[0]?.id ?? "");
    setShowManualForm(true);
  }

  return (
    <Screen title="Брони ресторана">
      {!restaurant ? <Text style={ui.muted}>Сначала создайте ресторан</Text> : null}
      {restaurant ? (
        <>
          {pendingCount > 0 ? (
            <Text style={ui.link}>{dict.ownerPendingBadge.replace("{count}", String(pendingCount))}</Text>
          ) : null}
          <View style={ui.card}>
            <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
              {renderTabButton("pending", dict.ownerBookingsPending, tab, setTab)}
              {renderTabButton("confirmed", dict.ownerBookingsConfirmed, tab, setTab)}
              {renderTabButton("all", dict.ownerBookingsAll, tab, setTab)}
            </View>
          </View>
          <Pressable style={ui.button} onPress={openManualForm}>
            <Text style={ui.buttonText}>{dict.ownerManualBooking}</Text>
          </Pressable>
          <View style={ui.card}>
            <Text style={ui.value}>Календарь бронирований</Text>
            <FlatList
              horizontal
              data={calendarDates}
              keyExtractor={(item) => item}
              contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => renderCalendarDay(item, selectedDate, items, setSelectedDate)}
            />
          </View>
        </>
      ) : null}
      {message ? <Text style={ui.link}>{message}</Text> : null}
      {error ? <Text style={[ui.muted, { color: "#f87171" }]}>{error}</Text> : null}
      {showManualForm && restaurant ? (
        <View style={ui.card}>
          <Text style={ui.value}>{dict.ownerManualBookingTitle}</Text>
          <TextInput
            style={ui.input}
            placeholder={dict.fullName}
            placeholderTextColor="#64748b"
            value={manualGuestName}
            onChangeText={setManualGuestName}
          />
          <TextInput
            style={ui.input}
            placeholder={dict.phone}
            placeholderTextColor="#64748b"
            value={manualGuestPhone}
            onChangeText={setManualGuestPhone}
            keyboardType="phone-pad"
          />
          <TextInput
            style={ui.input}
            placeholder={dict.date}
            placeholderTextColor="#64748b"
            value={manualDate}
            onChangeText={setManualDate}
          />
          <TextInput
            style={ui.input}
            placeholder={dict.time}
            placeholderTextColor="#64748b"
            value={manualTime}
            onChangeText={setManualTime}
          />
          <TextInput
            style={ui.input}
            placeholder={dict.guests}
            placeholderTextColor="#64748b"
            value={manualGuests}
            onChangeText={setManualGuests}
            keyboardType="number-pad"
          />
          <TextInput
            style={ui.input}
            placeholder="ID столика"
            placeholderTextColor="#64748b"
            value={manualTableId}
            onChangeText={setManualTableId}
          />
          <TextInput
            style={ui.input}
            placeholder={dict.ownerManualNoteHint}
            placeholderTextColor="#64748b"
            value={manualNote}
            onChangeText={setManualNote}
          />
          <Pressable style={ui.button} onPress={handleManualBooking}>
            <Text style={ui.buttonText}>{dict.save}</Text>
          </Pressable>
          <Pressable
            style={[ui.button, { backgroundColor: "#334155" }]}
            onPress={() => setShowManualForm(false)}
          >
            <Text style={[ui.buttonText, { color: "#f8fafc" }]}>{dict.back}</Text>
          </Pressable>
        </View>
      ) : null}
      <FlatList
        style={ui.flatList}
        contentContainerStyle={ui.listContent}
        data={filteredItems}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={ListSeparator}
        ListEmptyComponent={
          <Text style={ui.muted}>
            {selectedDate ? `На ${selectedDate} нет броней` : "Нет броней"}
          </Text>
        }
        renderItem={({ item }) =>
          renderBookingItem(
            item,
            locale,
            dict,
            rejectingId,
            rejectReason,
            setRejectingId,
            setRejectReason,
            handleConfirm,
            handleReject
          )
        }
      />
    </Screen>
  );
}

function renderTabButton(
  value: OwnerTab,
  label: string,
  tab: OwnerTab,
  setTab: (next: OwnerTab) => void
) {
  const selected = tab === value;
  return (
    <Pressable
      onPress={() => setTab(value)}
      style={[
        ui.card,
        {
          paddingVertical: 8,
          paddingHorizontal: 12,
          borderColor: selected ? "#06b6d4" : "#334155"
        }
      ]}
    >
      <Text style={selected ? ui.link : ui.value}>{label}</Text>
    </Pressable>
  );
}

function renderCalendarDay(
  item: string,
  selectedDate: string | null,
  items: OwnerBooking[],
  setSelectedDate: (date: string) => void
) {
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
}

function renderBookingItem(
  item: OwnerBooking,
  locale: Locale,
  dict: ReturnType<typeof t>,
  rejectingId: string | null,
  rejectReason: string,
  setRejectingId: (id: string | null) => void,
  setRejectReason: (value: string) => void,
  onConfirm: (id: string) => void,
  onReject: (id: string) => void
) {
  const statusLabel = getBookingStatusLabel(item.status, locale);
  return (
    <View style={ui.card}>
      <Text style={ui.value}>
        {item.date} · {item.time}
      </Text>
      <Text style={ui.muted}>
        {item.guest_name ?? "Гость"} · {item.guests} гостей · {statusLabel}
      </Text>
      {item.guest_phone ? <Text style={ui.muted}>{item.guest_phone}</Text> : null}
      {item.is_manual && item.manual_note ? <Text style={ui.muted}>{item.manual_note}</Text> : null}
      {item.status === "pending" ? (
        <View style={{ gap: 8, marginTop: 8 }}>
          <Pressable style={ui.button} onPress={() => onConfirm(item.id)}>
            <Text style={ui.buttonText}>{dict.ownerConfirmBooking}</Text>
          </Pressable>
          <Pressable
            style={[ui.button, { backgroundColor: "#ef4444" }]}
            onPress={() => setRejectingId(item.id)}
          >
            <Text style={ui.buttonText}>{dict.ownerRejectBooking}</Text>
          </Pressable>
        </View>
      ) : null}
      {rejectingId === item.id ? (
        <View style={{ gap: 8, marginTop: 8 }}>
          <TextInput
            style={ui.input}
            placeholder={dict.ownerRejectionReasonHint}
            placeholderTextColor="#64748b"
            value={rejectReason}
            onChangeText={setRejectReason}
          />
          <Pressable style={[ui.button, { backgroundColor: "#ef4444" }]} onPress={() => onReject(item.id)}>
            <Text style={ui.buttonText}>{dict.ownerRejectBooking}</Text>
          </Pressable>
          <Pressable
            style={[ui.button, { backgroundColor: "#334155" }]}
            onPress={() => setRejectingId(null)}
          >
            <Text style={[ui.buttonText, { color: "#f8fafc" }]}>{dict.back}</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

enum Constants {
  CalendarDays = 14
}

import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, Text } from "react-native";
import { Screen, ui } from "@/components/ui";

export default function ConfirmationScreen() {
  const params = useLocalSearchParams<{
    booking_id?: string;
    restaurant_id?: string;
    date?: string;
    time?: string;
    guests?: string;
  }>();
  const router = useRouter();

  return (
    <Screen title="Бронирование подтверждено" scrollable>
      <Text style={ui.muted}>ID: {params.booking_id}</Text>
      <Text style={ui.value}>{params.date} · {params.time}</Text>
      <Text style={ui.muted}>{params.guests} гостей</Text>
      <Pressable style={ui.button} onPress={() => router.replace("/(tabs)/bookings")}>
        <Text style={ui.buttonText}>Мои брони</Text>
      </Pressable>
      <Pressable style={[ui.button, { backgroundColor: "#334155" }]} onPress={() => router.replace("/(tabs)/search")}>
        <Text style={[ui.buttonText, { color: "#f8fafc" }]}>Новый поиск</Text>
      </Pressable>
    </Screen>
  );
}

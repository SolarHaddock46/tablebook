import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, Text } from "react-native";
import { Screen, ui } from "@/components/ui";
import { useLocale } from "@/lib/use-locale";

export default function ConfirmationScreen() {
  const params = useLocalSearchParams<{
    booking_id?: string;
    restaurant_id?: string;
    date?: string;
    time?: string;
    guests?: string;
    status?: string;
  }>();
  const router = useRouter();
  const { locale, dict } = useLocale();
  const isPending = params.status === "pending";
  const title = isPending ? dict.pendingConfirmationTitle : dict.confirmedTitle;

  return (
    <Screen title={title} scrollable>
      {isPending ? <Text style={ui.muted}>{dict.pendingConfirmationHint}</Text> : null}
      {!isPending ? <Text style={ui.muted}>{dict.confirmedHint}</Text> : null}
      <Text style={ui.muted}>ID: {params.booking_id}</Text>
      <Text style={ui.value}>{params.date} · {params.time}</Text>
      <Text style={ui.muted}>{params.guests} гостей</Text>
      <Pressable style={ui.button} onPress={() => router.replace("/(tabs)/bookings")}>
        <Text style={ui.buttonText}>{dict.myBookings}</Text>
      </Pressable>
      <Pressable style={[ui.button, { backgroundColor: "#334155" }]} onPress={() => router.replace("/(tabs)/search")}>
        <Text style={[ui.buttonText, { color: "#f8fafc" }]}>{dict.newSearch}</Text>
      </Pressable>
    </Screen>
  );
}

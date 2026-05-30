import { Redirect, useLocalSearchParams, useRouter, type Href } from "expo-router";
import { Pressable, Text } from "react-native";
import { Screen, ui } from "@/components/ui";
import { normalizeRouteToken } from "@/lib/review-reminder-flow";

export default function ReviewReminderQueryScreen() {
  const router = useRouter();
  const { token: rawToken } = useLocalSearchParams<{ token?: string | string[] }>();
  const token = normalizeRouteToken(rawToken);

  if (token) {
    return <Redirect href={`/review/${token}`} />;
  }

  return (
    <Screen title="Отзыв">
      <Text style={{ color: "#f87171" }}>Ссылка недействительна</Text>
      <Pressable style={ui.button} onPress={() => router.replace("/(tabs)/search" as Href)}>
        <Text style={ui.buttonText}>На главную</Text>
      </Pressable>
    </Screen>
  );
}

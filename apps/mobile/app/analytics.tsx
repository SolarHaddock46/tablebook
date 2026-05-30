import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { ListSeparator, Screen, ui } from "@/components/ui";
import { api } from "@/lib/api";
import type { SubscriptionAnalyticsDay } from "@tablebook/shared";

export default function OwnerAnalyticsScreen() {
  const router = useRouter();
  const [days, setDays] = useState<SubscriptionAnalyticsDay[]>([]);
  const [totals, setTotals] = useState({
    total_bookings: 0,
    confirmed_bookings: 0,
    cancelled_bookings: 0,
    revenue_cents: 0,
    avg_occupancy_rate: 0
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadAnalytics = useCallback(() => {
    setLoading(true);
    api
      .getOwnerAnalytics(Constants.AnalyticsDays)
      .then((response) => {
        setDays(response.days);
        setTotals(response.totals);
        setError(null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Ошибка загрузки"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  function renderDay(item: SubscriptionAnalyticsDay) {
    return (
      <View style={ui.card}>
        <Text style={ui.value}>{item.date}</Text>
        <Text style={ui.muted}>Всего броней: {item.total_bookings}</Text>
        <Text style={ui.muted}>Подтверждено: {item.confirmed_bookings}</Text>
        <Text style={ui.muted}>Отменено: {item.cancelled_bookings}</Text>
        <Text style={ui.muted}>Выручка: {(item.revenue_cents / 100).toLocaleString("ru-RU")} ₽</Text>
        <Text style={ui.muted}>Заполняемость: {item.occupancy_rate.toFixed(1)}%</Text>
      </View>
    );
  }

  return (
    <Screen title="Аналитика">
      <Pressable onPress={() => router.back()}>
        <Text style={ui.link}>← Назад</Text>
      </Pressable>
      {loading ? <Text style={ui.muted}>Загрузка...</Text> : null}
      {error ? <Text style={{ color: "#f87171" }}>{error}</Text> : null}
      <View style={ui.card}>
        <Text style={ui.label}>Итого за {Constants.AnalyticsDays} дней</Text>
        <Text style={ui.muted}>Броней: {totals.total_bookings}</Text>
        <Text style={ui.muted}>Подтверждено: {totals.confirmed_bookings}</Text>
        <Text style={ui.muted}>Отменено: {totals.cancelled_bookings}</Text>
        <Text style={ui.muted}>
          Выручка: {(totals.revenue_cents / 100).toLocaleString("ru-RU")} ₽
        </Text>
        <Text style={ui.muted}>
          Средняя заполняемость: {totals.avg_occupancy_rate.toFixed(1)}%
        </Text>
      </View>
      <FlatList
        style={ui.flatList}
        contentContainerStyle={ui.listContent}
        data={days}
        keyExtractor={(item) => item.date}
        renderItem={({ item }) => renderDay(item)}
        ItemSeparatorComponent={ListSeparator}
      />
    </Screen>
  );
}

enum Constants {
  AnalyticsDays = 30
}

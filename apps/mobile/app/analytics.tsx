import { useCallback, useEffect, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { ListSeparator, Screen, ui } from "@/components/ui";
import { api } from "@/lib/api";
import { useLocale } from "@/lib/use-locale";
import type { SubscriptionAnalyticsDay } from "@tablebook/shared";

export default function OwnerAnalyticsScreen() {
  const { locale, dict } = useLocale();
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
  const numberLocale = locale === "ru" ? "ru-RU" : "en-US";
  const currencySymbol = locale === "ru" ? "₽" : "$";

  const loadAnalytics = useCallback(() => {
    setLoading(true);
    api
      .getOwnerAnalytics(Constants.AnalyticsDays)
      .then((response) => {
        setDays(response.days);
        setTotals(response.totals);
        setError(null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : dict.loadError))
      .finally(() => setLoading(false));
  }, [dict.loadError]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  function renderDay(item: SubscriptionAnalyticsDay) {
    return (
      <View style={ui.card}>
        <Text style={ui.value}>{item.date}</Text>
        <Text style={ui.muted}>
          {dict.analyticsTotalBookings}: {item.total_bookings}
        </Text>
        <Text style={ui.muted}>
          {dict.analyticsConfirmed}: {item.confirmed_bookings}
        </Text>
        <Text style={ui.muted}>
          {dict.analyticsCancelled}: {item.cancelled_bookings}
        </Text>
        <Text style={ui.muted}>
          {dict.analyticsRevenue}: {(item.revenue_cents / 100).toLocaleString(numberLocale)} {currencySymbol}
        </Text>
        <Text style={ui.muted}>
          {dict.analyticsOccupancy}: {item.occupancy_rate.toFixed(1)}%
        </Text>
      </View>
    );
  }

  return (
    <Screen title={dict.analytics}>
      {loading ? <Text style={ui.muted}>{dict.loading}</Text> : null}
      {error ? <Text style={{ color: "#f87171" }}>{error}</Text> : null}
      <View style={ui.card}>
        <Text style={ui.label}>
          {dict.analyticsTotalForDays.replace("{days}", String(Constants.AnalyticsDays))}
        </Text>
        <Text style={ui.muted}>
          {dict.analyticsTotalBookings}: {totals.total_bookings}
        </Text>
        <Text style={ui.muted}>
          {dict.analyticsConfirmed}: {totals.confirmed_bookings}
        </Text>
        <Text style={ui.muted}>
          {dict.analyticsCancelled}: {totals.cancelled_bookings}
        </Text>
        <Text style={ui.muted}>
          {dict.analyticsRevenue}: {(totals.revenue_cents / 100).toLocaleString(numberLocale)} {currencySymbol}
        </Text>
        <Text style={ui.muted}>
          {dict.analyticsAvgOccupancy}: {totals.avg_occupancy_rate.toFixed(1)}%
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

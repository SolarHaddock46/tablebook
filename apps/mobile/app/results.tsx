import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, Pressable, Text } from "react-native";
import { ListSeparator, MatchReasons, Screen, ui } from "@/components/ui";
import { api } from "@/lib/api";
import {
  getPriceLabel,
  getRestaurantDistrict,
  getRestaurantName,
  t,
  type Locale,
  type RestaurantSearchHit
} from "@tablebook/shared";

export default function ResultsScreen() {
  const params = useLocalSearchParams<{
    cuisine?: string;
    district?: string;
    price_level?: string;
    date?: string;
    time?: string;
    guests?: string;
  }>();
  const router = useRouter();
  const locale: Locale = "ru";
  const dict = t(locale);
  const [items, setItems] = useState<RestaurantSearchHit[]>([]);
  const [isFallback, setIsFallback] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await api.getRestaurants({
          cuisine: params.cuisine,
          district: params.district,
          price_level: params.price_level,
          date: params.date,
          time: params.time,
          guests: params.guests,
          locale
        });
        setItems(data.results);
        setIsFallback(data.is_fallback);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [locale, params.cuisine, params.district, params.date, params.guests, params.time]);

  return (
    <Screen title="Результаты">
      {isFallback ? <Text style={ui.muted}>{dict.searchFallbackHint}</Text> : null}
      <FlatList
        style={ui.flatList}
        contentContainerStyle={ui.listContent}
        data={items}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={ListSeparator}
        ListEmptyComponent={<Text style={ui.muted}>{loading ? "Загрузка..." : dict.noData}</Text>}
        renderItem={({ item }) => (
          <Pressable
            style={ui.card}
            onPress={() =>
              router.push({
                pathname: item.has_availability ? "/availability/[id]" : "/no-availability/[id]",
                params: {
                  id: item.id,
                  date: params.date ?? "",
                  time: params.time ?? "19:00",
                  guests: params.guests ?? "2"
                }
              })
            }
          >
            <Text style={ui.value}>{getRestaurantName(item, locale)}</Text>
            <Text style={ui.muted}>
              {getRestaurantDistrict(item, locale)} · ★ {item.rating} ({item.review_count}) ·{" "}
              {getPriceLabel(item.price_level)} · {item.has_availability ? dict.available : dict.unavailable}
            </Text>
            {isFallback && item.matchReasons && item.matchReasons.length > 0 ? (
              <MatchReasons reasons={item.matchReasons} />
            ) : null}
            {isFallback && item.matchScore !== undefined ? (
              <Text style={ui.muted}>
                {item.matchScore}% {dict.matching}
              </Text>
            ) : null}
          </Pressable>
        )}
      />
    </Screen>
  );
}

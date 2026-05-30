import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { RestaurantAvatar } from "@/components/restaurant-avatar";
import { ListSeparator, MatchReasons, Screen, ui } from "@/components/ui";
import { api } from "@/lib/api";
import {
  getPriceLabel,
  getRestaurantDistrict,
  getRestaurantName,
  type RestaurantSearchHit
} from "@tablebook/shared";
import { useLocale } from "@/lib/use-locale";

export default function ResultsScreen() {
  const params = useLocalSearchParams<{
    cuisine?: string;
    district?: string;
    price_level?: string;
    date?: string;
    time?: string;
    guests?: string;
    search_error?: string;
    from_recommendations?: string;
  }>();
  const router = useRouter();
  const { locale, dict } = useLocale();
  const fromRecommendations = params.from_recommendations === "1";
  const [items, setItems] = useState<RestaurantSearchHit[]>([]);
  const [isFallback, setIsFallback] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchError, setSearchError] = useState<string | null>(
    fromRecommendations ? null : readSearchErrorParam(params.search_error)
  );

  useEffect(() => {
    async function load() {
      setLoading(true);
      if (!fromRecommendations) {
        setSearchError(readSearchErrorParam(params.search_error));
      } else {
        setSearchError(null);
      }
      try {
        const query: Record<string, string | number | undefined> = {
          date: params.date,
          time: params.time,
          guests: params.guests,
          locale
        };
        if (params.cuisine !== undefined) {
          query.cuisine = params.cuisine;
        }
        if (params.district !== undefined) {
          query.district = params.district;
        }
        if (params.price_level !== undefined) {
          query.price_level = params.price_level;
        }
        const data = await api.getRestaurants(query);
        setItems(data.results);
        setIsFallback(data.is_fallback);
        setSearchError(null);
      } catch (err) {
        setItems([]);
        setIsFallback(false);
        if (!fromRecommendations) {
          setSearchError(err instanceof Error ? err.message : dict.searchError);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [
    dict.searchError,
    fromRecommendations,
    locale,
    params.cuisine,
    params.district,
    params.date,
    params.guests,
    params.price_level,
    params.search_error,
    params.time
  ]);

  const showSearchMessage = !fromRecommendations && (searchError !== null || isFallback);

  return (
    <Screen title={fromRecommendations ? dict.recommendationsTitle : dict.results}>
      {searchError ? <Text style={{ color: "#f87171" }}>{searchError}</Text> : null}
      {!searchError && isFallback && !fromRecommendations ? (
        <Text style={ui.muted}>{dict.searchFallbackHint}</Text>
      ) : null}
      <FlatList
        style={ui.flatList}
        contentContainerStyle={ui.listContent}
        data={items}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={ListSeparator}
        ListEmptyComponent={
          <Text style={ui.muted}>
            {loading ? dict.loading : showSearchMessage ? dict.noDataHint : dict.noData}
          </Text>
        }
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
            <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
              <RestaurantAvatar url={item.avatar_url} />
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={ui.value}>{getRestaurantName(item, locale)}</Text>
                <Text style={ui.muted}>
                  {getRestaurantDistrict(item, locale)} · ★ {item.rating} ({item.review_count}) ·{" "}
                  {getPriceLabel(item.price_level)} · {item.has_availability ? dict.available : dict.unavailable}
                </Text>
              </View>
            </View>
            {isFallback && !fromRecommendations && item.matchReasons && item.matchReasons.length > 0 ? (
              <MatchReasons reasons={item.matchReasons} />
            ) : null}
            {isFallback && !fromRecommendations && item.matchScore !== undefined ? (
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

function readSearchErrorParam(value: string | string[] | undefined): string | null {
  if (typeof value === "string" && value.length > 0) {
    return value;
  }
  return null;
}

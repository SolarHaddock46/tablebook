import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, Text } from "react-native";
import { MatchReasons, Screen, ui } from "@/components/ui";
import { api } from "@/lib/api";
import { useLocale } from "@/lib/use-locale";
import { getPriceLabel, getRestaurantName, type Restaurant, type RestaurantAlternative } from "@tablebook/shared";

export default function NoAvailabilityScreen() {
  const params = useLocalSearchParams<{ id: string; date?: string; time?: string; guests?: string }>();
  const time = params.time ?? "19:00";
  const router = useRouter();
  const { locale, dict } = useLocale();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [alternatives, setAlternatives] = useState<RestaurantAlternative[]>([]);

  useEffect(() => {
    if (!params.id) return;
    api.getRestaurant(params.id).then(setRestaurant);
    api
      .getAlternatives(params.id, {
        date: params.date,
        time,
        guests: params.guests ? Number(params.guests) : undefined,
        locale
      })
      .then(setAlternatives);
  }, [locale, params.date, params.guests, params.id, time]);

  return (
    <Screen title={dict.noAvailability} scrollable>
      {restaurant ? <Text style={ui.muted}>{getRestaurantName(restaurant, locale)}</Text> : null}
      <Text style={ui.muted}>
        {params.date ?? new Date().toISOString().slice(0, 10)} · {time} · {params.guests ?? "2"} гостей
      </Text>
      <Text style={ui.value}>{dict.alternatives}</Text>
      <Text style={ui.muted}>{dict.alternativesHint}</Text>
      {alternatives.length === 0 ? (
        <Text style={ui.muted}>Альтернатив не найдено</Text>
      ) : (
        alternatives.map((item) => (
          <Pressable
            key={item.id}
            style={ui.card}
            onPress={() =>
              router.push({
                pathname: "/availability/[id]",
                params: {
                  id: item.id,
                  date: params.date ?? new Date().toISOString().slice(0, 10),
                  time,
                  guests: params.guests ?? "2"
                }
              })
            }
          >
            <Text style={ui.value}>{getRestaurantName(item, locale)}</Text>
            <Text style={ui.muted}>
              ★ {item.rating} · {getPriceLabel(item.price_level)} · {item.matchScore}% {dict.matching}
            </Text>
            <MatchReasons reasons={item.matchReasons} />
          </Pressable>
        ))
      )}
    </Screen>
  );
}

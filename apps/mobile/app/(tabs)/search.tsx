import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import {
  CUISINE_FILTER_OPTIONS,
  DISTRICT_FILTER_OPTIONS,
  PRICE_LEVEL_FILTER_OPTIONS,
  getPriceLabel,
  getRestaurantDistrict,
  getRestaurantName,
  t,
  type Locale,
  type RestaurantSearchHit
} from "@tablebook/shared";
import { DateField, TimeField } from "@/components/DateTimeField";
import { OptionRow } from "@/components/OptionRow";
import { Screen, ui } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

const cuisines = [
  { id: "", title: "Любая кухня" },
  ...CUISINE_FILTER_OPTIONS.map((item) => ({ id: item.id, title: item.titleRu }))
];

const districts = [
  { id: "", title: "Любой район" },
  ...DISTRICT_FILTER_OPTIONS.map((item) => ({ id: item.id, title: item.titleRu }))
];

const priceLevels = [
  { id: "", title: "Любой чек" },
  ...PRICE_LEVEL_FILTER_OPTIONS.map((item) => ({ id: String(item.id), title: item.titleRu }))
];

const guestOptions = ["1", "2", "3", "4", "5", "6"];

const Constants = {
  DefaultHour: 19,
  DefaultMinute: 0,
  MaxDaysAhead: 90,
  RecommendationLimit: 5
} as const;

function createInitialDate(): Date {
  const value = new Date();
  value.setHours(0, 0, 0, 0);
  return value;
}

function createInitialTime(): Date {
  const value = new Date();
  value.setHours(Constants.DefaultHour, Constants.DefaultMinute, 0, 0);
  return value;
}

function formatIsoDate(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatTimeParam(value: Date): string {
  return `${String(value.getHours()).padStart(2, "0")}:${String(value.getMinutes()).padStart(2, "0")}`;
}

function firstPreference(values: string[] | null | undefined): string {
  return values?.[0] ?? "";
}

function hasSavedPreferences(user: {
  preferred_cuisines?: string[] | null;
  preferred_districts?: string[] | null;
  preferred_price_level?: number | null;
} | null): boolean {
  if (!user) {
    return false;
  }
  return Boolean(
    (user.preferred_cuisines?.length ?? 0) > 0 ||
      (user.preferred_districts?.length ?? 0) > 0 ||
      (user.preferred_price_level ?? 0) >= 1
  );
}

export default function SearchScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const locale: Locale = user?.locale ?? "ru";
  const dict = t(locale);
  const [cuisine, setCuisine] = useState("");
  const [district, setDistrict] = useState("");
  const [priceLevel, setPriceLevel] = useState("");
  const [dateValue, setDateValue] = useState(createInitialDate);
  const [timeValue, setTimeValue] = useState(createInitialTime);
  const [guests, setGuests] = useState("2");
  const [recommendations, setRecommendations] = useState<RestaurantSearchHit[]>([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);

  const minimumDate = useMemo(() => createInitialDate(), []);
  const maximumDate = useMemo(() => {
    const value = createInitialDate();
    value.setDate(value.getDate() + Constants.MaxDaysAhead);
    return value;
  }, []);

  const savedPreferences = user?.role === "user" && hasSavedPreferences(user);

  useEffect(() => {
    if (!savedPreferences) {
      return;
    }
    setCuisine(firstPreference(user?.preferred_cuisines));
    setDistrict(firstPreference(user?.preferred_districts));
    setPriceLevel(user?.preferred_price_level ? String(user.preferred_price_level) : "");
  }, [savedPreferences, user?.preferred_cuisines, user?.preferred_districts, user?.preferred_price_level]);

  useEffect(() => {
    if (!savedPreferences) {
      setRecommendations([]);
      return;
    }

    let cancelled = false;
    async function loadRecommendations() {
      setRecommendationsLoading(true);
      try {
        const data = await api.getRestaurants({
          date: formatIsoDate(dateValue),
          time: formatTimeParam(timeValue),
          guests,
          locale,
          limit: Constants.RecommendationLimit
        });
        if (!cancelled) {
          setRecommendations(data.results);
        }
      } catch {
        if (!cancelled) {
          setRecommendations([]);
        }
      } finally {
        if (!cancelled) {
          setRecommendationsLoading(false);
        }
      }
    }

    void loadRecommendations();
    return () => {
      cancelled = true;
    };
  }, [dateValue, guests, locale, savedPreferences, timeValue]);

  function applyMyFilters() {
    setCuisine(firstPreference(user?.preferred_cuisines));
    setDistrict(firstPreference(user?.preferred_districts));
    setPriceLevel(user?.preferred_price_level ? String(user.preferred_price_level) : "");
  }

  function buildSearchParams(overrides?: { cuisine?: string; district?: string; price_level?: string }) {
    const nextCuisine = overrides?.cuisine ?? cuisine;
    const nextDistrict = overrides?.district ?? district;
    const nextPriceLevel = overrides?.price_level ?? priceLevel;
    return {
      cuisine: nextCuisine,
      district: nextDistrict,
      price_level: nextPriceLevel || "0",
      date: formatIsoDate(dateValue),
      time: formatTimeParam(timeValue),
      guests
    };
  }

  async function handleSearch() {
    try {
      await api.getRestaurants({
        ...buildSearchParams(),
        locale
      });
      router.push({
        pathname: "/results",
        params: buildSearchParams()
      });
    } catch (err) {
      router.push({
        pathname: "/results",
        params: {
          ...buildSearchParams(),
          search_error: err instanceof Error ? err.message : dict.searchError
        }
      });
    }
  }

  function handleViewAllRecommendations() {
    router.push({
      pathname: "/results",
      params: {
        ...buildSearchParams(),
        from_recommendations: "1"
      }
    });
  }

  function openRecommendation(item: RestaurantSearchHit) {
    router.push({
      pathname: item.has_availability ? "/availability/[id]" : "/no-availability/[id]",
      params: {
        id: item.id,
        date: formatIsoDate(dateValue),
        time: formatTimeParam(timeValue),
        guests
      }
    });
  }

  return (
    <Screen title={dict.findRestaurant} scrollable>
      {savedPreferences ? (
        <Pressable style={[ui.button, { backgroundColor: "#334155" }]} onPress={applyMyFilters}>
          <Text style={[ui.buttonText, { color: "#f8fafc" }]}>{dict.useMyFilters}</Text>
        </Pressable>
      ) : null}
      <Text style={ui.label}>{dict.cuisine}</Text>
      <OptionRow options={cuisines} value={cuisine} onChange={setCuisine} />
      <Text style={ui.label}>{dict.district}</Text>
      <OptionRow options={districts} value={district} onChange={setDistrict} />
      <Text style={ui.label}>{dict.price}</Text>
      <OptionRow options={priceLevels} value={priceLevel} onChange={setPriceLevel} />
      <DateField
        label={dict.pickDate}
        value={dateValue}
        minimumDate={minimumDate}
        maximumDate={maximumDate}
        onChange={setDateValue}
      />
      <TimeField label={dict.pickTime} value={timeValue} onChange={setTimeValue} />
      <Text style={ui.label}>{dict.guests}</Text>
      <OptionRow options={guestOptions.map((item) => ({ id: item, title: item }))} value={guests} onChange={setGuests} />
      <Pressable style={ui.button} onPress={() => void handleSearch()}>
        <Text style={ui.buttonText}>{dict.search}</Text>
      </Pressable>
      {savedPreferences ? (
        <View style={{ gap: 8 }}>
          <Text style={ui.label}>{dict.recommendationsTitle}</Text>
          <Text style={ui.muted}>{dict.recommendationsHint}</Text>
          {recommendationsLoading ? <ActivityIndicator color="#38bdf8" /> : null}
          {!recommendationsLoading && recommendations.length === 0 ? (
            <Text style={ui.muted}>{dict.noData}</Text>
          ) : null}
          {recommendations.map((item) => (
            <Pressable key={item.id} style={ui.card} onPress={() => openRecommendation(item)}>
              <Text style={ui.value}>{getRestaurantName(item, locale)}</Text>
              <Text style={ui.muted}>
                {getRestaurantDistrict(item, locale)} · ★ {item.rating} · {getPriceLabel(item.price_level)} ·{" "}
                {item.has_availability ? dict.available : dict.unavailable}
              </Text>
            </Pressable>
          ))}
          {recommendations.length > 0 ? (
            <Pressable
              style={[ui.button, { backgroundColor: "#334155" }]}
              onPress={handleViewAllRecommendations}
            >
              <Text style={[ui.buttonText, { color: "#f8fafc" }]}>{dict.viewAllRecommendations}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </Screen>
  );
}

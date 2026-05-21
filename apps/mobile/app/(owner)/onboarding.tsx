import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { Screen, ui } from "@/components/ui";
import { api } from "@/lib/api";

export default function OwnerOnboardingScreen() {
  const router = useRouter();
  const [hasRestaurant, setHasRestaurant] = useState(false);
  const [nameRu, setNameRu] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [cuisineRu, setCuisineRu] = useState("Европейская");
  const [cuisineEn, setCuisineEn] = useState("European");
  const [districtRu, setDistrictRu] = useState("Центр");
  const [districtEn, setDistrictEn] = useState("Center");
  const [priceLevel, setPriceLevel] = useState("2");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getMyRestaurant()
      .then(() => {
        setHasRestaurant(true);
        router.replace("/(owner)/profile");
      })
      .catch(() => setHasRestaurant(false));
  }, [router]);

  async function handleCreate() {
    setError(null);
    try {
      const restaurant = await api.onboardRestaurant({
        name_ru: nameRu,
        name_en: nameEn || nameRu,
        cuisine_ru: cuisineRu,
        cuisine_en: cuisineEn,
        district_ru: districtRu,
        district_en: districtEn,
        price_level: Number(priceLevel),
        lat: 55.75,
        lng: 37.62
      });
      router.push({ pathname: "/(owner)/tables", params: { restaurantId: restaurant.id } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    }
  }

  return (
    <Screen title="Создать ресторан" scrollable>
      {hasRestaurant ? (
        <View style={ui.card}>
          <Text style={ui.value}>Ресторан уже создан</Text>
          <Pressable style={ui.button} onPress={() => router.replace("/(owner)/profile")}>
            <Text style={ui.buttonText}>Перейти в кабинет</Text>
          </Pressable>
        </View>
      ) : null}
      <TextInput
        style={ui.input}
        placeholder="Название RU"
        placeholderTextColor="#64748b"
        value={nameRu}
        onChangeText={setNameRu}
      />
      <TextInput
        style={ui.input}
        placeholder="Название EN"
        placeholderTextColor="#64748b"
        value={nameEn}
        onChangeText={setNameEn}
      />
      <TextInput
        style={ui.input}
        placeholder="Ценовой уровень 1-4"
        placeholderTextColor="#64748b"
        value={priceLevel}
        onChangeText={setPriceLevel}
        keyboardType="number-pad"
      />
      {error ? <Text style={{ color: "#f87171" }}>{error}</Text> : null}
      <Pressable style={ui.button} onPress={handleCreate} disabled={hasRestaurant}>
        <Text style={ui.buttonText}>Создать</Text>
      </Pressable>
    </Screen>
  );
}

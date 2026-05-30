import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { Screen, ui } from "@/components/ui";
import { api } from "@/lib/api";
import { formatPlanPrice, planTypeLabel, type SubscriptionPlan } from "@tablebook/shared";

export default function SubscriptionCheckoutScreen() {
  const router = useRouter();
  const { planId } = useLocalSearchParams<{ planId: string }>();
  const locale = Constants.Locale;
  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);
  const [cardNumber, setCardNumber] = useState(Constants.DefaultCardNumber);
  const [cardExpiry, setCardExpiry] = useState(Constants.DefaultCardExpiry);
  const [cardCvv, setCardCvv] = useState(Constants.DefaultCardCvv);
  const [cardHolder, setCardHolder] = useState(Constants.DefaultCardHolder);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getSubscriptionPlans()
      .then((response) => {
        const selected = response.plans.find((item) => item.id === planId) ?? null;
        setPlan(selected);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Ошибка загрузки"));
  }, [planId]);

  async function handlePay() {
    if (!plan) return;
    setLoading(true);
    setError(null);
    try {
      await api.paySubscription(plan.id);
      router.replace("/(owner)/subscription");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Оплата не прошла");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen title="Оплата подписки" scrollable>
      {plan ? (
        <View style={ui.card}>
          <Text style={ui.value}>{planTypeLabel(plan.name, locale)}</Text>
          <Text style={ui.muted}>{formatPlanPrice(plan.price_cents, locale)}</Text>
        </View>
      ) : null}
      {error ? <Text style={{ color: "#f87171" }}>{error}</Text> : null}
      <Text style={ui.label}>Номер карты</Text>
      <TextInput
        style={ui.input}
        value={cardNumber}
        onChangeText={setCardNumber}
        keyboardType="number-pad"
        placeholderTextColor="#64748b"
      />
      <Text style={ui.label}>Срок действия</Text>
      <TextInput
        style={ui.input}
        value={cardExpiry}
        onChangeText={setCardExpiry}
        placeholderTextColor="#64748b"
      />
      <Text style={ui.label}>CVV</Text>
      <TextInput
        style={ui.input}
        value={cardCvv}
        onChangeText={setCardCvv}
        keyboardType="number-pad"
        secureTextEntry
        placeholderTextColor="#64748b"
      />
      <Text style={ui.label}>Имя держателя</Text>
      <TextInput
        style={ui.input}
        value={cardHolder}
        onChangeText={setCardHolder}
        placeholderTextColor="#64748b"
      />
      <Pressable style={ui.button} onPress={handlePay} disabled={loading || !plan}>
        <Text style={ui.buttonText}>{loading ? "Обработка..." : "Оплатить"}</Text>
      </Pressable>
      <Pressable onPress={() => router.back()}>
        <Text style={ui.link}>← Назад</Text>
      </Pressable>
    </Screen>
  );
}

enum Constants {
  Locale = "ru",
  DefaultCardNumber = "4111 1111 1111 1111",
  DefaultCardExpiry = "12/28",
  DefaultCardCvv = "123",
  DefaultCardHolder = "IVAN IVANOV"
}

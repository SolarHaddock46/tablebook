import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Screen, ui } from "@/components/ui";
import { api } from "@/lib/api";
import {
  formatPlanPrice,
  isPremiumSubscription,
  isSubscriptionActive,
  planTypeLabel,
  subscriptionStatusLabel,
  type RestaurantSubscription,
  type SubscriptionPlan
} from "@tablebook/shared";

export default function OwnerSubscriptionScreen() {
  const router = useRouter();
  const locale = Constants.Locale;
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [subscription, setSubscription] = useState<RestaurantSubscription | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(() => {
    setLoading(true);
    Promise.all([api.getSubscriptionPlans(), api.getSubscriptionStatus()])
      .then(([plansResponse, statusResponse]) => {
        setPlans(plansResponse.plans);
        setSubscription(statusResponse.subscription);
        setError(null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Ошибка загрузки"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleCancel() {
    try {
      const response = await api.cancelSubscription();
      setSubscription(response.subscription);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось отменить подписку");
    }
  }

  function renderPlanCard(plan: SubscriptionPlan) {
    const isCurrent = subscription?.plan_id === plan.id;
    const isPremium = plan.name === "premium";

    return (
      <View key={plan.id} style={ui.card}>
        <Text style={ui.value}>{planTypeLabel(plan.name, locale)}</Text>
        <Text style={ui.muted}>{formatPlanPrice(plan.price_cents, locale)}</Text>
        {plan.features.map((feature) => (
          <Text key={feature} style={ui.muted}>
            • {feature}
          </Text>
        ))}
        {isCurrent ? (
          <Text style={{ color: "#67e8f9", marginTop: 8 }}>Текущий тариф</Text>
        ) : isPremium ? (
          <Pressable
            style={[ui.button, { marginTop: 8 }]}
            onPress={() => router.push(`/subscription-checkout?planId=${plan.id}`)}
          >
            <Text style={ui.buttonText}>Перейти к оплате</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  function renderStatus() {
    if (!subscription) {
      return <Text style={ui.muted}>Подписка не найдена</Text>;
    }

    const active = isSubscriptionActive(subscription);
    const premium = isPremiumSubscription(subscription);

    return (
      <View style={ui.card}>
        <Text style={ui.label}>Статус</Text>
        <Text style={ui.value}>{subscriptionStatusLabel(subscription.status, locale)}</Text>
        <Text style={ui.muted}>
          Тариф: {planTypeLabel(subscription.plan_name, locale)}
        </Text>
        {subscription.expires_at ? (
          <Text style={ui.muted}>
            Действует до: {new Date(subscription.expires_at).toLocaleDateString("ru-RU")}
          </Text>
        ) : null}
        {subscription.bookings_remaining !== null ? (
          <Text style={ui.muted}>
            Осталось броней в этом месяце: {subscription.bookings_remaining}
          </Text>
        ) : (
          <Text style={ui.muted}>Бронирования: без ограничений</Text>
        )}
        {active && subscription.status !== "cancelled" ? (
          <Pressable style={[ui.button, { marginTop: 8, backgroundColor: "#475569" }]} onPress={handleCancel}>
            <Text style={ui.buttonText}>Отменить подписку</Text>
          </Pressable>
        ) : null}
        {premium ? (
          <View style={{ gap: 8, marginTop: 8 }}>
            <Pressable onPress={() => router.push("/analytics")}>
              <Text style={ui.link}>Аналитика →</Text>
            </Pressable>
            <Pressable onPress={() => router.push("/blacklist")}>
              <Text style={ui.link}>Чёрный список →</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <Screen title="Подписка" scrollable>
      {loading ? <Text style={ui.muted}>Загрузка...</Text> : null}
      {error ? <Text style={{ color: "#f87171" }}>{error}</Text> : null}
      {renderStatus()}
      <Text style={[ui.value, { marginTop: 8 }]}>Тарифы</Text>
      {plans.map(renderPlanCard)}
    </Screen>
  );
}

enum Constants {
  Locale = "ru"
}

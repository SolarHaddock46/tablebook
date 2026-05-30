import { Tabs, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { TabBarIcon } from "@/components/TabBarIcon";
import { api } from "@/lib/api";
import { useLocale } from "@/lib/use-locale";

export default function OwnerLayout() {
  const { dict } = useLocale();
  const [hasRestaurant, setHasRestaurant] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const refreshRestaurantState = useCallback(() => {
    api
      .getMyRestaurant()
      .then((restaurant) => {
        setHasRestaurant(true);
        return api.getOwnerBookings(restaurant.id);
      })
      .then((bookings) => {
        setPendingCount(bookings.filter((item) => item.status === "pending").length);
      })
      .catch(() => {
        setHasRestaurant(false);
        setPendingCount(0);
      });
  }, []);

  useFocusEffect(refreshRestaurantState);

  const bookingsTitle =
    pendingCount > 0 ? `${dict.ownerBookingsTab} (${pendingCount})` : dict.ownerBookingsTab;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: "#0f172a", borderTopColor: "#334155" },
        tabBarActiveTintColor: "#67e8f9",
        tabBarInactiveTintColor: "#94a3b8"
      }}
    >
      <Tabs.Screen
        name="onboarding"
        options={{
          title: dict.ownerStartTab,
          href: hasRestaurant ? null : undefined,
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon activeName="rocket" inactiveName="rocket-outline" color={color} focused={focused} />
          )
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: dict.profile,
          href: hasRestaurant ? undefined : null,
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon activeName="storefront" inactiveName="storefront-outline" color={color} focused={focused} />
          )
        }}
      />
      <Tabs.Screen
        name="tables"
        options={{
          title: dict.tables,
          href: hasRestaurant ? undefined : null,
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon activeName="grid" inactiveName="grid-outline" color={color} focused={focused} />
          )
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: bookingsTitle,
          href: hasRestaurant ? undefined : null,
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon activeName="calendar" inactiveName="calendar-outline" color={color} focused={focused} />
          )
        }}
      />
      <Tabs.Screen
        name="reviews"
        options={{
          title: dict.reviews,
          href: hasRestaurant ? undefined : null,
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon activeName="star" inactiveName="star-outline" color={color} focused={focused} />
          )
        }}
      />
      <Tabs.Screen
        name="subscription"
        options={{
          title: dict.subscription,
          href: hasRestaurant ? undefined : null,
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon activeName="diamond" inactiveName="diamond-outline" color={color} focused={focused} />
          )
        }}
      />
    </Tabs>
  );
}

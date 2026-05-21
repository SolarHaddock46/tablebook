import { Tabs } from "expo-router";
import { useEffect, useState } from "react";
import { TabBarIcon } from "@/components/TabBarIcon";
import { api } from "@/lib/api";

export default function OwnerLayout() {
  const [hasRestaurant, setHasRestaurant] = useState(false);

  useEffect(() => {
    api
      .getMyRestaurant()
      .then(() => setHasRestaurant(true))
      .catch(() => setHasRestaurant(false));
  }, []);

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
          title: "Старт",
          href: hasRestaurant ? null : undefined,
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon activeName="rocket" inactiveName="rocket-outline" color={color} focused={focused} />
          )
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Профиль",
          href: hasRestaurant ? undefined : null,
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon activeName="storefront" inactiveName="storefront-outline" color={color} focused={focused} />
          )
        }}
      />
      <Tabs.Screen
        name="tables"
        options={{
          title: "Столики",
          href: hasRestaurant ? undefined : null,
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon activeName="grid" inactiveName="grid-outline" color={color} focused={focused} />
          )
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: "Брони",
          href: hasRestaurant ? undefined : null,
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon activeName="calendar" inactiveName="calendar-outline" color={color} focused={focused} />
          )
        }}
      />
      <Tabs.Screen
        name="reviews"
        options={{
          title: "Отзывы",
          href: hasRestaurant ? undefined : null,
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon activeName="star" inactiveName="star-outline" color={color} focused={focused} />
          )
        }}
      />
    </Tabs>
  );
}

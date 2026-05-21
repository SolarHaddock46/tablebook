import { Tabs } from "expo-router";
import { TabBarIcon } from "@/components/TabBarIcon";

export default function TabsLayout() {
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
        name="search"
        options={{
          title: "Поиск",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon activeName="search" inactiveName="search-outline" color={color} focused={focused} />
          )
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: "Брони",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon activeName="calendar" inactiveName="calendar-outline" color={color} focused={focused} />
          )
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Профиль",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon activeName="person" inactiveName="person-outline" color={color} focused={focused} />
          )
        }}
      />
    </Tabs>
  );
}

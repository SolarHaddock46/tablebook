import { Tabs } from "expo-router";
import { TabBarIcon } from "@/components/TabBarIcon";
import { useLocale } from "@/lib/use-locale";

export default function TabsLayout() {
  const { dict } = useLocale();

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
          title: dict.search,
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon activeName="search" inactiveName="search-outline" color={color} focused={focused} />
          )
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: dict.myBookings,
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon activeName="calendar" inactiveName="calendar-outline" color={color} focused={focused} />
          )
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: dict.profile,
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon activeName="person" inactiveName="person-outline" color={color} focused={focused} />
          )
        }}
      />
    </Tabs>
  );
}

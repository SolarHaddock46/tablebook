import { useEffect, useState } from "react";
import { FlatList, Pressable, Text } from "react-native";
import { ListSeparator, Screen, ui } from "@/components/ui";
import { api } from "@/lib/api";
import { useLocale } from "@/lib/use-locale";
import type { Restaurant, Review } from "@tablebook/shared";

export default function OwnerReviewsScreen() {
  const { dict } = useLocale();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [items, setItems] = useState<Review[]>([]);

  useEffect(() => {
    api
      .getMyRestaurant()
      .then((item) => {
        setRestaurant(item);
        return api.getReviews(item.id);
      })
      .then(setItems)
      .catch(() => {
        setRestaurant(null);
        setItems([]);
      });
  }, []);

  return (
    <Screen title={dict.reviews}>
      {!restaurant ? <Text style={ui.muted}>{dict.createRestaurantFirst}</Text> : null}
      <FlatList
        style={ui.flatList}
        contentContainerStyle={ui.listContent}
        data={items}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={ListSeparator}
        ListEmptyComponent={<Text style={ui.muted}>{dict.noData}</Text>}
        renderItem={({ item }) => (
          <Pressable style={ui.card}>
            <Text style={ui.value}>★ {item.rating}</Text>
            <Text style={ui.muted}>{item.author_name ?? dict.guest}</Text>
            {item.body ? <Text style={ui.value}>{item.body}</Text> : null}
          </Pressable>
        )}
      />
    </Screen>
  );
}

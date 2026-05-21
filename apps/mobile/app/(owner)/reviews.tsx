import { useEffect, useState } from "react";
import { FlatList, Pressable, Text } from "react-native";
import { ListSeparator, Screen, ui } from "@/components/ui";
import { api } from "@/lib/api";
import type { Restaurant, Review } from "@tablebook/shared";

export default function OwnerReviewsScreen() {
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
    <Screen title="Отзывы">
      {!restaurant ? <Text style={ui.muted}>Сначала создайте ресторан</Text> : null}
      <FlatList
        style={ui.flatList}
        contentContainerStyle={ui.listContent}
        data={items}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={ListSeparator}
        ListEmptyComponent={<Text style={ui.muted}>Нет отзывов</Text>}
        renderItem={({ item }) => (
          <Pressable style={ui.card}>
            <Text style={ui.value}>★ {item.rating}</Text>
            <Text style={ui.muted}>{item.author_name ?? "Гость"}</Text>
            {item.body ? <Text style={ui.value}>{item.body}</Text> : null}
          </Pressable>
        )}
      />
    </Screen>
  );
}

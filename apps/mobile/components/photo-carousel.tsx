import { Image } from "expo-image";
import { useState } from "react";
import { Dimensions, FlatList, StyleSheet, Text, View, type NativeScrollEvent, type NativeSyntheticEvent } from "react-native";
import type { RestaurantPhoto } from "@tablebook/shared";

type Props = {
  photos: RestaurantPhoto[];
  avatarUrl?: string | null;
};

export function PhotoCarousel({ photos, avatarUrl }: Props) {
  const items = buildCarouselItems(photos, avatarUrl);
  const [activeIndex, setActiveIndex] = useState(0);
  const width = Dimensions.get("window").width - Constants.HorizontalPadding * 2;

  if (items.length === 0) {
    return null;
  }

  return (
    <View style={styles.wrapper}>
      <FlatList
        data={items}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        onMomentumScrollEnd={handleScrollEnd(width, setActiveIndex)}
        renderItem={({ item }) => (
          <Image source={{ uri: item.url }} style={[styles.image, { width }]} contentFit="cover" />
        )}
      />
      {items.length > 1 ? (
        <Text style={styles.counter}>
          {activeIndex + 1}/{items.length}
        </Text>
      ) : null}
    </View>
  );
}

function buildCarouselItems(photos: RestaurantPhoto[], avatarUrl?: string | null) {
  if (photos.length > 0) {
    return photos.map((photo) => ({ id: photo.id, url: photo.url }));
  }
  if (avatarUrl) {
    return [{ id: "avatar", url: avatarUrl }];
  }
  return [];
}

function handleScrollEnd(width: number, setActiveIndex: (index: number) => void) {
  return (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    setActiveIndex(index);
  };
}

enum Constants {
  HorizontalPadding = 16,
  CarouselHeight = 220
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 8
  },
  image: {
    height: Constants.CarouselHeight,
    borderRadius: 16,
    backgroundColor: "#1e293b"
  },
  counter: {
    color: "#94a3b8",
    fontSize: 13,
    textAlign: "center"
  }
});

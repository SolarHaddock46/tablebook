import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";

export function RestaurantAvatar({ url, size = 56 }: { url?: string | null; size?: number }) {
  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: size / 4 }]}>
      {url ? (
        <Image source={{ uri: url }} style={styles.image} contentFit="cover" />
      ) : (
        <View style={styles.placeholder} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    backgroundColor: "#334155",
    borderWidth: 1,
    borderColor: "#475569"
  },
  image: {
    width: "100%",
    height: "100%"
  },
  placeholder: {
    flex: 1,
    backgroundColor: "#1e293b"
  }
});

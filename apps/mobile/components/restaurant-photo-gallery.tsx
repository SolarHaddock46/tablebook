import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import type { RestaurantPhoto } from "@tablebook/shared";
import { t } from "@tablebook/shared";
import { api } from "@/lib/api";
import { uploadRestaurantPhoto } from "@/lib/upload-restaurant-photo";
import { useLocale } from "@/lib/use-locale";
import { ui } from "./ui";

type Props = {
  restaurantId: string;
  photos: RestaurantPhoto[];
  onPhotosChange: (photos: RestaurantPhoto[]) => void;
};

export function RestaurantPhotoGallery({ restaurantId, photos, onPhotosChange }: Props) {
  const { locale } = useLocale();
  const dict = t(locale);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <View style={styles.wrapper}>
      <Text style={ui.label}>{dict.restaurantPhotos}</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {photos.length === 0 ? <Text style={ui.muted}>{dict.noPhotos}</Text> : null}
      <View style={styles.grid}>
        {photos.map((photo, index) => (
          <PhotoTile
            key={photo.id}
            photo={photo}
            index={index}
            total={photos.length}
            dict={dict}
            onSetAvatar={() => void handleSetAvatar(restaurantId, photo.id, onPhotosChange, setError)}
            onDelete={() => void handleDelete(restaurantId, photo.id, onPhotosChange, setError)}
            onMoveUp={() => void handleMove(restaurantId, photos, index, -1, onPhotosChange, setError)}
            onMoveDown={() => void handleMove(restaurantId, photos, index, 1, onPhotosChange, setError)}
          />
        ))}
      </View>
      <Pressable style={ui.button} onPress={() => void handlePickPhoto(restaurantId, setUploading, onPhotosChange, setError, dict)} disabled={uploading}>
        {uploading ? <ActivityIndicator color="#0f172a" /> : <Text style={ui.buttonText}>{dict.addPhoto}</Text>}
      </Pressable>
    </View>
  );
}

function PhotoTile({
  photo,
  index,
  total,
  dict,
  onSetAvatar,
  onDelete,
  onMoveUp,
  onMoveDown
}: {
  photo: RestaurantPhoto;
  index: number;
  total: number;
  dict: ReturnType<typeof t>;
  onSetAvatar: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  return (
    <View style={styles.tile}>
      <Image source={{ uri: photo.url }} style={styles.image} contentFit="cover" />
      {photo.is_avatar ? <Text style={styles.badge}>{dict.photoAvatar}</Text> : null}
      <View style={styles.actions}>
        {!photo.is_avatar ? (
          <Pressable onPress={onSetAvatar}>
            <Text style={styles.actionText}>{dict.setAsAvatar}</Text>
          </Pressable>
        ) : null}
        {index > 0 ? (
          <Pressable onPress={onMoveUp}>
            <Text style={styles.actionText}>{dict.movePhotoUp}</Text>
          </Pressable>
        ) : null}
        {index < total - 1 ? (
          <Pressable onPress={onMoveDown}>
            <Text style={styles.actionText}>{dict.movePhotoDown}</Text>
          </Pressable>
        ) : null}
        <Pressable onPress={onDelete}>
          <Text style={styles.deleteText}>{dict.deletePhoto}</Text>
        </Pressable>
      </View>
    </View>
  );
}

async function handlePickPhoto(
  restaurantId: string,
  setUploading: (value: boolean) => void,
  onPhotosChange: (photos: RestaurantPhoto[]) => void,
  setError: (value: string | null) => void,
  dict: ReturnType<typeof t>
) {
  setError(null);
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    setError(dict.photoUploadFailed);
    return;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    quality: 0.85
  });
  if (result.canceled || result.assets.length === 0) {
    return;
  }

  const asset = result.assets[0];
  setUploading(true);
  try {
    const response = await uploadRestaurantPhoto({
      restaurantId,
      uri: asset.uri,
      fileName: asset.fileName ?? `photo-${Date.now()}.jpg`,
      mimeType: asset.mimeType ?? "image/jpeg"
    });
    if ("photos" in response) {
      onPhotosChange(response.photos);
    } else {
      const { photos } = await api.getRestaurantPhotos(restaurantId);
      onPhotosChange(photos);
    }
  } catch {
    setError(dict.photoUploadFailed);
  } finally {
    setUploading(false);
  }
}

async function handleSetAvatar(
  restaurantId: string,
  photoId: string,
  onPhotosChange: (photos: RestaurantPhoto[]) => void,
  setError: (value: string | null) => void
) {
  setError(null);
  try {
    const { photos } = await api.setRestaurantPhotoAvatar(restaurantId, photoId);
    onPhotosChange(photos);
  } catch {
    setError("Failed to set avatar");
  }
}

async function handleDelete(
  restaurantId: string,
  photoId: string,
  onPhotosChange: (photos: RestaurantPhoto[]) => void,
  setError: (value: string | null) => void
) {
  setError(null);
  try {
    await api.deleteRestaurantPhoto(restaurantId, photoId);
    const { photos } = await api.getRestaurantPhotos(restaurantId);
    onPhotosChange(photos);
  } catch {
    setError("Failed to delete photo");
  }
}

async function handleMove(
  restaurantId: string,
  photos: RestaurantPhoto[],
  index: number,
  direction: -1 | 1,
  onPhotosChange: (photos: RestaurantPhoto[]) => void,
  setError: (value: string | null) => void
) {
  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= photos.length) {
    return;
  }

  setError(null);
  const nextIds = photos.map((photo) => photo.id);
  [nextIds[index], nextIds[targetIndex]] = [nextIds[targetIndex], nextIds[index]];
  try {
    const { photos: reordered } = await api.reorderRestaurantPhotos(restaurantId, nextIds);
    onPhotosChange(reordered);
  } catch {
    setError("Failed to reorder photos");
  }
}

enum Constants {
  ImageHeight = 180
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 10
  },
  grid: {
    gap: 12
  },
  tile: {
    backgroundColor: "#1e293b",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#334155",
    overflow: "hidden",
    gap: 8
  },
  image: {
    width: "100%",
    height: Constants.ImageHeight
  },
  badge: {
    color: "#67e8f9",
    fontSize: 12,
    fontWeight: "700",
    paddingHorizontal: 12
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    paddingHorizontal: 12,
    paddingBottom: 12
  },
  actionText: {
    color: "#67e8f9",
    fontSize: 13
  },
  deleteText: {
    color: "#f87171",
    fontSize: 13
  },
  error: {
    color: "#f87171"
  }
});

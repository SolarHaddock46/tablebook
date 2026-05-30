import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, Text, TextInput } from "react-native";
import { ApiError } from "@tablebook/api-client";
import { PhotoCarousel } from "@/components/photo-carousel";
import { ListSeparator, Screen, ui } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import {
  canUserReviewRestaurant,
  getRestaurantName,
  type Review,
  type Restaurant
} from "@tablebook/shared";
import { useLocale } from "@/lib/use-locale";

export default function RestaurantScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { locale, dict } = useLocale();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [galleryPhotos, setGalleryPhotos] = useState<Awaited<ReturnType<typeof api.getRestaurantPhotos>>["photos"]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState("5");
  const [body, setBody] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [pastBookingsLoaded, setPastBookingsLoaded] = useState(false);
  const [pastBookings, setPastBookings] = useState<Awaited<ReturnType<typeof api.getMyBookings>>>([]);

  useEffect(() => {
    if (!id) return;
    api.getRestaurant(id).then(setRestaurant);
    api.getReviews(id).then(setReviews).catch(() => setReviews([]));
    api.getRestaurantPhotos(id).then((data) => setGalleryPhotos(data.photos)).catch(() => setGalleryPhotos([]));
  }, [id]);

  useEffect(() => {
    if (!user) {
      setPastBookings([]);
      setPastBookingsLoaded(true);
      return;
    }
    api
      .getMyBookings({ upcoming: false })
      .then(setPastBookings)
      .catch(() => setPastBookings([]))
      .finally(() => setPastBookingsLoaded(true));
  }, [user]);

  const eligibility = useMemo(() => {
    if (!id || !user || !pastBookingsLoaded) {
      return null;
    }
    return canUserReviewRestaurant(id, user.id, pastBookings, reviews);
  }, [id, pastBookings, pastBookingsLoaded, reviews, user]);

  const myReview = useMemo(() => {
    if (!user) return null;
    return reviews.find((item) => item.user_id === user.id) ?? null;
  }, [reviews, user]);

  async function submitReview() {
    if (!id || !eligibility?.allowed) return;
    const parsedRating = Number(rating);
    if (!Number.isFinite(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      setError(dict.reviewRatingRequired);
      return;
    }

    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      await api.createReview(id, { rating: parsedRating, body: body.trim() || undefined });
      const nextReviews = await api.getReviews(id);
      setReviews(nextReviews);
      if (restaurant) {
        const updated = await api.getRestaurant(id);
        setRestaurant(updated);
      }
      setBody("");
      setMessage(dict.reviewSubmitted);
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        setError(dict.reviewNeedVisit);
      } else {
        setError(err instanceof Error ? err.message : dict.genericError);
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (!restaurant) {
    return (
      <Screen>
        <Text style={ui.muted}>Загрузка...</Text>
      </Screen>
    );
  }

  return (
    <Screen title={getRestaurantName(restaurant, locale)} scrollable>
      <PhotoCarousel photos={galleryPhotos} avatarUrl={restaurant.avatar_url} />
      <Text style={ui.muted}>
        ★ {restaurant.rating} · {restaurant.review_count} отзывов
      </Text>
      <Pressable
        style={ui.button}
        onPress={() =>
          router.push({
            pathname: "/availability/[id]",
            params: {
              id: restaurant.id,
              date: new Date().toISOString().slice(0, 10),
              time: "19:00",
              guests: "2"
            }
          })
        }
      >
        <Text style={ui.buttonText}>Забронировать</Text>
      </Pressable>

      <Text style={ui.value}>{dict.reviews}</Text>
      {reviews.length === 0 ? (
        <Text style={ui.muted}>Пока нет отзывов</Text>
      ) : (
        <FlatList
          scrollEnabled={false}
          data={reviews}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={ListSeparator}
          renderItem={({ item }) => <ReviewCard review={item} guestLabel={dict.guest} />}
        />
      )}

      {myReview ? (
        <ViewCard review={myReview} title={dict.reviewAlreadyLeft} />
      ) : eligibility?.allowed ? (
        <>
          <Text style={ui.value}>{dict.writeReview}</Text>
          <TextInput
            style={ui.input}
            placeholder={dict.reviewRatingHint}
            placeholderTextColor="#64748b"
            value={rating}
            onChangeText={setRating}
            keyboardType="number-pad"
          />
          <TextInput
            style={ui.input}
            placeholder={dict.reviewBodyHint}
            placeholderTextColor="#64748b"
            value={body}
            onChangeText={setBody}
            multiline
          />
          {error ? <Text style={{ color: "#f87171" }}>{error}</Text> : null}
          {message ? <Text style={ui.link}>{message}</Text> : null}
          <Pressable style={ui.button} onPress={submitReview} disabled={submitting}>
            <Text style={ui.buttonText}>{submitting ? "..." : dict.submitReview}</Text>
          </Pressable>
        </>
      ) : pastBookingsLoaded ? (
        <Text style={ui.muted}>
          {eligibility?.reason === "already_reviewed" ? dict.reviewAlreadyLeft : dict.reviewNeedVisit}
        </Text>
      ) : null}
    </Screen>
  );
}

function ReviewCard({ review, guestLabel }: { review: Review; guestLabel: string }) {
  return (
    <Pressable style={ui.card}>
      <Text style={ui.value}>★ {review.rating}</Text>
      <Text style={ui.muted}>{review.author_name ?? guestLabel}</Text>
      {review.body ? <Text style={ui.value}>{review.body}</Text> : null}
    </Pressable>
  );
}

function ViewCard({ review, title }: { review: Review; title: string }) {
  return (
    <Pressable style={ui.card}>
      <Text style={ui.link}>{title}</Text>
      <Text style={ui.value}>★ {review.rating}</Text>
      {review.body ? <Text style={ui.muted}>{review.body}</Text> : null}
    </Pressable>
  );
}

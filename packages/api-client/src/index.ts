import type {
  AuthUser,
  Booking,
  Locale,
  Restaurant,
  RestaurantAlternative,
  RestaurantPhoto,
  RestaurantSearchResponse,
  Review,
  UserRole
} from "@tablebook/shared";

export type ApiClientOptions = {
  baseUrl: string;
  getToken?: () => string | null | Promise<string | null>;
};

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export class TableBookClient {
  constructor(private readonly options: ApiClientOptions) {}

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const token = this.options.getToken ? await this.options.getToken() : null;
    const headers = new Headers(init?.headers);
    if (!(init?.body instanceof FormData)) {
      headers.set("Content-Type", "application/json");
    }
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const response = await fetch(`${this.options.baseUrl}${path}`, {
      ...init,
      headers
    });

    const body = await response.json().catch(() => null);
    if (!response.ok) {
      throw new ApiError(
        (body as { error?: string })?.error ?? response.statusText,
        response.status,
        body
      );
    }
    return body as T;
  }

  private async requestRaw(path: string, init?: RequestInit): Promise<Response> {
    const token = this.options.getToken ? await this.options.getToken() : null;
    const headers = new Headers(init?.headers);
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return fetch(`${this.options.baseUrl}${path}`, { ...init, headers });
  }

  register(input: {
    email: string;
    password: string;
    role: UserRole;
    display_name?: string;
    full_name?: string;
    phone?: string;
    preferred_cuisines?: string[];
    preferred_districts?: string[];
    preferred_price_level?: number;
  }) {
    return this.request<{ user: AuthUser; accessToken: string }>("/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify(input)
    });
  }

  login(input: { email: string; password: string }) {
    return this.request<{ user: AuthUser; accessToken: string; email_verified?: boolean }>(
      "/api/v1/auth/login",
      {
        method: "POST",
        body: JSON.stringify(input)
      }
    );
  }

  sendVerificationEmail() {
    return this.request<{ ok: true; message: string }>("/api/v1/auth/verify-email", {
      method: "POST"
    });
  }

  confirmEmail(token: string) {
    return this.request<{ ok: true; user: AuthUser }>(`/api/v1/auth/verify-email/${token}`);
  }

  forgotPassword(input: { email: string }) {
    return this.request<{ ok: true; message: string }>("/api/v1/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify(input)
    });
  }

  resetPassword(input: { token: string; password: string }) {
    return this.request<{ ok: true; user: AuthUser }>("/api/v1/auth/reset-password", {
      method: "POST",
      body: JSON.stringify(input)
    });
  }

  getMe() {
    return this.request<AuthUser>("/api/v1/me");
  }

  getMyRestaurant() {
    return this.request<Restaurant>("/api/v1/me/restaurant");
  }

  updateMe(input: {
    display_name?: string;
    full_name?: string | null;
    phone?: string | null;
    locale?: Locale;
    preferred_cuisines?: string[] | null;
    preferred_districts?: string[] | null;
    preferred_price_level?: number | null;
  }) {
    return this.request<AuthUser>("/api/v1/me", {
      method: "PATCH",
      body: JSON.stringify(input)
    });
  }

  updateProfile(input: {
    display_name?: string;
    full_name?: string | null;
    phone?: string | null;
    locale?: Locale;
    preferred_cuisines?: string[] | null;
    preferred_districts?: string[] | null;
    preferred_price_level?: number | null;
  }) {
    return this.request<AuthUser>("/api/v1/users/profile", {
      method: "PATCH",
      body: JSON.stringify(input)
    });
  }

  updatePreferences(input: {
    preferred_cuisines?: string[] | null;
    preferred_districts?: string[] | null;
    preferred_price_level?: number | null;
  }) {
    return this.request<AuthUser>("/api/v1/users/preferences", {
      method: "PATCH",
      body: JSON.stringify(input)
    });
  }

  getRestaurants(params: Record<string, string | number | undefined>) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        query.set(key, String(value));
      }
    });
    return this.request<RestaurantSearchResponse>(`/api/v1/restaurants?${query.toString()}`);
  }

  getRestaurant(id: string) {
    return this.request<Restaurant>(`/api/v1/restaurants/${id}`);
  }

  getAvailability(id: string, params: { date: string; time: string; guests: number }) {
    const query = new URLSearchParams({
      date: params.date,
      time: params.time,
      guests: String(params.guests)
    });
    return this.request<{ tables: Restaurant["tables"] }>(
      `/api/v1/restaurants/${id}/availability?${query.toString()}`
    );
  }

  getAlternatives(id: string, params: { date?: string; time?: string; guests?: number; locale?: Locale }) {
    const query = new URLSearchParams();
    if (params.date) query.set("date", params.date);
    if (params.time) query.set("time", params.time);
    if (params.guests) query.set("guests", String(params.guests));
    if (params.locale) query.set("locale", params.locale);
    return this.request<RestaurantAlternative[]>(`/api/v1/restaurants/${id}/alternatives?${query.toString()}`);
  }

  createBooking(input: {
    restaurant_id: string;
    table_id: string;
    date: string;
    time: string;
    guests: number;
    source: "direct" | "ai-alternative" | "quick-book";
    revenue_cents?: number;
  }) {
    return this.request<{ booking: Booking; restaurant: Restaurant }>("/api/v1/bookings", {
      method: "POST",
      body: JSON.stringify(input)
    });
  }

  getMyBookings(params?: { status?: string; upcoming?: boolean }) {
    const query = new URLSearchParams();
    if (params?.status) query.set("status", params.status);
    if (params?.upcoming !== undefined) query.set("upcoming", String(params.upcoming));
    return this.request<Booking[]>(`/api/v1/me/bookings?${query.toString()}`);
  }

  getBooking(id: string) {
    return this.request<Booking & { restaurant?: Restaurant }>(`/api/v1/bookings/${id}`);
  }

  cancelBooking(id: string) {
    return this.request<{ booking: Booking }>(`/api/v1/bookings/${id}/cancel`, {
      method: "PATCH"
    });
  }

  requestReviewReminder(bookingId: string) {
    return this.request<{ ok: true; booking_id: string }>(
      `/api/v1/bookings/${bookingId}/request-review`,
      { method: "POST" }
    );
  }

  redeemReviewReminderToken(token: string) {
    return this.request<{ ok: true; booking_id: string; restaurant_id: string }>(
      `/api/v1/reviews/reminder/${encodeURIComponent(token)}`
    );
  }

  getReviews(restaurantId: string, params?: { limit?: number; offset?: number }) {
    const query = new URLSearchParams();
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.offset) query.set("offset", String(params.offset));
    return this.request<Review[]>(`/api/v1/restaurants/${restaurantId}/reviews?${query.toString()}`);
  }

  createReview(restaurantId: string, input: { rating: number; body?: string }) {
    return this.request<Review>(`/api/v1/restaurants/${restaurantId}/reviews`, {
      method: "POST",
      body: JSON.stringify(input)
    });
  }

  onboardRestaurant(input: Record<string, unknown>) {
    return this.request<Restaurant>("/api/v1/restaurants/onboard", {
      method: "POST",
      body: JSON.stringify(input)
    });
  }

  updateRestaurant(id: string, input: Record<string, unknown>) {
    return this.request<Restaurant>(`/api/v1/restaurants/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input)
    });
  }

  updateTables(
    id: string,
    tables: Array<{
      id?: string;
      zone_en: string;
      zone_ru: string;
      capacity: number;
    }>
  ) {
    return this.request<Restaurant>(`/api/v1/restaurants/${id}/tables`, {
      method: "PUT",
      body: JSON.stringify({ tables })
    });
  }

  getRestaurantPhotos(restaurantId: string) {
    return this.request<{ photos: RestaurantPhoto[] }>(`/api/v1/restaurants/${restaurantId}/photos`);
  }

  presignRestaurantPhoto(
    restaurantId: string,
    input: { content_type: string; file_name?: string }
  ) {
    return this.request<{ upload_url: string; public_url: string; storage_key: string }>(
      `/api/v1/restaurants/${restaurantId}/photos/presign`,
      {
        method: "POST",
        body: JSON.stringify(input)
      }
    );
  }

  registerRestaurantPhoto(
    restaurantId: string,
    input: { url: string; storage_key?: string; sort_order?: number }
  ) {
    return this.request<{ photo: RestaurantPhoto; photos: RestaurantPhoto[] }>(
      `/api/v1/restaurants/${restaurantId}/photos`,
      {
        method: "POST",
        body: JSON.stringify(input)
      }
    );
  }

  async uploadRestaurantPhotoLocal(restaurantId: string, file: Blob, fileName: string) {
    const formData = new FormData();
    formData.append("file", file, fileName);
    const response = await this.requestRaw(`/api/v1/restaurants/${restaurantId}/photos/upload`, {
      method: "POST",
      body: formData
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      throw new ApiError(
        (body as { error?: string })?.error ?? response.statusText,
        response.status,
        body
      );
    }
    return body as { photo: RestaurantPhoto };
  }

  deleteRestaurantPhoto(restaurantId: string, photoId: string) {
    return this.request<{ ok: true }>(`/api/v1/restaurants/${restaurantId}/photos/${photoId}`, {
      method: "DELETE"
    });
  }

  setRestaurantPhotoAvatar(restaurantId: string, photoId: string) {
    return this.request<{ photos: RestaurantPhoto[] }>(
      `/api/v1/restaurants/${restaurantId}/photos/${photoId}/set-avatar`,
      { method: "PATCH" }
    );
  }

  reorderRestaurantPhotos(restaurantId: string, photoIds: string[]) {
    return this.request<{ photos: RestaurantPhoto[] }>(`/api/v1/restaurants/${restaurantId}/photos`, {
      method: "PUT",
      body: JSON.stringify({ photo_ids: photoIds })
    });
  }

  getOwnerBookings(id: string) {
    return this.request<Array<Booking & { guest_name?: string | null }>>(
      `/api/v1/restaurants/${id}/bookings`
    );
  }

  confirmOwnerBooking(id: string) {
    return this.request<{ booking: Booking }>(`/api/v1/owner/bookings/${id}/confirm`, {
      method: "POST"
    });
  }

  rejectOwnerBooking(id: string, input?: { reason?: string }) {
    return this.request<{ booking: Booking }>(`/api/v1/owner/bookings/${id}/reject`, {
      method: "POST",
      body: JSON.stringify(input ?? {})
    });
  }

  createManualBooking(input: {
    restaurant_id: string;
    table_id: string;
    date: string;
    time: string;
    guests: number;
    guest_name: string;
    guest_phone: string;
    manual_note?: string;
  }) {
    return this.request<{ booking: Booking }>("/api/v1/owner/bookings/manual", {
      method: "POST",
      body: JSON.stringify(input)
    });
  }

  logEvent(event_name: string, payload: Record<string, unknown>) {
    return this.request<{ ok: true }>("/api/v1/events", {
      method: "POST",
      body: JSON.stringify({ event_name, payload })
    });
  }

  getSubscriptionPlans() {
    return this.request<{ plans: import("@tablebook/shared").SubscriptionPlan[] }>(
      "/api/v1/subscription/plans"
    );
  }

  getSubscriptionStatus() {
    return this.request<{ subscription: import("@tablebook/shared").RestaurantSubscription | null }>(
      "/api/v1/subscription/status"
    );
  }

  paySubscription(planId: string) {
    return this.request<{ subscription: import("@tablebook/shared").RestaurantSubscription }>(
      "/api/v1/subscription/pay",
      {
        method: "POST",
        body: JSON.stringify({ plan_id: planId })
      }
    );
  }

  cancelSubscription() {
    return this.request<{ subscription: import("@tablebook/shared").RestaurantSubscription }>(
      "/api/v1/subscription/cancel",
      { method: "POST" }
    );
  }

  getOwnerAnalytics(days?: number) {
    const query = days ? `?days=${days}` : "";
    return this.request<import("@tablebook/shared").SubscriptionAnalyticsSummary>(
      `/api/v1/owner/analytics${query}`
    );
  }

  getOwnerBlacklist() {
    return this.request<{ entries: import("@tablebook/shared").RestaurantBlacklistEntry[] }>(
      "/api/v1/owner/blacklist"
    );
  }

  addOwnerBlacklistEntry(input: { guest_phone: string; guest_name?: string; reason?: string }) {
    return this.request<{ entry: import("@tablebook/shared").RestaurantBlacklistEntry }>(
      "/api/v1/owner/blacklist",
      {
        method: "POST",
        body: JSON.stringify(input)
      }
    );
  }
}

export function createApiClient(options: ApiClientOptions) {
  return new TableBookClient(options);
}

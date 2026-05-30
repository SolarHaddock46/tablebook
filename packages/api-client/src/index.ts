import type {
  AuthUser,
  Booking,
  Locale,
  Restaurant,
  RestaurantAlternative,
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
    headers.set("Content-Type", "application/json");
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

  register(input: {
    email: string;
    password: string;
    role: UserRole;
    display_name?: string;
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

  updateMe(input: { display_name?: string; locale?: Locale }) {
    return this.request<AuthUser>("/api/v1/me", {
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

  getOwnerBookings(id: string) {
    return this.request<Array<Booking & { guest_name?: string | null }>>(
      `/api/v1/restaurants/${id}/bookings`
    );
  }

  logEvent(event_name: string, payload: Record<string, unknown>) {
    return this.request<{ ok: true }>("/api/v1/events", {
      method: "POST",
      body: JSON.stringify({ event_name, payload })
    });
  }
}

export function createApiClient(options: ApiClientOptions) {
  return new TableBookClient(options);
}

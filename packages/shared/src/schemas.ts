import { z } from "zod";

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["user", "restaurant_owner"]),
  display_name: z.string().min(1).optional()
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email()
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8)
});

export const UpdateMeSchema = z.object({
  display_name: z.string().min(1).optional(),
  locale: z.enum(["ru", "en"]).optional()
});

export const BookingSchema = z.object({
  restaurant_id: z.string().uuid(),
  table_id: z.string().min(1),
  date: z.string().min(8),
  time: z.string().min(4),
  guests: z.coerce.number().int().min(1).max(20),
  source: z.enum(["direct", "ai-alternative", "quick-book"]),
  revenue_cents: z.coerce.number().int().min(0).default(3500)
});

export const ReviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  body: z.string().max(2000).optional()
});

export const EventSchema = z.object({
  event_name: z.string().min(1),
  payload: z.record(z.unknown()).default({})
});

export const OnboardRestaurantSchema = z.object({
  name_en: z.string().min(1),
  name_ru: z.string().min(1),
  cuisine_en: z.string().min(1),
  cuisine_ru: z.string().min(1),
  district_en: z.string().min(1),
  district_ru: z.string().min(1),
  price_level: z.coerce.number().int().min(1).max(4),
  lat: z.coerce.number(),
  lng: z.coerce.number()
});

export const UpdateRestaurantSchema = OnboardRestaurantSchema.partial().extend({
  status: z.enum(["draft", "pending", "active", "suspended"]).optional(),
  has_availability: z.boolean().optional()
});

export const UpdateTablesSchema = z.object({
  tables: z.array(
    z.object({
      id: z.string().min(1).optional(),
      zone_en: z.string().min(1),
      zone_ru: z.string().min(1),
      capacity: z.coerce.number().int().min(1)
    })
  )
});

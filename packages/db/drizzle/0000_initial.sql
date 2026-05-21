CREATE EXTENSION IF NOT EXISTS "pgcrypto";
--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('user', 'restaurant_owner', 'admin');
--> statement-breakpoint
CREATE TYPE "public"."booking_status" AS ENUM('confirmed', 'cancelled', 'completed');
--> statement-breakpoint
CREATE TYPE "public"."restaurant_status" AS ENUM('draft', 'pending', 'active', 'suspended');
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"display_name" text,
	"locale" text DEFAULT 'ru' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "restaurants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name_en" text NOT NULL,
	"name_ru" text NOT NULL,
	"cuisine_en" text NOT NULL,
	"cuisine_ru" text NOT NULL,
	"district_en" text NOT NULL,
	"district_ru" text NOT NULL,
	"price_level" integer NOT NULL,
	"rating" numeric(2, 1) DEFAULT '4.0' NOT NULL,
	"review_count" integer DEFAULT 0 NOT NULL,
	"distance_km" numeric(4, 2) NOT NULL,
	"has_availability" boolean DEFAULT false NOT NULL,
	"tables" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"lat" numeric(8, 6) NOT NULL,
	"lng" numeric(8, 6) NOT NULL,
	"owner_id" uuid,
	"status" "restaurant_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"restaurant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"table_id" text NOT NULL,
	"date" date NOT NULL,
	"time" time NOT NULL,
	"guests" integer NOT NULL,
	"source" text NOT NULL,
	"status" "booking_status" DEFAULT 'confirmed' NOT NULL,
	"revenue_cents" integer DEFAULT 0 NOT NULL,
	"cancelled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"restaurant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"rating" integer NOT NULL,
	"body" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_name" text NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions_revenue" (
	"month" text NOT NULL,
	"total_revenue_cents" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "restaurants" ADD CONSTRAINT "restaurants_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "idx_bookings_slot" ON "bookings" USING btree ("restaurant_id","table_id","date","time") WHERE "status" = 'confirmed';
--> statement-breakpoint
CREATE UNIQUE INDEX "reviews_restaurant_user" ON "reviews" USING btree ("restaurant_id","user_id");
--> statement-breakpoint
CREATE INDEX "idx_restaurants_cuisine_en" ON "restaurants" USING btree ("cuisine_en");
--> statement-breakpoint
CREATE INDEX "idx_restaurants_district_en" ON "restaurants" USING btree ("district_en");
--> statement-breakpoint
CREATE INDEX "idx_bookings_source" ON "bookings" USING btree ("source");
--> statement-breakpoint
CREATE INDEX "idx_events_event_name" ON "events" USING btree ("event_name");

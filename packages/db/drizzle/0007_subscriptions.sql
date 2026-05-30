DO $$ BEGIN
 CREATE TYPE "public"."subscription_plan_type" AS ENUM('trial', 'premium');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."subscription_status" AS ENUM('trial', 'active', 'expired', 'cancelled');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "subscription_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" "subscription_plan_type" NOT NULL,
	"price_cents" integer NOT NULL,
	"max_bookings_monthly" integer NOT NULL,
	"features" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "subscription_plans_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "restaurant_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"restaurant_id" uuid NOT NULL,
	"plan_id" uuid NOT NULL,
	"status" "subscription_status" NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	"bookings_this_month" integer DEFAULT 0 NOT NULL,
	"last_reset_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "subscription_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subscription_id" uuid NOT NULL,
	"amount_cents" integer NOT NULL,
	"status" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "restaurant_blacklist" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"restaurant_id" uuid NOT NULL,
	"guest_phone" text NOT NULL,
	"guest_name" text,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "subscription_analytics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"restaurant_id" uuid NOT NULL,
	"date" date NOT NULL,
	"total_bookings" integer DEFAULT 0 NOT NULL,
	"confirmed_bookings" integer DEFAULT 0 NOT NULL,
	"cancelled_bookings" integer DEFAULT 0 NOT NULL,
	"revenue_cents" integer DEFAULT 0 NOT NULL,
	"occupancy_rate" numeric(5, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "restaurant_subscriptions" ADD CONSTRAINT "restaurant_subscriptions_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "restaurant_subscriptions" ADD CONSTRAINT "restaurant_subscriptions_plan_id_subscription_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."subscription_plans"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "subscription_payments" ADD CONSTRAINT "subscription_payments_subscription_id_restaurant_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."restaurant_subscriptions"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "restaurant_blacklist" ADD CONSTRAINT "restaurant_blacklist_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "subscription_analytics" ADD CONSTRAINT "subscription_analytics_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_restaurant_subscriptions_restaurant" ON "restaurant_subscriptions" USING btree ("restaurant_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "subscription_analytics_restaurant_date" ON "subscription_analytics" USING btree ("restaurant_id","date");
--> statement-breakpoint
INSERT INTO "subscription_plans" ("name", "price_cents", "max_bookings_monthly", "features")
VALUES
  ('trial', 0, 50, '["До 50 броней в месяц", "Email-уведомления о бронях"]'::jsonb),
  ('premium', 499000, 999999, '["Неограниченные брони", "Аналитика", "Приоритет в поиске", "Запрос отзывов"]'::jsonb)
ON CONFLICT ("name") DO NOTHING;
--> statement-breakpoint
INSERT INTO "restaurant_subscriptions" ("restaurant_id", "plan_id", "status", "expires_at")
SELECT r.id, p.id, 'trial', now() + interval '30 days'
FROM "restaurants" r
CROSS JOIN "subscription_plans" p
WHERE p.name = 'trial'
AND NOT EXISTS (
  SELECT 1 FROM "restaurant_subscriptions" rs WHERE rs.restaurant_id = r.id
);

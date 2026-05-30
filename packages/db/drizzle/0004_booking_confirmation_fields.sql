ALTER TABLE "bookings" ALTER COLUMN "user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "guest_name" text;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "guest_phone" text;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "is_manual" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "manual_note" text;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "rejection_reason" text;--> statement-breakpoint
ALTER TABLE "bookings" ALTER COLUMN "status" SET DEFAULT 'pending';--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_bookings_restaurant_status" ON "bookings" ("restaurant_id", "status");

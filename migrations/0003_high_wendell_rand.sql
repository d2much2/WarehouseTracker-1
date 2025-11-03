DROP TABLE "webauthn_credentials" CASCADE;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "qr_code" text;--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "webauthn_enabled";
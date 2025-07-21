ALTER TABLE `tracks` RENAME COLUMN "artwork" TO "embedded_artwork";--> statement-breakpoint
ALTER TABLE `tracks` ADD `alt_artwork` text;--> statement-breakpoint
ALTER TABLE `tracks` ADD `year` integer;--> statement-breakpoint
ALTER TABLE `tracks` ADD `edited_metadata` integer;--> statement-breakpoint
ALTER TABLE `tracks` ADD `artwork` text GENERATED ALWAYS AS (coalesce("alt_artwork", "embedded_artwork")) VIRTUAL;--> statement-breakpoint
ALTER TABLE `tracks` ADD `hidden_at` integer;--> statement-breakpoint
ALTER TABLE `tracks` ADD `discover_time` integer DEFAULT -1 NOT NULL;
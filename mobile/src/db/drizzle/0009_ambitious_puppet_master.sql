ALTER TABLE `tracks` RENAME COLUMN "artwork" TO "embedded_artwork";--> statement-breakpoint
ALTER TABLE `tracks` ADD `alt_artwork` text;--> statement-breakpoint
ALTER TABLE `tracks` ADD `artwork` text GENERATED ALWAYS AS (coalesce("alt_artwork", "embedded_artwork")) VIRTUAL;
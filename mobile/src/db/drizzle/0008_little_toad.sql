ALTER TABLE `tracks` ADD `parent_folder` text GENERATED ALWAYS AS (rtrim("uri", replace("uri", '/', ''))) VIRTUAL;--> statement-breakpoint
ALTER TABLE `albums` RENAME COLUMN "artwork" TO "embedded_artwork";--> statement-breakpoint
ALTER TABLE `albums` ADD `artwork` text GENERATED ALWAYS AS (coalesce("alt_artwork", "embedded_artwork")) VIRTUAL;
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_albums` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`artists_key` text NOT NULL,
	`artwork` text GENERATED ALWAYS AS (coalesce("alt_artwork", "embedded_artwork")) VIRTUAL,
	`embedded_artwork` text,
	`alt_artwork` text,
	`is_favorite` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_albums`("id", "name", "artists_key", "artwork", "embedded_artwork", "alt_artwork", "is_favorite") SELECT "id", "name", "artists_key", "artwork", "embedded_artwork", "alt_artwork", "is_favorite" FROM `albums`;--> statement-breakpoint
DROP TABLE `albums`;--> statement-breakpoint
ALTER TABLE `__new_albums` RENAME TO `albums`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `albums_name_artistsKey_unique` ON `albums` (`name`,`artists_key`);
CREATE TABLE `albums_to_artists` (
	`album_id` text NOT NULL,
	`artist_name` text NOT NULL,
	PRIMARY KEY(`album_id`, `artist_name`),
	FOREIGN KEY (`album_id`) REFERENCES `albums`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`artist_name`) REFERENCES `artists`(`name`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `hidden_tracks` (
	`id` text PRIMARY KEY NOT NULL,
	`uri` text NOT NULL,
	`name` text NOT NULL,
	`hidden_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tracks_to_artists` (
	`track_id` text NOT NULL,
	`artist_name` text NOT NULL,
	PRIMARY KEY(`track_id`, `artist_name`),
	FOREIGN KEY (`track_id`) REFERENCES `tracks`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`artist_name`) REFERENCES `artists`(`name`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_albums` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`raw_artist_name` text NOT NULL,
	`artists_key` text NOT NULL,
	`artwork` text GENERATED ALWAYS AS (coalesce("alt_artwork", "embedded_artwork")) VIRTUAL,
	`embedded_artwork` text,
	`alt_artwork` text,
	`is_favorite` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_albums`("id", "name", "raw_artist_name", "artists_key", "embedded_artwork", "alt_artwork", "is_favorite") SELECT "id", "name", "artist_name", "artist_name", "embedded_artwork", "alt_artwork", "is_favorite" FROM `albums`;--> statement-breakpoint
DROP TABLE `albums`;--> statement-breakpoint
ALTER TABLE `__new_albums` RENAME TO `albums`;--> statement-breakpoint
CREATE UNIQUE INDEX `albums_name_artistsKey_unique` ON `albums` (`name`,`artists_key`);--> statement-breakpoint
CREATE TABLE `__new_tracks` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`raw_artist_name` text,
	`album_id` text,
	`disc` integer,
	`track` integer,
	`year` integer,
	`duration` integer NOT NULL,
	`format` text,
	`bitrate` integer,
	`sample_rate` integer,
	`size` integer NOT NULL,
	`uri` text NOT NULL,
	`modification_time` integer NOT NULL,
	`discover_time` integer DEFAULT -1 NOT NULL,
	`artwork` text GENERATED ALWAYS AS (coalesce("alt_artwork", "embedded_artwork")) VIRTUAL,
	`embedded_artwork` text,
	`alt_artwork` text,
	`is_favorite` integer DEFAULT false NOT NULL,
	`fetched_art` integer DEFAULT false NOT NULL,
	`edited_metadata` integer,
	`hidden_at` integer,
	`last_played_at` integer DEFAULT -1 NOT NULL,
	`play_count` integer DEFAULT 0 NOT NULL,
	`parent_folder` text GENERATED ALWAYS AS (rtrim("uri", replace("uri", '/', ''))) VIRTUAL,
	FOREIGN KEY (`album_id`) REFERENCES `albums`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_tracks`("id", "name", "raw_artist_name", "album_id", "disc", "track", "year", "duration", "format", "bitrate", "sample_rate", "size", "uri", "modification_time", "discover_time", "embedded_artwork", "alt_artwork", "is_favorite", "fetched_art", "edited_metadata", "hidden_at", "last_played_at", "play_count") SELECT "id", "name", "artist_name", "album_id", "disc", "track", "year", "duration", "format", "bitrate", "sample_rate", "size", "uri", "modification_time", "discover_time", "embedded_artwork", "alt_artwork", "is_favorite", "fetched_art", "edited_metadata", "hidden_at", "last_played_at", "play_count" FROM `tracks`;--> statement-breakpoint
DROP TABLE `tracks`;--> statement-breakpoint
ALTER TABLE `__new_tracks` RENAME TO `tracks`;--> statement-breakpoint
PRAGMA foreign_keys=ON;
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_tracks` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`artist_name` text,
	`album_id` text,
	`artwork` text,
	`is_favorite` integer DEFAULT false NOT NULL,
	`duration` integer NOT NULL,
	`disc` integer,
	`track` integer,
	`format` text,
	`bitrate` integer,
	`sample_rate` integer,
	`size` integer NOT NULL,
	`uri` text NOT NULL,
	`modification_time` integer NOT NULL,
	`fetched_art` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`artist_name`) REFERENCES `artists`(`name`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`album_id`) REFERENCES `albums`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_tracks`("id", "name", "artist_name", "album_id", "artwork", "is_favorite", "duration", "disc", "track", "format", "bitrate", "sample_rate", "size", "uri", "modification_time", "fetched_art") SELECT "id", "name", "artist_name", "album_id", "artwork", "is_favorite", "duration", "disc", "track", "format", "bitrate", "sample_rate", "size", "uri", "modification_time", "fetched_art" FROM `tracks`;--> statement-breakpoint
DROP TABLE `tracks`;--> statement-breakpoint
ALTER TABLE `__new_tracks` RENAME TO `tracks`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_tracks_to_playlists` (
	`track_id` text NOT NULL,
	`playlist_name` text NOT NULL,
	PRIMARY KEY(`track_id`, `playlist_name`),
	FOREIGN KEY (`track_id`) REFERENCES `tracks`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`playlist_name`) REFERENCES `playlists`(`name`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_tracks_to_playlists`("track_id", "playlist_name") SELECT "track_id", "playlist_name" FROM `tracks_to_playlists`;--> statement-breakpoint
DROP TABLE `tracks_to_playlists`;--> statement-breakpoint
ALTER TABLE `__new_tracks_to_playlists` RENAME TO `tracks_to_playlists`;
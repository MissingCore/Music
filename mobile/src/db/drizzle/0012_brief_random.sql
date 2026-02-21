CREATE TABLE `genres` (
	`name` text PRIMARY KEY NOT NULL,
	`artwork` text
);
--> statement-breakpoint
CREATE TABLE `tracks_to_genres` (
	`track_id` text PRIMARY KEY NOT NULL,
	`genre_name` text NOT NULL,
	PRIMARY KEY(`track_id`, `genre_name`),
	FOREIGN KEY (`track_id`) REFERENCES `tracks`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`genre_name`) REFERENCES `genres`(`name`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_tracks_to_lyrics` (
	`track_id` text PRIMARY KEY NOT NULL,
	`lyric_id` text NOT NULL,
	PRIMARY KEY(`track_id`, `lyric_id`),
	FOREIGN KEY (`track_id`) REFERENCES `tracks`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`lyric_id`) REFERENCES `lyrics`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_tracks_to_lyrics`("track_id", "lyric_id") SELECT "track_id", "lyric_id" FROM `tracks_to_lyrics`;--> statement-breakpoint
DROP TABLE `tracks_to_lyrics`;--> statement-breakpoint
ALTER TABLE `__new_tracks_to_lyrics` RENAME TO `tracks_to_lyrics`;--> statement-breakpoint
PRAGMA foreign_keys=ON;
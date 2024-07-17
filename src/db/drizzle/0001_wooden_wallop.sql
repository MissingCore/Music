PRAGMA foreign_keys=off;
--> statement-breakpoint
CREATE TABLE `_tracks_new` (
	`id` text PRIMARY KEY NOT NULL,
	`artist_name` text,
	`album_id` text,
	`name` text NOT NULL,
	`artwork` text,
	`track` integer DEFAULT -1 NOT NULL,
	`duration` integer NOT NULL,
	`is_favorite` integer DEFAULT false NOT NULL,
	`uri` text NOT NULL,
	`modification_time` integer NOT NULL,
	`fetched_art` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`artist_name`) REFERENCES `artists`(`name`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`album_id`) REFERENCES `albums`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `_tracks_new` SELECT * FROM `tracks`;
--> statement-breakpoint
DROP TABLE `tracks`;
--> statement-breakpoint
ALTER TABLE `_tracks_new` RENAME TO `tracks`;
--> statement-breakpoint
PRAGMA foreign_keys=on;

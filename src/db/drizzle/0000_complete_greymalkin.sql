CREATE TABLE `albums` (
	`id` text PRIMARY KEY NOT NULL,
	`artist_name` text NOT NULL,
	`name` text NOT NULL,
	`artwork` text,
	`release_year` integer,
	`is_favorite` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`artist_name`) REFERENCES `artists`(`name`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `artists` (
	`name` text PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE `invalid_tracks` (
	`id` text PRIMARY KEY NOT NULL,
	`uri` text NOT NULL,
	`modification_time` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `playlists` (
	`name` text PRIMARY KEY NOT NULL,
	`artwork` text,
	`is_favorite` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tracks` (
	`id` text PRIMARY KEY NOT NULL,
	`artist_name` text NOT NULL,
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
CREATE TABLE `tracks_to_playlists` (
	`track_id` text NOT NULL,
	`playlist_name` text NOT NULL,
	PRIMARY KEY(`playlist_name`, `track_id`),
	FOREIGN KEY (`track_id`) REFERENCES `tracks`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`playlist_name`) REFERENCES `playlists`(`name`) ON UPDATE no action ON DELETE no action
);

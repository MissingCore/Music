CREATE TABLE `lyrics` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`lyrics` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tracks_to_lyrics` (
	`track_id` text PRIMARY KEY NOT NULL,
	`lyric_id` text NOT NULL,
	FOREIGN KEY (`track_id`) REFERENCES `tracks`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`lyric_id`) REFERENCES `lyrics`(`id`) ON UPDATE no action ON DELETE no action
);

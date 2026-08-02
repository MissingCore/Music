CREATE TABLE `tracks_play_events` (
	`id` text PRIMARY KEY NOT NULL,
	`track_id` text NOT NULL,
	`played_at` integer NOT NULL,
	`play_time` integer NOT NULL,
	FOREIGN KEY (`track_id`) REFERENCES `tracks`(`id`) ON UPDATE no action ON DELETE cascade
);

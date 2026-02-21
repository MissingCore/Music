CREATE TABLE `genres` (
	`name` text PRIMARY KEY NOT NULL,
	`artwork` text
);
--> statement-breakpoint
CREATE TABLE `tracks_to_genres` (
	`track_id` text NOT NULL,
	`genre_name` text NOT NULL,
	PRIMARY KEY(`track_id`, `genre_name`),
	FOREIGN KEY (`track_id`) REFERENCES `tracks`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`genre_name`) REFERENCES `genres`(`name`) ON UPDATE no action ON DELETE no action
);

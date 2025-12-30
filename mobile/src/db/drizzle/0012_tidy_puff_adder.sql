CREATE TABLE `tracks_to_artists` (
	`track_id` text NOT NULL,
	`artist_name` text NOT NULL,
	PRIMARY KEY(`track_id`, `artist_name`),
	FOREIGN KEY (`track_id`) REFERENCES `tracks`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`artist_name`) REFERENCES `artists`(`name`) ON UPDATE no action ON DELETE no action
);

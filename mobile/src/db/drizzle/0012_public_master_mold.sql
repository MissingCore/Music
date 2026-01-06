CREATE TABLE `albums_to_artists` (
	`album_id` text NOT NULL,
	`artist_name` text NOT NULL,
	PRIMARY KEY(`album_id`, `artist_name`),
	FOREIGN KEY (`album_id`) REFERENCES `albums`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`artist_name`) REFERENCES `artists`(`name`) ON UPDATE no action ON DELETE no action
);

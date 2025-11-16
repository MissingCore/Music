CREATE TABLE `waveform_sample` (
	`track_id` text PRIMARY KEY NOT NULL,
	`samples` text DEFAULT (json_array()) NOT NULL,
	FOREIGN KEY (`track_id`) REFERENCES `tracks`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
DROP INDEX `albums_name_artist_name_release_year_unique`;--> statement-breakpoint
CREATE UNIQUE INDEX `albums_name_artist_name_unique` ON `albums` (`name`,`artist_name`);--> statement-breakpoint
ALTER TABLE `albums` DROP COLUMN `release_year`;
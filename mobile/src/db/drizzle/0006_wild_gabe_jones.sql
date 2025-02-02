PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_albums` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`artist_name` text NOT NULL,
	`release_year` integer DEFAULT -1,
	`artwork` text,
	`is_favorite` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`artist_name`) REFERENCES `artists`(`name`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_albums`("id", "name", "artist_name", "release_year", "artwork", "is_favorite") SELECT "id", "name", "artist_name", "release_year", "artwork", "is_favorite" FROM `albums`;--> statement-breakpoint
DROP TABLE `albums`;--> statement-breakpoint
ALTER TABLE `__new_albums` RENAME TO `albums`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `albums_name_artist_name_release_year_unique` ON `albums` (`name`,`artist_name`,`release_year`);
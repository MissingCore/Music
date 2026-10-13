PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_lyrics` (
	`track_id` text PRIMARY KEY NOT NULL,
	`lyric_text` text NOT NULL,
	FOREIGN KEY (`track_id`) REFERENCES `tracks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_lyrics`("track_id", "lyric_text")
SELECT `tracks_to_lyrics`.`track_id`, `lyrics`.`lyrics`
FROM `tracks_to_lyrics`
INNER JOIN `lyrics` ON `tracks_to_lyrics`.`lyric_id` = `lyrics`.`id`;--> statement-breakpoint
DROP TABLE `tracks_to_lyrics`;--> statement-breakpoint
DROP TABLE `lyrics`;--> statement-breakpoint
ALTER TABLE `__new_lyrics` RENAME TO `lyrics`;--> statement-breakpoint
PRAGMA foreign_keys=ON;
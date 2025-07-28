CREATE TABLE `played_media_list` (
	`id` text NOT NULL,
	`type` text NOT NULL,
	`last_played_at` integer NOT NULL,
	PRIMARY KEY(`id`, `type`)
);
--> statement-breakpoint
ALTER TABLE `tracks` ADD `last_played_at` integer DEFAULT -1 NOT NULL;--> statement-breakpoint
ALTER TABLE `tracks` ADD `play_count` integer DEFAULT 0 NOT NULL;
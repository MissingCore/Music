CREATE TABLE `albums` (
	`id` text PRIMARY KEY NOT NULL,
	`artistId` text,
	`name` text NOT NULL,
	`coverSrc` text,
	`releaseYear` integer,
	`isFavorite` integer DEFAULT false,
	FOREIGN KEY (`artistId`) REFERENCES `artists`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `artists` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tracks` (
	`id` text PRIMARY KEY NOT NULL,
	`artistId` text,
	`albumId` text,
	`name` text NOT NULL,
	`coverSrc` text,
	`track` integer DEFAULT -1,
	`duration` integer NOT NULL,
	`isFavorite` integer DEFAULT false,
	FOREIGN KEY (`artistId`) REFERENCES `artists`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`albumId`) REFERENCES `albums`(`id`) ON UPDATE no action ON DELETE no action
);

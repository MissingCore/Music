CREATE TABLE `albums` (
	`id` text PRIMARY KEY NOT NULL,
	`artistName` text NOT NULL,
	`name` text NOT NULL,
	`coverSrc` text,
	`releaseYear` integer,
	`isFavorite` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`artistName`) REFERENCES `artists`(`name`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `artists` (
	`name` text PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE `invalidTracks` (
	`id` text PRIMARY KEY NOT NULL,
	`uri` text NOT NULL,
	`modificationTime` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tracks` (
	`id` text PRIMARY KEY NOT NULL,
	`artistName` text NOT NULL,
	`albumId` text,
	`name` text NOT NULL,
	`coverSrc` text,
	`track` integer DEFAULT -1 NOT NULL,
	`duration` integer NOT NULL,
	`isFavorite` integer DEFAULT false NOT NULL,
	`uri` text NOT NULL,
	`modificationTime` integer NOT NULL,
	FOREIGN KEY (`artistName`) REFERENCES `artists`(`name`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`albumId`) REFERENCES `albums`(`id`) ON UPDATE no action ON DELETE no action
);

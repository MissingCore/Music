CREATE TABLE `custom_fonts` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`uri` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `custom_themes` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`scheme` text DEFAULT 'light' NOT NULL,
	`primary` text NOT NULL,
	`primary_dim` text NOT NULL,
	`on_primary` text NOT NULL,
	`on_primary_variant` text NOT NULL,
	`secondary` text NOT NULL,
	`secondary_dim` text NOT NULL,
	`on_secondary` text NOT NULL,
	`on_secondary_variant` text NOT NULL,
	`error` text NOT NULL,
	`error_dim` text NOT NULL,
	`on_error` text NOT NULL,
	`on_error_variant` text NOT NULL,
	`surface_dim` text NOT NULL,
	`surface` text NOT NULL,
	`surface_bright` text NOT NULL,
	`surface_container_lowest` text NOT NULL,
	`surface_container_low` text NOT NULL,
	`surface_container` text NOT NULL,
	`surface_container_high` text NOT NULL,
	`surface_container_highest` text NOT NULL,
	`on_surface` text NOT NULL,
	`on_surface_variant` text NOT NULL,
	`outline` text NOT NULL,
	`outline_variant` text NOT NULL,
	`inverse_surface` text NOT NULL,
	`inverse_on_surface` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tracks_uri_unique` ON `tracks` (`uri`);
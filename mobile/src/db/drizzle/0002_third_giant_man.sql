CREATE TABLE `file_node` (
	`path` text PRIMARY KEY NOT NULL,
	`parent_path` text,
	`name` text NOT NULL,
	FOREIGN KEY (`parent_path`) REFERENCES `file_node`(`path`) ON UPDATE no action ON DELETE no action
);

CREATE TABLE `waveform_sample` (
	`track_id` text NOT NULL,
	`samples` text DEFAULT (json_array()) NOT NULL,
	FOREIGN KEY (`track_id`) REFERENCES `tracks`(`id`) ON UPDATE no action ON DELETE no action
);

CREATE TABLE `source_participation_log` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`daily_edition_id` text NOT NULL,
	`edition_date` text NOT NULL,
	`user_source_id` text,
	`source_id` text,
	`source_display_name_snapshot` text NOT NULL,
	`source_canonical_url_snapshot` text NOT NULL,
	`status` text NOT NULL,
	`selected_article_count` integer DEFAULT 0 NOT NULL,
	`reason` text,
	`error_message` text,
	`started_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`finished_at` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`daily_edition_id`) REFERENCES `daily_edition`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_source_id`) REFERENCES `user_source`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`source_id`) REFERENCES `source`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `source_participation_log_edition_user_source_unique` ON `source_participation_log` (`daily_edition_id`,`user_source_id`);--> statement-breakpoint
CREATE INDEX `source_participation_log_user_source_finished_idx` ON `source_participation_log` (`user_source_id`,`finished_at`);--> statement-breakpoint
CREATE INDEX `source_participation_log_daily_edition_idx` ON `source_participation_log` (`daily_edition_id`);
DROP INDEX "article_canonical_url_unique";--> statement-breakpoint
DROP INDEX "article_published_at_idx";--> statement-breakpoint
DROP INDEX "article_content_hash_idx";--> statement-breakpoint
DROP INDEX "article_process_job_article_id_status_scheduled_for_idx";--> statement-breakpoint
DROP INDEX "daily_edition_user_id_edition_date_unique";--> statement-breakpoint
DROP INDEX "daily_edition_article_daily_edition_id_article_id_unique";--> statement-breakpoint
DROP INDEX "daily_edition_article_daily_edition_id_position_unique";--> statement-breakpoint
DROP INDEX "source_canonical_url_unique";--> statement-breakpoint
DROP INDEX "source_article_source_id_article_id_unique";--> statement-breakpoint
DROP INDEX "source_fetch_job_source_id_status_scheduled_for_idx";--> statement-breakpoint
DROP INDEX "user_source_user_id_source_id_unique";--> statement-breakpoint
DROP INDEX "user_source_source_id_is_active_idx";--> statement-breakpoint
DROP INDEX "account_userId_idx";--> statement-breakpoint
DROP INDEX "session_token_unique";--> statement-breakpoint
DROP INDEX "session_userId_idx";--> statement-breakpoint
DROP INDEX "user_email_unique";--> statement-breakpoint
DROP INDEX "verification_identifier_idx";--> statement-breakpoint
ALTER TABLE `daily_edition_article` ALTER COLUMN "position" TO "position" real NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `article_canonical_url_unique` ON `article` (`canonical_url`);--> statement-breakpoint
CREATE INDEX `article_published_at_idx` ON `article` (`published_at`);--> statement-breakpoint
CREATE INDEX `article_content_hash_idx` ON `article` (`content_hash`);--> statement-breakpoint
CREATE INDEX `article_process_job_article_id_status_scheduled_for_idx` ON `article_process_job` (`article_id`,`status`,`scheduled_for`);--> statement-breakpoint
CREATE UNIQUE INDEX `daily_edition_user_id_edition_date_unique` ON `daily_edition` (`user_id`,`edition_date`);--> statement-breakpoint
CREATE UNIQUE INDEX `daily_edition_article_daily_edition_id_article_id_unique` ON `daily_edition_article` (`daily_edition_id`,`article_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `daily_edition_article_daily_edition_id_position_unique` ON `daily_edition_article` (`daily_edition_id`,`position`);--> statement-breakpoint
CREATE UNIQUE INDEX `source_canonical_url_unique` ON `source` (`canonical_url`);--> statement-breakpoint
CREATE UNIQUE INDEX `source_article_source_id_article_id_unique` ON `source_article` (`source_id`,`article_id`);--> statement-breakpoint
CREATE INDEX `source_fetch_job_source_id_status_scheduled_for_idx` ON `source_fetch_job` (`source_id`,`status`,`scheduled_for`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_source_user_id_source_id_unique` ON `user_source` (`user_id`,`source_id`);--> statement-breakpoint
CREATE INDEX `user_source_source_id_is_active_idx` ON `user_source` (`source_id`,`is_active`);--> statement-breakpoint
CREATE INDEX `account_userId_idx` ON `account` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE INDEX `session_userId_idx` ON `session` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE INDEX `verification_identifier_idx` ON `verification` (`identifier`);
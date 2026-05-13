CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`password_hash` text NOT NULL,
	`team` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `parties` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`owner_id` integer NOT NULL,
	`name` text NOT NULL,
	`restaurant_id` integer,
	`restaurant_name_freetext` text,
	`depart_at` integer NOT NULL,
	`join_until` integer NOT NULL,
	`place` text,
	`price_band` text,
	`capacity` integer NOT NULL,
	`rules` text,
	`is_silent` integer DEFAULT false NOT NULL,
	`extra_schedule` text,
	`notice` text,
	`status` text DEFAULT 'open' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `parties_depart_status_idx` ON `parties` (`depart_at`,`status`);--> statement-breakpoint
CREATE TABLE `party_members` (
	`party_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	`joined_at` integer NOT NULL,
	PRIMARY KEY(`party_id`, `user_id`),
	FOREIGN KEY (`party_id`) REFERENCES `parties`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `party_members_user_idx` ON `party_members` (`user_id`);--> statement-breakpoint
CREATE TABLE `menus` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`restaurant_id` integer NOT NULL,
	`name` text NOT NULL,
	`price` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `menus_restaurant_idx` ON `menus` (`restaurant_id`);--> statement-breakpoint
CREATE TABLE `restaurant_tags` (
	`restaurant_id` integer NOT NULL,
	`tag_id` integer NOT NULL,
	`tagged_by` integer,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`restaurant_id`, `tag_id`),
	FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`tagged_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `restaurant_tags_tag_idx` ON `restaurant_tags` (`tag_id`);--> statement-breakpoint
CREATE TABLE `restaurants` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`address` text,
	`category1` text,
	`category2` text,
	`wait_level` text,
	`reservation_required` integer DEFAULT false NOT NULL,
	`naver_place_id` text,
	`lat` real,
	`lng` real,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tags` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`label` text NOT NULL,
	`usage_count` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tags_label_unique` ON `tags` (`label`);--> statement-breakpoint
CREATE TABLE `menu_ratings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`menu_id` integer NOT NULL,
	`rater_user_id` integer NOT NULL,
	`party_id` integer NOT NULL,
	`stars` integer NOT NULL,
	`comment` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`menu_id`) REFERENCES `menus`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`rater_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`party_id`) REFERENCES `parties`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `menu_ratings_menu_idx` ON `menu_ratings` (`menu_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `menu_ratings_menu_id_rater_user_id_party_id_unique` ON `menu_ratings` (`menu_id`,`rater_user_id`,`party_id`);--> statement-breakpoint
CREATE TABLE `restaurant_ratings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`restaurant_id` integer NOT NULL,
	`rater_user_id` integer NOT NULL,
	`party_id` integer NOT NULL,
	`stars` integer,
	`tags_json` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`rater_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`party_id`) REFERENCES `parties`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `restaurant_ratings_restaurant_idx` ON `restaurant_ratings` (`restaurant_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `restaurant_ratings_restaurant_id_rater_user_id_party_id_unique` ON `restaurant_ratings` (`restaurant_id`,`rater_user_id`,`party_id`);
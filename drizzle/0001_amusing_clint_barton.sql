CREATE TABLE `connections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sourceId` int NOT NULL,
	`targetId` int NOT NULL,
	`relationshipType` varchar(50) NOT NULL,
	`strength` int DEFAULT 50,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `connections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `entities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` enum('founder','investor','enabler') NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320),
	`firm` varchar(255),
	`title` varchar(255),
	`bio` text,
	`sector` varchar(100),
	`subSector` varchar(100),
	`stage` varchar(50),
	`geography` varchar(100),
	`checkSizeMin` int,
	`checkSizeMax` int,
	`thesis` text,
	`linkedinUrl` varchar(500),
	`websiteUrl` varchar(500),
	`avatarUrl` varchar(500),
	`tags` text,
	`confidence` int DEFAULT 85,
	`lastInteraction` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `entities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lists` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`entityIds` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lists_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `matches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`founderId` int NOT NULL,
	`investorId` int NOT NULL,
	`score` int NOT NULL,
	`sectorScore` int DEFAULT 0,
	`stageScore` int DEFAULT 0,
	`geoScore` int DEFAULT 0,
	`tractionScore` int DEFAULT 0,
	`checkSizeScore` int DEFAULT 0,
	`graphScore` int DEFAULT 0,
	`explanation` text,
	`introPath` text,
	`status` enum('suggested','contacted','meeting_scheduled','passed','invested') DEFAULT 'suggested',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `matches_id` PRIMARY KEY(`id`)
);

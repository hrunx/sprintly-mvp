CREATE TABLE IF NOT EXISTS `connectionCompanyLinks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`profileId` varchar(64) NOT NULL,
	`companyId` int NOT NULL,
	`relationship` varchar(50) DEFAULT 'founder',
	`confidence` int DEFAULT 70,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `connectionCompanyLinks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `connectionProfiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`profileId` varchar(64) NOT NULL,
	`fullName` varchar(255),
	`role` enum('investor','founder','operator') NOT NULL DEFAULT 'operator',
	`email` varchar(320),
	`linkedinUrl` varchar(500),
	`accuracy` int DEFAULT 0,
	`confidence` int DEFAULT 0,
	`rawSource` text,
	`enrichedProfile` text,
	`scrapedSummary` text,
	`scrapedFacts` text,
	`investorId` int,
	`primaryCompanyId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `connectionProfiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `connectionProfiles_profileId_unique` UNIQUE(`profileId`)
);

CREATE TABLE `companies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`sector` varchar(100),
	`subSector` varchar(100),
	`stage` varchar(50),
	`geography` varchar(100),
	`foundedYear` int,
	`teamSize` int,
	`fundingRound` varchar(50),
	`fundingTarget` int,
	`fundingRaised` int,
	`valuation` int,
	`revenue` int,
	`revenueGrowth` int,
	`customers` int,
	`mrr` int,
	`businessModel` varchar(100),
	`targetMarket` text,
	`competitiveAdvantage` text,
	`pitchDeckUrl` varchar(500),
	`pitchDeckAnalysis` text,
	`websiteUrl` varchar(500),
	`logoUrl` varchar(500),
	`founderName` varchar(255),
	`founderEmail` varchar(320),
	`founderLinkedin` varchar(500),
	`tags` text,
	`confidence` int DEFAULT 85,
	`lastInteraction` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `companies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `introRequests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`investorId` int NOT NULL,
	`requestedBy` int NOT NULL,
	`connectionId` int,
	`status` enum('pending','accepted','declined','completed') NOT NULL DEFAULT 'pending',
	`message` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `introRequests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `investors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` varchar(50),
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
	`portfolioCompanies` text,
	`notableInvestments` text,
	`investmentCount` int,
	`email` varchar(320),
	`linkedinUrl` varchar(500),
	`websiteUrl` varchar(500),
	`avatarUrl` varchar(500),
	`tags` text,
	`confidence` int DEFAULT 85,
	`lastInteraction` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `investors_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `legacy_matches` (
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
	CONSTRAINT `legacy_matches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `matchingConfig` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`weights` text NOT NULL,
	`filters` text NOT NULL,
	`thresholds` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `matchingConfig_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `matches` ADD `companyId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `matches` ADD `thesisScore` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `matches` ADD `matchReasons` text;--> statement-breakpoint
ALTER TABLE `matches` ADD `concerns` text;--> statement-breakpoint
ALTER TABLE `matches` DROP COLUMN `founderId`;
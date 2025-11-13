import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

console.log("🌱 Starting seed process for local deployment...\n");

// Drop existing tables
console.log("📦 Dropping existing tables...");
await connection.execute("DROP TABLE IF EXISTS introRequests");
await connection.execute("DROP TABLE IF EXISTS matches");
await connection.execute("DROP TABLE IF EXISTS matchingConfig");
await connection.execute("DROP TABLE IF EXISTS investors");
await connection.execute("DROP TABLE IF EXISTS companies");
await connection.execute("DROP TABLE IF EXISTS users");
console.log("✅ Tables dropped\n");

// Create users table
console.log("📦 Creating users table...");
await connection.execute(`
  CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(320) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    name TEXT,
    role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    lastSignedIn TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);
console.log("✅ Users table created\n");

// Create companies table
console.log("📦 Creating companies table...");
await connection.execute(`
  CREATE TABLE companies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    website VARCHAR(500),
    sector VARCHAR(100),
    stage VARCHAR(50),
    location VARCHAR(100),
    founded INT,
    teamSize INT,
    businessModel VARCHAR(100),
    fundingRound VARCHAR(50),
    seeking INT,
    alreadyRaised INT,
    valuation INT,
    annualRevenue INT,
    revenueGrowth INT,
    customers INT,
    mrr INT,
    founderName VARCHAR(255),
    founderEmail VARCHAR(255),
    founderLinkedIn VARCHAR(500),
    pitchDeckUrl VARCHAR(500),
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )
`);
console.log("✅ Companies table created\n");

// Create investors table
console.log("📦 Creating investors table...");
await connection.execute(`
  CREATE TABLE investors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50),
    firm VARCHAR(255),
    bio TEXT,
    sector TEXT,
    stage TEXT,
    geography TEXT,
    checkSizeMin INT,
    checkSizeMax INT,
    email VARCHAR(255),
    linkedIn VARCHAR(500),
    website VARCHAR(500),
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )
`);
console.log("✅ Investors table created\n");

// Create matches table
console.log("📦 Creating matches table...");
await connection.execute(`
  CREATE TABLE matches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    companyId INT NOT NULL,
    investorId INT NOT NULL,
    overallScore INT NOT NULL,
    sectorScore INT,
    stageScore INT,
    geoScore INT,
    tractionScore INT,
    checkSizeScore INT,
    thesisScore INT,
    matchReasons TEXT,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);
console.log("✅ Matches table created\n");

// Create introRequests table
console.log("📦 Creating introRequests table...");
await connection.execute(`
  CREATE TABLE introRequests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    companyId INT NOT NULL,
    investorId INT NOT NULL,
    status ENUM('pending', 'accepted', 'declined') NOT NULL DEFAULT 'pending',
    message TEXT,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )
`);
console.log("✅ IntroRequests table created\n");

// Create matchingConfig table
console.log("📦 Creating matchingConfig table...");
await connection.execute(`
  CREATE TABLE matchingConfig (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId INT NOT NULL,
    sectorWeight INT NOT NULL DEFAULT 25,
    stageWeight INT NOT NULL DEFAULT 20,
    geoWeight INT NOT NULL DEFAULT 15,
    tractionWeight INT NOT NULL DEFAULT 20,
    checkSizeWeight INT NOT NULL DEFAULT 20,
    minOverallScore INT NOT NULL DEFAULT 60,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )
`);
console.log("✅ MatchingConfig table created\n");

// Seed demo user
console.log("👤 Creating demo user...");
const hashedPassword = await bcrypt.hash("demo1234", 10);
await connection.execute(
  "INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)",
  ["demo@sprintly.ai", hashedPassword, "Demo User", "admin"]
);
console.log("✅ Demo user created (demo@sprintly.ai / demo1234)\n");

// Seed companies
console.log("🏢 Seeding companies...");
const companyData = [
  {
    name: "FinFlow AI",
    description: "AI-powered cash flow forecasting platform for SMBs",
    sector: "Fintech",
    stage: "Seed",
    location: "San Francisco, CA",
    founded: 2022,
    teamSize: 8,
    businessModel: "B2B SaaS",
    fundingRound: "Seed",
    seeking: 2000000,
    alreadyRaised: 500000,
    valuation: 8000000,
    annualRevenue: 150000,
    revenueGrowth: 300,
    customers: 45,
    mrr: 12500,
    founderName: "Sarah Chen",
    founderEmail: "sarah@finflow.ai",
  },
  {
    name: "HealthSync",
    description: "Telemedicine platform for emerging markets",
    sector: "Healthcare",
    stage: "Series A",
    location: "New York, NY",
    founded: 2021,
    teamSize: 25,
    businessModel: "B2C",
    fundingRound: "Series A",
    seeking: 5000000,
    alreadyRaised: 3000000,
    valuation: 25000000,
    annualRevenue: 800000,
    revenueGrowth: 250,
    customers: 12000,
    mrr: 66000,
    founderName: "Dr. James Wilson",
    founderEmail: "james@healthsync.io",
  },
  {
    name: "CodeMentor AI",
    description: "AI coding tutor with personalized learning paths",
    sector: "EdTech",
    stage: "Seed",
    location: "Austin, TX",
    founded: 2023,
    teamSize: 12,
    businessModel: "B2B SaaS",
    fundingRound: "Seed",
    seeking: 3000000,
    alreadyRaised: 1000000,
    valuation: 12000000,
    annualRevenue: 250000,
    revenueGrowth: 400,
    customers: 5000,
    mrr: 20000,
    founderName: "Alex Kumar",
    founderEmail: "alex@codementor.ai",
  },
];

for (const company of companyData) {
  await connection.execute(
    `INSERT INTO companies (name, description, sector, stage, location, founded, teamSize, businessModel, 
     fundingRound, seeking, alreadyRaised, valuation, annualRevenue, revenueGrowth, customers, mrr, 
     founderName, founderEmail) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      company.name,
      company.description,
      company.sector,
      company.stage,
      company.location,
      company.founded,
      company.teamSize,
      company.businessModel,
      company.fundingRound,
      company.seeking,
      company.alreadyRaised,
      company.valuation,
      company.annualRevenue,
      company.revenueGrowth,
      company.customers,
      company.mrr,
      company.founderName,
      company.founderEmail,
    ]
  );
}
console.log(`✅ ${companyData.length} companies seeded\n`);

// Seed investors
console.log("💼 Seeding investors...");
const investorData = [
  {
    name: "Michael Rodriguez",
    type: "Angel Investor",
    firm: "Tech Angels Network",
    bio: "Former founder of 2 successful SaaS companies. Focused on early-stage B2B software.",
    sector: "Fintech, SaaS, AI/ML",
    stage: "Pre-seed, Seed",
    geography: "North America",
    checkSizeMin: 50000,
    checkSizeMax: 500000,
    email: "michael@techangels.com",
  },
  {
    name: "Jennifer Park",
    type: "VC Partner",
    firm: "HealthTech Ventures",
    bio: "20+ years in healthcare innovation. Led investments in 15 healthcare unicorns.",
    sector: "Healthcare, Biotech",
    stage: "Seed, Series A",
    geography: "North America, Europe",
    checkSizeMin: 1000000,
    checkSizeMax: 10000000,
    email: "jennifer@healthtechvc.com",
  },
  {
    name: "David Thompson",
    type: "VC Partner",
    firm: "EdTech Capital",
    bio: "Education technology expert. Former VP at Coursera. Passionate about democratizing education.",
    sector: "EdTech, AI/ML",
    stage: "Seed, Series A, Series B",
    geography: "Global",
    checkSizeMin: 2000000,
    checkSizeMax: 15000000,
    email: "david@edtechcapital.com",
  },
];

for (const investor of investorData) {
  await connection.execute(
    `INSERT INTO investors (name, type, firm, bio, sector, stage, geography, checkSizeMin, checkSizeMax, email) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      investor.name,
      investor.type,
      investor.firm,
      investor.bio,
      investor.sector,
      investor.stage,
      investor.geography,
      investor.checkSizeMin,
      investor.checkSizeMax,
      investor.email,
    ]
  );
}
console.log(`✅ ${investorData.length} investors seeded\n`);

// Seed matches
console.log("🎯 Generating matches...");
const matchData = [
  {
    companyId: 1,
    investorId: 1,
    overallScore: 92,
    sectorScore: 100,
    stageScore: 95,
    geoScore: 100,
    tractionScore: 85,
    checkSizeScore: 80,
    matchReasons:
      "Perfect sector alignment in Fintech. Investor actively seeking Seed-stage B2B SaaS. Strong traction metrics match investor criteria.",
  },
  {
    companyId: 2,
    investorId: 2,
    overallScore: 95,
    sectorScore: 100,
    stageScore: 100,
    geoScore: 100,
    tractionScore: 90,
    checkSizeScore: 90,
    matchReasons:
      "Ideal healthcare sector match. Series A stage aligns perfectly. Strong revenue growth and customer base.",
  },
  {
    companyId: 3,
    investorId: 3,
    overallScore: 88,
    sectorScore: 95,
    stageScore: 90,
    geoScore: 100,
    tractionScore: 85,
    checkSizeScore: 75,
    matchReasons:
      "EdTech focus with AI/ML component. Seed stage with strong growth potential. Global reach aligns with investor geography.",
  },
];

for (const match of matchData) {
  await connection.execute(
    `INSERT INTO matches (companyId, investorId, overallScore, sectorScore, stageScore, geoScore, 
     tractionScore, checkSizeScore, matchReasons) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      match.companyId,
      match.investorId,
      match.overallScore,
      match.sectorScore,
      match.stageScore,
      match.geoScore,
      match.tractionScore,
      match.checkSizeScore,
      match.matchReasons,
    ]
  );
}
console.log(`✅ ${matchData.length} matches generated\n`);

console.log("🎉 Seed complete!\n");
console.log("📋 Summary:");
console.log("  - Demo user: demo@sprintly.ai / demo1234");
console.log(`  - Companies: ${companyData.length}`);
console.log(`  - Investors: ${investorData.length}`);
console.log(`  - Matches: ${matchData.length}`);
console.log("\n✨ You can now login and test the platform!");

await connection.end();
process.exit(0);

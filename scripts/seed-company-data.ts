import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as dotenv from "dotenv";
import { companies, investors, matches, connections } from "../drizzle/schema";

// Load environment variables
dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// Parse DATABASE_URL
const dbUrl = new URL(process.env.DATABASE_URL);

// Create MySQL connection pool
const pool = mysql.createPool({
  host: dbUrl.hostname,
  port: parseInt(dbUrl.port || "3306"),
  user: dbUrl.username,
  password: dbUrl.password,
  database: dbUrl.pathname.slice(1), // Remove leading '/'
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Create drizzle instance with the pool
const db = drizzle(pool);

const sectors = [
  "Fintech",
  "Healthcare",
  "AI/ML",
  "SaaS",
  "E-commerce",
  "Climate Tech",
  "EdTech",
  "Logistics",
  "Cybersecurity",
  "Biotech",
];

const stages = ["Pre-seed", "Seed", "Series A", "Series B"];

const geographies = [
  "North America",
  "Europe",
  "Asia-Pacific",
  "Middle East",
  "Latin America",
];

const businessModels = ["B2B SaaS", "B2C", "Marketplace", "Enterprise", "D2C", "Platform"];

// Realistic company names and descriptions
const companyTemplates = [
  {
    name: "FinFlow",
    sector: "Fintech",
    description: "AI-powered cash flow forecasting platform for SMBs. Helps businesses predict financial health 90 days in advance using machine learning.",
    businessModel: "B2B SaaS",
    competitiveAdvantage: "Proprietary ML models trained on 500K+ SMB financial datasets with 94% accuracy",
  },
  {
    name: "HealthSync",
    sector: "Healthcare",
    description: "Telemedicine platform connecting patients with specialists in emerging markets. Reducing wait times from weeks to hours.",
    businessModel: "B2C",
    competitiveAdvantage: "First-mover in 12 underserved markets with exclusive hospital partnerships",
  },
  {
    name: "CodeMentor AI",
    sector: "EdTech",
    description: "AI coding tutor that provides personalized learning paths for developers. Used by 50K+ students globally.",
    businessModel: "B2C",
    competitiveAdvantage: "Adaptive learning engine that reduces time-to-proficiency by 40%",
  },
  {
    name: "GreenChain",
    sector: "Climate Tech",
    description: "Carbon tracking and offset marketplace for supply chains. Helping enterprises meet net-zero commitments.",
    businessModel: "B2B SaaS",
    competitiveAdvantage: "Real-time carbon accounting integrated with major ERP systems",
  },
  {
    name: "ShopLocal",
    sector: "E-commerce",
    description: "Hyperlocal e-commerce platform connecting neighborhood stores with consumers. 2-hour delivery guarantee.",
    businessModel: "Marketplace",
    competitiveAdvantage: "Network of 5,000+ local merchants with proprietary logistics optimization",
  },
  {
    name: "SecureVault",
    sector: "Cybersecurity",
    description: "Zero-trust security platform for remote teams. Protecting 100M+ endpoints across 50 countries.",
    businessModel: "Enterprise",
    competitiveAdvantage: "Military-grade encryption with seamless UX, 99.99% uptime SLA",
  },
  {
    name: "FarmTech Pro",
    sector: "Climate Tech",
    description: "IoT sensors and AI analytics for precision agriculture. Increasing crop yields by 30% while reducing water usage.",
    businessModel: "B2B SaaS",
    competitiveAdvantage: "Proprietary soil health algorithms validated across 10M+ acres",
  },
  {
    name: "TalentMatch",
    sector: "AI/ML",
    description: "AI-powered recruitment platform that matches candidates to roles based on skills, not resumes.",
    businessModel: "B2B SaaS",
    competitiveAdvantage: "Reduces time-to-hire by 60% with 85% candidate retention rate",
  },
  {
    name: "MediChain",
    sector: "Healthcare",
    description: "Blockchain-based medical records platform ensuring data portability and patient privacy.",
    businessModel: "Enterprise",
    competitiveAdvantage: "HIPAA-compliant with 200+ hospital integrations",
  },
  {
    name: "EduStream",
    sector: "EdTech",
    description: "Live interactive learning platform for K-12 students. Combines video streaming with real-time collaboration tools.",
    businessModel: "B2C",
    competitiveAdvantage: "Proprietary engagement analytics showing 3x higher completion rates",
  },
];

// Generate more company variations
function generateCompanies(count: number) {
  const companies = [];
  for (let i = 0; i < count; i++) {
    const template = companyTemplates[i % companyTemplates.length];
    const stage = stages[Math.floor(Math.random() * stages.length)];
    const geography = geographies[Math.floor(Math.random() * geographies.length)];
    
    // Funding amounts based on stage
    const fundingMap: Record<string, { target: number; raised: number; valuation: number }> = {
      "Pre-seed": { target: 500000, raised: 100000, valuation: 2000000 },
      "Seed": { target: 2000000, raised: 500000, valuation: 8000000 },
      "Series A": { target: 10000000, raised: 3000000, valuation: 40000000 },
      "Series B": { target: 30000000, raised: 15000000, valuation: 150000000 },
    };
    
    const funding = fundingMap[stage];
    const revenue = stage === "Pre-seed" ? 0 : Math.floor(Math.random() * 5000000);
    const customers = Math.floor(Math.random() * 10000) + 100;
    
    companies.push({
      name: `${template.name}${i > 9 ? ` ${String.fromCharCode(65 + (i % 26))}` : ""}`,
      description: template.description,
      sector: template.sector,
      subSector: `${template.sector} ${["Analytics", "Platform", "Infrastructure", "Tools"][Math.floor(Math.random() * 4)]}`,
      stage,
      geography,
      foundedYear: 2020 + Math.floor(Math.random() * 4),
      teamSize: Math.floor(Math.random() * 50) + 5,
      fundingRound: stage,
      fundingTarget: funding.target,
      fundingRaised: funding.raised,
      valuation: funding.valuation,
      revenue,
      revenueGrowth: Math.floor(Math.random() * 200) + 50,
      customers,
      mrr: Math.floor(revenue / 12),
      businessModel: template.businessModel,
      targetMarket: `${geography} ${template.sector} market, targeting ${customers > 5000 ? "enterprise" : "SMB"} customers`,
      competitiveAdvantage: template.competitiveAdvantage,
      pitchDeckUrl: `https://storage.example.com/pitch-decks/${template.name.toLowerCase()}-${i}.pdf`,
      pitchDeckAnalysis: `Strong value proposition in ${template.sector}. Team has relevant experience. Market size is substantial ($${Math.floor(Math.random() * 50) + 10}B). Traction metrics show ${Math.floor(Math.random() * 100) + 50}% MoM growth. Key risks: competition and regulatory challenges.`,
      websiteUrl: `https://${template.name.toLowerCase()}.com`,
      logoUrl: `https://api.dicebear.com/7.x/shapes/svg?seed=${template.name}${i}`,
      founderName: `${["Alex", "Sam", "Jordan", "Taylor", "Morgan"][i % 5]} ${["Chen", "Patel", "Kim", "Garcia", "Johnson"][Math.floor(Math.random() * 5)]}`,
      founderEmail: `founder@${template.name.toLowerCase()}.com`,
      founderLinkedin: `https://linkedin.com/in/${template.name.toLowerCase()}-founder`,
      tags: JSON.stringify([template.sector, template.businessModel, stage, "Venture-backed", geography.split(" ")[0]]),
      confidence: 80 + Math.floor(Math.random() * 20),
    });
  }
  return companies;
}

// Generate investor data
function generateInvestors(count: number) {
  const investorNames = [
    "Sequoia Capital", "Andreessen Horowitz", "Accel Partners", "Benchmark", "Greylock Partners",
    "Kleiner Perkins", "Lightspeed Venture", "NEA", "General Catalyst", "Insight Partners",
    "Tiger Global", "Coatue", "DST Global", "SoftBank Vision", "GGV Capital",
    "Index Ventures", "Bessemer Venture", "Battery Ventures", "First Round Capital", "Union Square Ventures",
  ];
  
  const investors = [];
  for (let i = 0; i < count; i++) {
    const firm = investorNames[i % investorNames.length];
    const sector = sectors[Math.floor(Math.random() * sectors.length)];
    const stage = stages[Math.floor(Math.random() * stages.length)];
    const geography = geographies[Math.floor(Math.random() * geographies.length)];
    const type = ["VC", "Angel", "Corporate VC", "Family Office"][Math.floor(Math.random() * 4)];
    
    const checkSizes: Record<string, { min: number; max: number }> = {
      "Pre-seed": { min: 100000, max: 500000 },
      "Seed": { min: 500000, max: 3000000 },
      "Series A": { min: 5000000, max: 15000000 },
      "Series B": { min: 15000000, max: 50000000 },
    };
    
    const checks = checkSizes[stage];
    
    investors.push({
      name: `${["Sarah", "Michael", "Jessica", "David", "Emily"][i % 5]} ${["Zhang", "Kumar", "Lee", "Brown", "Wilson"][Math.floor(Math.random() * 5)]}`,
      type,
      firm: i > 19 ? `${firm} ${String.fromCharCode(65 + (i % 26))}` : firm,
      title: ["Partner", "Managing Partner", "Principal", "Associate Partner"][Math.floor(Math.random() * 4)],
      bio: `${Math.floor(Math.random() * 15) + 5}+ years investing in ${sector} companies. Previously ${["founded", "exited", "scaled"][Math.floor(Math.random() * 3)]} ${Math.floor(Math.random() * 3) + 1} startups. Passionate about backing mission-driven founders.`,
      sector,
      subSector: `${sector} ${["Infrastructure", "Applications", "Tools"][Math.floor(Math.random() * 3)]}`,
      stage,
      geography,
      checkSizeMin: checks.min,
      checkSizeMax: checks.max,
      thesis: `Investing in ${stage} ${sector} companies in ${geography} that demonstrate strong product-market fit and capital efficiency. Looking for 10x potential with experienced founding teams.`,
      portfolioCompanies: JSON.stringify([
        `${companyTemplates[Math.floor(Math.random() * companyTemplates.length)].name}`,
        `${companyTemplates[Math.floor(Math.random() * companyTemplates.length)].name}`,
        `${companyTemplates[Math.floor(Math.random() * companyTemplates.length)].name}`,
      ]),
      notableInvestments: `Led rounds in ${Math.floor(Math.random() * 10) + 5} companies, ${Math.floor(Math.random() * 3) + 1} exits including ${["IPO", "acquisition", "secondary sale"][Math.floor(Math.random() * 3)]}`,
      investmentCount: Math.floor(Math.random() * 50) + 10,
      email: `${["sarah", "michael", "jessica", "david", "emily"][i % 5]}@${firm.toLowerCase().replace(/\s+/g, "")}.com`,
      linkedinUrl: `https://linkedin.com/in/${firm.toLowerCase().replace(/\s+/g, "")}-${i}`,
      websiteUrl: `https://${firm.toLowerCase().replace(/\s+/g, "")}.com`,
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${firm}${i}`,
      tags: JSON.stringify([sector, stage, geography.split(" ")[0], type, "Active investor"]),
      confidence: 85 + Math.floor(Math.random() * 15),
    });
  }
  return investors;
}

// Generate matches between companies and investors
function generateMatches(companyIds: number[], investorIds: number[]) {
  const matches = [];
  const matchCount = Math.min(companyIds.length * 3, 200); // 3 matches per company, max 200
  
  for (let i = 0; i < matchCount; i++) {
    const companyId = companyIds[Math.floor(Math.random() * companyIds.length)];
    const investorId = investorIds[Math.floor(Math.random() * investorIds.length)];
    
    // Generate realistic scores
    const sectorScore = Math.floor(Math.random() * 30) + 70;
    const stageScore = Math.floor(Math.random() * 30) + 70;
    const geoScore = Math.floor(Math.random() * 40) + 60;
    const tractionScore = Math.floor(Math.random() * 40) + 50;
    const checkSizeScore = Math.floor(Math.random() * 30) + 70;
    const thesisScore = Math.floor(Math.random() * 30) + 65;
    const graphScore = Math.floor(Math.random() * 50) + 30;
    
    const score = Math.floor((sectorScore + stageScore + geoScore + tractionScore + checkSizeScore + thesisScore + graphScore) / 7);
    
    const matchReasons = [
      "Strong sector alignment with investor thesis",
      "Company stage matches investor focus",
      "Funding amount within investor check size range",
      "Geographic presence aligns with investor portfolio",
      "Traction metrics exceed investor benchmarks",
    ];
    
    const concerns = [
      "Competitive landscape is crowded",
      "Regulatory risks in target market",
      "Team needs strengthening in key areas",
    ];
    
    matches.push({
      companyId,
      investorId,
      score,
      sectorScore,
      stageScore,
      geoScore,
      tractionScore,
      checkSizeScore,
      thesisScore,
      graphScore,
      explanation: `This is a ${score > 80 ? "strong" : score > 65 ? "good" : "moderate"} match based on sector alignment (${sectorScore}%), stage fit (${stageScore}%), and traction metrics (${tractionScore}%). The investor has a proven track record in this space and the company's funding needs align with typical check sizes.`,
      matchReasons: JSON.stringify(matchReasons.slice(0, Math.floor(Math.random() * 3) + 2)),
      concerns: JSON.stringify(concerns.slice(0, Math.floor(Math.random() * 2) + 1)),
      introPath: JSON.stringify([]),
      status: ["suggested", "contacted", "meeting_scheduled"][Math.floor(Math.random() * 3)] as any,
    });
  }
  return matches;
}

async function seed() {
  console.log("🌱 Seeding database with company-investor data...");
  
  try {
    // Generate and insert companies
    console.log("Creating companies...");
    const companyData = generateCompanies(50);
    const insertedCompanies = await db.insert(companies).values(companyData).$returningId();
    const companyIds = insertedCompanies.map(c => c.id);
    console.log(`✓ Created ${companyIds.length} companies`);
    
    // Generate and insert investors
    console.log("Creating investors...");
    const investorData = generateInvestors(80);
    const insertedInvestors = await db.insert(investors).values(investorData).$returningId();
    const investorIds = insertedInvestors.map(i => i.id);
    console.log(`✓ Created ${investorIds.length} investors`);
    
    // Generate and insert matches
    console.log("Creating matches...");
    const matchData = generateMatches(companyIds, investorIds);
    await db.insert(matches).values(matchData);
    console.log(`✓ Created ${matchData.length} matches`);
    
    console.log("\n🎉 Database seeded successfully!");
    console.log(`\n📊 Summary:`);
    console.log(`   Companies: ${companyIds.length}`);
    console.log(`   Investors: ${investorIds.length}`);
    console.log(`   Matches: ${matchData.length}`);
    
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  } finally {
    // Close the connection pool
    await pool.end();
  }
  
  process.exit(0);
}

seed().catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});

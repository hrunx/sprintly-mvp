import { drizzle } from "drizzle-orm/mysql2";
import { entities, connections, matches, InsertEntity, InsertConnection, InsertMatch } from "../drizzle/schema";

const db = drizzle(process.env.DATABASE_URL!);

// Mock data pools
const sectors = ["Fintech", "Healthcare", "AI/ML", "SaaS", "E-commerce", "Climate Tech", "EdTech", "Logistics", "Cybersecurity", "Biotech"];
const subSectors = {
  "Fintech": ["Payments", "Lending", "Wealth Management", "InsurTech", "Banking"],
  "Healthcare": ["Telemedicine", "Medical Devices", "Health Analytics", "Digital Therapeutics"],
  "AI/ML": ["Computer Vision", "NLP", "Predictive Analytics", "Automation"],
  "SaaS": ["CRM", "Project Management", "Analytics", "Communication"],
  "E-commerce": ["Marketplace", "D2C", "B2B Commerce", "Fulfillment"],
  "Climate Tech": ["Renewable Energy", "Carbon Capture", "Sustainable Agriculture", "Circular Economy"],
  "EdTech": ["Online Learning", "Corporate Training", "Assessment Tools"],
  "Logistics": ["Last Mile", "Supply Chain", "Warehouse Automation"],
  "Cybersecurity": ["Identity", "Network Security", "Cloud Security"],
  "Biotech": ["Drug Discovery", "Genomics", "Diagnostics"]
};

const stages = ["Pre-seed", "Seed", "Series A", "Series B", "Series C", "Growth"];
const geographies = ["MENA", "GCC", "North America", "Europe", "Asia Pacific", "Global"];
const gccCountries = ["UAE", "Saudi Arabia", "Qatar", "Kuwait", "Bahrain", "Oman"];

const founderNames = [
  "Sarah Al-Mansoori", "Ahmed Hassan", "Layla Ibrahim", "Omar Khalil", "Fatima Al-Sayed",
  "Khaled Rahman", "Noor Abdullah", "Youssef Malik", "Amina Farooq", "Hassan Al-Thani",
  "Maryam Qasim", "Ali Rashid", "Zainab Hussain", "Mohammed Al-Fahad", "Rania Saleh",
  "Tariq Aziz", "Huda Nasser", "Faisal Al-Kuwari", "Leena Hamdan", "Samir Boutros"
];

const investorNames = [
  "David Chen", "Emma Rodriguez", "James Park", "Sophia Williams", "Michael Anderson",
  "Priya Sharma", "Robert Taylor", "Lisa Martinez", "Daniel Kim", "Rachel Cohen",
  "Thomas Brown", "Jennifer Lee", "Christopher Davis", "Amanda Wilson", "Kevin Zhang",
  "Maria Garcia", "Jason Miller", "Emily Thompson", "Andrew Johnson", "Michelle Wong"
];

const firmNames = [
  "Sequoia Capital", "Andreessen Horowitz", "Accel Partners", "Kleiner Perkins", "Benchmark",
  "Lightspeed Venture", "Index Ventures", "Greylock Partners", "NEA", "Insight Partners",
  "Tiger Global", "Coatue Management", "General Catalyst", "Bessemer Venture", "Battery Ventures",
  "Mubadala Capital", "BECO Capital", "Wamda Capital", "Shorooq Partners", "Global Ventures"
];

const founderFirms = [
  "PayFlow", "HealthHub", "DataSense", "CloudScale", "MarketPlace Pro",
  "EduLearn", "LogiTrack", "SecureNet", "BioInnovate", "CleanEnergy",
  "FinanceAI", "MediCare+", "SmartRetail", "TechSolutions", "GreenFuture",
  "LearnTech", "SupplyChain Pro", "CyberShield", "GenomicsLab", "SolarPower"
];

const titles = {
  founder: ["Founder & CEO", "Co-Founder", "Founder & CTO", "Founder & CPO"],
  investor: ["Partner", "Managing Partner", "General Partner", "Principal", "Investment Director", "Venture Partner"]
};

const thesisTemplates = [
  "Focused on early-stage {sector} companies in {geo} with strong unit economics",
  "Investing in {sector} startups that leverage AI/ML to transform traditional industries",
  "Backing {stage} companies building infrastructure for the next generation of {sector}",
  "Seeking {sector} founders with deep domain expertise and global ambition",
  "Supporting {sector} companies addressing critical challenges in {geo} markets"
];

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateThesis(sector: string, stage: string, geo: string): string {
  const template = randomElement(thesisTemplates);
  return template.replace("{sector}", sector).replace("{stage}", stage).replace("{geo}", geo);
}

function generateBio(type: "founder" | "investor", name: string, firm: string, sector: string): string {
  if (type === "founder") {
    return `${name} is the founder of ${firm}, a ${sector} startup revolutionizing the industry. Previously worked at leading tech companies and holds an MBA from a top business school.`;
  } else {
    return `${name} is a seasoned investor at ${firm} with over 10 years of experience in ${sector}. Has led investments in multiple unicorns and actively mentors early-stage founders.`;
  }
}

function generateTags(type: "founder" | "investor", sector: string, stage: string): string[] {
  const baseTags = [sector, stage];
  const additionalTags = type === "founder" 
    ? ["B2B", "Product-Led Growth", "AI-Powered", "Mobile-First", "Enterprise"]
    : ["Hands-On", "Strategic Investor", "Board Member", "Follow-On Investor", "Lead Investor"];
  
  return [...baseTags, ...Array.from({length: randomInt(2, 4)}, () => randomElement(additionalTags))];
}

async function seedData() {
  console.log("🌱 Starting mock data generation...");

  // Clear existing data
  console.log("🗑️  Clearing existing data...");
  await db.delete(matches);
  await db.delete(connections);
  await db.delete(entities);

  // Generate Founders (50)
  console.log("👤 Generating founders...");
  const founderData: InsertEntity[] = [];
  for (let i = 0; i < 50; i++) {
    const sector = randomElement(sectors);
    const subSector = randomElement(subSectors[sector as keyof typeof subSectors] || [sector]);
    const stage = randomElement(stages);
    const geo = randomElement([...gccCountries, ...geographies]);
    const name = founderNames[i % founderNames.length] + (i >= founderNames.length ? ` ${Math.floor(i / founderNames.length) + 1}` : "");
    const firm = founderFirms[i % founderFirms.length] + (i >= founderFirms.length ? ` ${Math.floor(i / founderFirms.length) + 1}` : "");
    
    founderData.push({
      type: "founder",
      name,
      email: `${name.toLowerCase().replace(/\s+/g, ".")}@${firm.toLowerCase().replace(/\s+/g, "")}.com`,
      firm,
      title: randomElement(titles.founder),
      bio: generateBio("founder", name, firm, sector),
      sector,
      subSector,
      stage,
      geography: geo,
      thesis: `Building the future of ${sector} in ${geo}`,
      linkedinUrl: `https://linkedin.com/in/${name.toLowerCase().replace(/\s+/g, "-")}`,
      websiteUrl: `https://${firm.toLowerCase().replace(/\s+/g, "")}.com`,
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
      tags: JSON.stringify(generateTags("founder", sector, stage)),
      confidence: randomInt(75, 95),
      lastInteraction: new Date(Date.now() - randomInt(1, 90) * 24 * 60 * 60 * 1000)
    });
  }

  const insertedFounders = await db.insert(entities).values(founderData).$returningId();
  console.log(`✅ Generated ${insertedFounders.length} founders`);

  // Generate Investors (80)
  console.log("💰 Generating investors...");
  const investorData: InsertEntity[] = [];
  for (let i = 0; i < 80; i++) {
    const sector = randomElement(sectors);
    const subSector = randomElement(subSectors[sector as keyof typeof subSectors] || [sector]);
    const stage = randomElement(stages);
    const geo = randomElement(geographies);
    const name = investorNames[i % investorNames.length] + (i >= investorNames.length ? ` ${Math.floor(i / investorNames.length) + 1}` : "");
    const firm = firmNames[i % firmNames.length];
    
    investorData.push({
      type: "investor",
      name,
      email: `${name.toLowerCase().replace(/\s+/g, ".")}@${firm.toLowerCase().replace(/\s+/g, "")}.com`,
      firm,
      title: randomElement(titles.investor),
      bio: generateBio("investor", name, firm, sector),
      sector,
      subSector,
      stage,
      geography: geo,
      checkSizeMin: stage === "Pre-seed" ? 50000 : stage === "Seed" ? 250000 : stage === "Series A" ? 2000000 : 5000000,
      checkSizeMax: stage === "Pre-seed" ? 250000 : stage === "Seed" ? 1000000 : stage === "Series A" ? 10000000 : 50000000,
      thesis: generateThesis(sector, stage, geo),
      linkedinUrl: `https://linkedin.com/in/${name.toLowerCase().replace(/\s+/g, "-")}`,
      websiteUrl: `https://${firm.toLowerCase().replace(/\s+/g, "")}.com`,
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
      tags: JSON.stringify(generateTags("investor", sector, stage)),
      confidence: randomInt(80, 98),
      lastInteraction: new Date(Date.now() - randomInt(1, 180) * 24 * 60 * 60 * 1000)
    });
  }

  const insertedInvestors = await db.insert(entities).values(investorData).$returningId();
  console.log(`✅ Generated ${insertedInvestors.length} investors`);

  // Generate Connections (200)
  console.log("🔗 Generating connections...");
  const connectionData: InsertConnection[] = [];
  const allEntityIds = [...insertedFounders.map(f => f.id), ...insertedInvestors.map(i => i.id)];
  
  for (let i = 0; i < 200; i++) {
    const sourceId = randomElement(allEntityIds);
    let targetId = randomElement(allEntityIds);
    while (targetId === sourceId) {
      targetId = randomElement(allEntityIds);
    }
    
    connectionData.push({
      sourceId,
      targetId,
      relationshipType: randomElement(["mutual", "introduced_by", "worked_with", "mentored", "invested_in"]),
      strength: randomInt(30, 95),
      notes: "Connected through industry events and mutual contacts"
    });
  }

  await db.insert(connections).values(connectionData);
  console.log(`✅ Generated ${connectionData.length} connections`);

  // Generate Matches (150)
  console.log("🎯 Generating matches...");
  const matchData: InsertMatch[] = [];
  
  for (let i = 0; i < 150; i++) {
    const founderId = randomElement(insertedFounders).id;
    const investorId = randomElement(insertedInvestors).id;
    
    const sectorScore = randomInt(60, 100);
    const stageScore = randomInt(50, 95);
    const geoScore = randomInt(40, 90);
    const tractionScore = randomInt(30, 80);
    const checkSizeScore = randomInt(50, 95);
    const graphScore = randomInt(20, 70);
    
    const totalScore = Math.round(
      sectorScore * 0.35 +
      stageScore * 0.20 +
      geoScore * 0.15 +
      tractionScore * 0.10 +
      checkSizeScore * 0.10 +
      graphScore * 0.10
    );
    
    const pathLength = randomInt(1, 3);
    const introPath = [founderId, ...Array.from({length: pathLength}, () => randomElement(allEntityIds)), investorId];
    
    matchData.push({
      founderId,
      investorId,
      score: totalScore,
      sectorScore,
      stageScore,
      geoScore,
      tractionScore,
      checkSizeScore,
      graphScore,
      explanation: `Strong match based on sector alignment (${sectorScore}%), stage fit (${stageScore}%), and geographic focus (${geoScore}%). The investor has a proven track record in this space and the check size aligns with fundraising needs.`,
      introPath: JSON.stringify(introPath),
      status: randomElement(["suggested", "contacted", "meeting_scheduled", "passed", "invested"]),
      notes: i % 5 === 0 ? "Follow up scheduled for next week" : undefined
    });
  }

  await db.insert(matches).values(matchData);
  console.log(`✅ Generated ${matchData.length} matches`);

  console.log("🎉 Mock data generation complete!");
  console.log(`
📊 Summary:
- Founders: ${insertedFounders.length}
- Investors: ${insertedInvestors.length}
- Connections: ${connectionData.length}
- Matches: ${matchData.length}
  `);
}

seedData()
  .then(() => {
    console.log("✅ Seeding completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  });

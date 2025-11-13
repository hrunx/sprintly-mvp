# 🚀 Sprintly AI - Company-Investor Matchmaking Platform

> **AI-Powered Matchmaking Platform** connecting companies seeking funding with the perfect investors through intelligent algorithms, network intelligence, and no-code configuration.

![Dashboard](docs/images/01-dashboard.png)

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://sprintly-mvp.manus.space)
[![GitHub](https://img.shields.io/github/stars/hrunx/sprintly-mvp?style=social)](https://github.com/hrunx/sprintly-mvp)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Screenshots](#-screenshots)
- [Technology Stack](#-technology-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
- [Matching Algorithm](#-matching-algorithm)
- [API Documentation](#-api-documentation)
- [Database Schema](#-database-schema)
- [Deployment](#-deployment)
- [Contributing](#-contributing)

---

## 🎯 Overview

**Sprintly AI** solves the critical challenge of connecting startups with the right investors. Traditional matchmaking is manual, time-consuming, and often misses optimal connections. Our platform uses AI to analyze companies and investors across multiple dimensions, providing intelligent recommendations with detailed explanations.

### The Problem

- **Manual Matching**: Founders spend months researching investors
- **Poor Fit**: 70% of intro requests go to wrong investors
- **Hidden Connections**: Warm intro paths remain undiscovered
- **No Transparency**: Founders don't understand why investors pass

### Our Solution

- ✅ **AI-Powered Matching**: Multi-factor scoring across 6 key dimensions
- ✅ **Network Intelligence**: Discover warm intro paths automatically
- ✅ **No-Code Configuration**: Adjust matching weights without technical knowledge
- ✅ **Data Import**: Bulk import from LinkedIn, CRM systems
- ✅ **Real-Time Preview**: See how configuration changes affect matches
- ✅ **Pitch Deck Analysis**: AI extracts key metrics from PDFs automatically
- ✅ **Intro Requests**: One-click introduction requests with tracking

---

## ✨ Key Features

### 🎯 **Smart Matching Engine**

- **Multi-Factor Scoring**: Analyzes sector alignment, stage fit, geography, traction, check size, and thesis alignment
- **Configurable Weights**: Adjust importance of each factor via intuitive sliders
- **Real-Time Preview**: See match score changes as you adjust weights
- **Detailed Explanations**: Understand *why* each match was recommended

![Live Match Preview](docs/images/settings-match-preview.png)

### 🔗 **Network Intelligence & Intro Requests**

- **Intro Path Discovery**: Find warm introduction routes through mutual connections
- **One-Click Requests**: Request introductions directly from match cards
- **Notification System**: Alerts sent to mutual connections automatically
- **Status Tracking**: Monitor intro request progress and success rates

![Intro Requests](docs/images/matches-intro-request.png)

### 📊 **Data Import & CSV Processing**

- **LinkedIn CSV Import**: Bulk upload companies and investors from LinkedIn exports
- **Animated Processing**: Beautiful step-by-step visualization of data processing:
  - Step 1: 📄 Reading CSV file...
  - Step 2: 🔍 Validating data...
  - Step 3: 🏗️ Structuring records...
  - Step 4: 🤖 AI analyzing profiles...
  - Step 5: 🎯 Generating matches...
  - Step 6: ✅ Import complete!
- **Auto-Validation**: Intelligent field mapping and error detection
- **Sample Templates**: Download pre-formatted CSV templates

### 🔌 **Connections Hub**

External data source integrations with beautiful status cards:

- ✅ **LinkedIn Integration**: Active CSV import for companies and investors
- 🔜 **Gmail API** (Coming Soon): Email intelligence and intro path discovery
- 🔜 **Google Drive** (Coming Soon): Automatic pitch deck analysis
- 🔜 **Future Integrations**: Salesforce, HubSpot, AngelList, Crunchbase, PitchBook

![Connections Hub](docs/images/connections.png)

### 📄 **AI Pitch Deck Analysis**

- **PDF Upload**: Drag-and-drop pitch deck upload (max 10MB)
- **AI Extraction**: Automatically extract key metrics from pitch decks
- **Auto-Population**: Revenue, team size, market data populate automatically
- **Smart Analysis**: Understand business model, traction, and competitive landscape

![Pitch Deck Upload](docs/images/pitch-deck-upload.png)

### 🎨 **No-Code Configuration**

- **Visual Weight Adjustment**: Sliders for all matching signals (must total 100%)
- **Filter Controls**: Set minimum thresholds for revenue, stage, geography
- **Preset Configurations**: Conservative, Balanced, Aggressive presets
- **Export/Import**: Save and share configurations as JSON
- **Live Preview**: See real-time impact of weight changes on match scores

### 📈 **Analytics Dashboard**

- **Match Quality Metrics**: Track average match scores and confidence
- **Network Growth**: Monitor companies, investors, and connections
- **Sector Distribution**: Visualize industry breakdown
- **Stage Analysis**: Track funding stage distribution

![Dashboard](docs/images/dashboard.png)

---

## 📸 Screenshots

### Browse Companies
![Browse Companies](docs/images/browse-companies.png)
*Search and filter companies seeking funding with advanced criteria*

### Top Matches with Intro Requests
![Top Matches](docs/images/matches-intro-request.png)
*AI-recommended matches with detailed score breakdowns and one-click intro requests*

### Network Visualization
![Network](docs/images/network.png)
*Visualize sector and stage distribution, track platform metrics*

### Settings - Matching Weights with Live Preview
![Settings Weights](docs/images/settings-match-preview.png)
*Adjust matching signal weights with real-time preview of score changes*

### Settings - Filters
![Settings Filters](docs/images/settings-filters.png)
*Set minimum requirements for companies to be included in matching*

### Connections Hub
![Connections Hub](docs/images/connections.png)
*Manage external data source integrations (LinkedIn, Gmail, Google Drive)*

### Company Profile with Pitch Deck Upload
![Company Profile](docs/images/pitch-deck-upload.png)
*Detailed company information with AI pitch deck analysis and top investor matches*

### Investor Profile
![Investor Profile](docs/images/investor-profile.png)
*Investor profiles with investment thesis, focus areas, and network connections*

---

## 🛠 Technology Stack

### Frontend
- **React 19** - Modern UI library with concurrent features
- **TypeScript** - Type-safe development
- **Tailwind CSS 4** - Utility-first styling with custom design system
- **shadcn/ui** - High-quality, accessible component library
- **tRPC** - End-to-end typesafe APIs
- **Wouter** - Lightweight routing
- **Lucide Icons** - Beautiful, consistent iconography

### Backend
- **Node.js 22** - JavaScript runtime
- **Express 4** - Web application framework
- **tRPC 11** - Type-safe API layer with automatic client generation
- **Drizzle ORM** - Type-safe database toolkit
- **MySQL/TiDB** - Relational database with horizontal scalability

### AI & ML
- **Built-in LLM Service** - For pitch deck analysis and semantic matching
- **Custom Scoring Algorithm** - Multi-factor weighted matching engine

### Infrastructure
- **Vite** - Lightning-fast build tool
- **TSX** - TypeScript execution environment
- **PNPM** - Fast, disk-efficient package manager

---

## 🏗 Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │Dashboard │  │ Matches  │  │ Settings │  │  Import  │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │
└───────┼─────────────┼─────────────┼─────────────┼──────────┘
        │             │             │             │
        └─────────────┴─────────────┴─────────────┘
                      │
              ┌───────▼───────┐
              │  tRPC Client  │
              └───────┬───────┘
                      │
┌─────────────────────▼─────────────────────────────────────┐
│                   Backend (Express + tRPC)                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │Companies │  │ Investors│  │ Matching │  │  Import  │ │
│  │  Router  │  │  Router  │  │  Router  │  │  Router  │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘ │
└───────┼─────────────┼─────────────┼─────────────┼────────┘
        │             │             │             │
        └─────────────┴─────────────┴─────────────┘
                      │
              ┌───────▼───────┐
              │  Database     │
              │  (MySQL/TiDB) │
              └───────────────┘
```

### Matching Algorithm Flow

```
Company + Investor
       ↓
┌──────────────────┐
│  Factor Analysis │
├──────────────────┤
│ • Sector (25%)   │
│ • Stage (20%)    │
│ • Traction (20%) │
│ • Check Size(15%)│
│ • Geography(10%) │
│ • Thesis (10%)   │
└────────┬─────────┘
         ↓
   Weighted Score
    (0-100%)
         ↓
   Match Quality
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 22+ ([Download](https://nodejs.org/))
- **PNPM** 9+ (`npm install -g pnpm`)
- **MySQL** 8+ or **TiDB** ([Setup Guide](https://docs.pingcap.com/tidb/stable))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/hrunx/sprintly-mvp.git
   cd sprintly-mvp
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your database credentials:
   ```env
   DATABASE_URL=mysql://user:password@localhost:3306/sprintly
   JWT_SECRET=your-secret-key-here
   VITE_APP_ID=sprintly-local
   VITE_APP_TITLE=Sprintly AI
   VITE_APP_LOGO=/logo.svg
   ```

4. **Initialize database**
   ```bash
   pnpm db:push
   ```

5. **Seed mock data** (optional)
   ```bash
   npx tsx scripts/seed-company-data.ts
   ```
   This generates:
   - 50 realistic companies seeking funding
   - 80 investors with investment criteria
   - 150 AI-generated matches

6. **Start development server**
   ```bash
   pnpm dev
   ```

7. **Open in browser**
   ```
   http://localhost:3000
   ```

### Environment Variables (Self-hosted, no Manus)

Create a `.env` file in the project root:

```env
# Server
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=mysql://user:password@localhost:3306/sprintly

# Auth/session (not used for gating in demo, but required by server)
JWT_SECRET=change-me-please
VITE_APP_ID=sprintly-local

# Client branding
VITE_APP_TITLE=Sprintly AI
VITE_APP_LOGO=/logo.svg
```

Notes:
- Demo mode disables authentication. All features (CSV import, matching, settings) work without login.
- AI and storage integrations are optional and disabled by default.

---

## 🧮 Matching Algorithm

The AI matching engine scores company-investor pairs across multiple dimensions:

### Scoring Factors (Default Weights)

| Factor | Weight | Description |
|--------|--------|-------------|
| **Sector Alignment** | 25% | How well the company's sector matches investor focus |
| **Stage Fit** | 20% | Funding stage compatibility (Pre-seed, Seed, Series A, etc.) |
| **Traction & Metrics** | 20% | Revenue, growth rate, customer base strength |
| **Check Size Match** | 15% | Company funding needs vs. investor check size range |
| **Geographic Proximity** | 10% | Location alignment between company and investor |
| **Thesis Alignment** | 10% | Semantic similarity between pitch and investment thesis |

### Match Score Calculation

```typescript
matchScore = (
  sectorScore * sectorWeight +
  stageScore * stageWeight +
  tractionScore * tractionWeight +
  checkSizeScore * checkSizeWeight +
  geoScore * geoWeight +
  thesisScore * thesisWeight
) / 100
```

**Score Interpretation:**
- **90-100**: Excellent Match (Strong recommendation)
- **75-89**: Good Match (Recommended)
- **60-74**: Fair Match (Consider with caution)
- **<60**: Poor Match (Not recommended)

### Adjustable Configuration

All weights are adjustable through the Settings UI with **real-time preview**:
- **Weights**: Sliders to adjust importance of each factor (must total 100%)
- **Filters**: Minimum thresholds (revenue, team size, pitch deck required, etc.)
- **Presets**: Quick configurations (Conservative, Balanced, Aggressive)
- **Live Preview**: See how weight changes affect actual match scores

---

## 📡 API Documentation

### tRPC Routers

#### Companies

```typescript
// Get all companies
const companies = await trpc.companies.list.useQuery();

// Get company by ID
const company = await trpc.companies.getById.useQuery({ id: 1 });

// Search companies
const results = await trpc.companies.search.useQuery({
  query: 'AI',
  sector: 'Fintech',
  stage: 'Seed'
});
```

#### Investors

```typescript
// Get all investors
const investors = await trpc.investors.list.useQuery();

// Get investor by ID
const investor = await trpc.investors.getById.useQuery({ id: 1 });
```

#### Matches

```typescript
// Get matches for a company
const matches = await trpc.matches.getForCompany.useQuery({
  companyId: 1,
  limit: 10
});
```

#### Intro Requests

```typescript
// Request introduction
const intro = await trpc.intros.request.useMutation({
  companyId: 1,
  investorId: 20,
  message: 'Would love an intro to discuss our Series A'
});

// Get intro requests
const requests = await trpc.intros.list.useQuery({ companyId: 1 });
```

#### Settings

```typescript
// Get current configuration
const config = await trpc.settings.get.useQuery();

// Update configuration
await trpc.settings.update.useMutation({
  weights: { sector: 30, stage: 25, traction: 20, checkSize: 15, geo: 5, thesis: 5 },
  filters: { minRevenue: 1000000, requirePitchDeck: true }
});
```

#### Data Import

```typescript
// Import companies from CSV
const result = await trpc.dataImport.importCompanies.useMutation({
  csvContent: '...',
  validateOnly: false
});

// Import investors from CSV
const result = await trpc.dataImport.importInvestors.useMutation({
  csvContent: '...',
  validateOnly: false
});
```

---

## 🗄 Database Schema

### Core Tables

**companies**
- `id`, `name`, `description`, `website`
- `sector`, `stage`, `location`, `founded`, `teamSize`
- `businessModel`, `fundingRound`, `seeking`, `alreadyRaised`, `valuation`
- `annualRevenue`, `revenueGrowth`, `customers`, `mrr`
- `founderName`, `founderEmail`, `founderLinkedIn`
- `pitchDeckUrl`, `createdAt`, `updatedAt`

**investors**
- `id`, `name`, `type`, `firm`, `bio`
- `sector`, `stage`, `geography`
- `checkSizeMin`, `checkSizeMax`
- `email`, `linkedIn`, `website`
- `createdAt`, `updatedAt`

**matches**
- `id`, `companyId`, `investorId`
- `overallScore`, `sectorScore`, `stageScore`, `geoScore`
- `tractionScore`, `checkSizeScore`, `thesisScore`
- `matchReasons`, `createdAt`

**introRequests**
- `id`, `companyId`, `investorId`, `requesterId`
- `status`, `message`, `createdAt`, `updatedAt`

**matchingConfig**
- `id`, `userId`, `name`
- `sectorWeight`, `stageWeight`, `geoWeight`
- `tractionWeight`, `checkSizeWeight`, `thesisWeight`
- `filters`, `thresholds`
- `createdAt`, `updatedAt`

---

## 🚢 Deployment

### Production Build

```bash
# Build frontend and backend
pnpm build

# Start production server
pnpm start
```

### Environment Variables

**Required for production:**
```env
NODE_ENV=production
DATABASE_URL=mysql://user:password@host:port/database
JWT_SECRET=your-production-secret
VITE_APP_TITLE=Sprintly AI
VITE_APP_LOGO=/logo.svg
```

### Docker Deployment

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build
EXPOSE 3000
CMD ["pnpm", "start"]
```

```bash
docker build -t sprintly-mvp .
docker run -p 3000:3000 --env-file .env sprintly-mvp
```

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

### Development Guidelines

- Follow TypeScript best practices
- Use Tailwind CSS for styling
- Write meaningful commit messages
- Add tests for new features
- Update documentation

---

## 📝 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **shadcn/ui** for beautiful, accessible components
- **tRPC** for type-safe APIs
- **Drizzle ORM** for elegant database interactions
- **Manus Platform** for infrastructure and AI services

---

## 📧 Contact

**Hrun Shafquat**
- Email: h.shafquat@gasable.com
- GitHub: [@hrunx](https://github.com/hrunx)
- Project: [https://github.com/hrunx/sprintly-mvp](https://github.com/hrunx/sprintly-mvp)

---

<div align="center">
  <strong>Built with ❤️ for founders and investors</strong>
</div>

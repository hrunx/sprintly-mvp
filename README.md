# 🚀 Sprintly AI - Company-Investor Matchmaking Platform

> **AI-Powered Matchmaking Platform** connecting companies seeking funding with the perfect investors through intelligent algorithms and network intelligence.

![Dashboard](docs/images/01-dashboard.png)

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Screenshots](#screenshots)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
- [Matching Algorithm](#matching-algorithm)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Deployment](#deployment)
- [Contributing](#contributing)

## 🎯 Overview

Sprintly AI is a comprehensive matchmaking platform that uses artificial intelligence to connect companies seeking investment with the most suitable investors. The platform analyzes multiple factors including sector alignment, funding stage, geographic proximity, traction metrics, and investment thesis to generate high-quality matches.

### Problem Statement

Traditional investor discovery is time-consuming, inefficient, and often relies on personal networks. Companies struggle to find investors who are genuinely interested in their sector, stage, and geography, while investors miss opportunities that perfectly match their investment criteria.

### Solution

Sprintly AI automates the matching process using a sophisticated AI engine that considers:
- **Sector Alignment**: Matches companies with investors focused on their industry
- **Stage Fit**: Ensures funding stage aligns with investor preferences
- **Geographic Proximity**: Considers location preferences and local market knowledge
- **Traction Metrics**: Evaluates revenue, growth rate, and customer base
- **Check Size Match**: Aligns funding needs with investor check sizes
- **Thesis Alignment**: Analyzes pitch decks and investment theses for compatibility

## ✨ Key Features

### 1. **AI-Powered Matching Engine**
- Multi-factor scoring algorithm with configurable weights
- Real-time match score calculation (0-100%)
- Detailed match explanations showing why companies and investors are compatible
- Confidence scoring based on data quality

### 2. **No-Code Configuration UI**

Adjust all matching parameters through an intuitive visual interface:

- **Adjustable Matching Weights**: Control how much each factor contributes to the overall score
  - Sector Alignment (default: 25%)
  - Stage Fit (default: 20%)
  - Geographic Proximity (default: 10%)
  - Traction Metrics (default: 20%)
  - Check Size Match (default: 15%)
  - Thesis Alignment (default: 10%)

- **Smart Filters**: Set minimum requirements for matching
  - Minimum annual revenue
  - Minimum team size
  - Require pitch deck
  - Require traction

- **Preset Configurations**: Quick-start templates
  - **Conservative**: High-quality matches only, strict criteria (70%+ threshold)
  - **Balanced**: Good balance between quality and quantity (50%+ threshold)
  - **Aggressive**: Maximum matches, lower thresholds (40%+ threshold)

- **Export/Import**: Save and share configurations as JSON files

### 3. **Comprehensive Company Profiles**
- Funding details (target, raised, valuation)
- Traction metrics (revenue, growth, MRR, customers)
- Business model and sector tags
- Founder information with LinkedIn integration
- Pitch deck storage and viewing
- Top AI-recommended investor matches

### 4. **Investor Profiles**
- Investment thesis and focus areas
- Check size ranges and stage preferences
- Geographic focus and sector expertise
- Contact information and social links
- Network connections visualization

### 5. **Smart Dashboard**
- Real-time statistics (companies, investors, matches)
- Average match quality score
- Quick actions for common tasks
- Match quality visualization

### 6. **Advanced Search & Filtering**
- Browse companies seeking funding
- Filter by sector, stage, geography, traction
- Search by company name or description
- Sort by relevance, funding amount, or growth

### 7. **Network Intelligence**
- Visualize sector distribution
- Analyze stage distribution
- Track platform growth metrics
- Identify trending sectors and stages

### 8. **Match Management**
- View all AI-recommended matches
- See detailed score breakdowns for each match
- Filter matches by minimum score
- Track match status and outcomes

## 📸 Screenshots

### Dashboard
![Dashboard](docs/images/01-dashboard.png)
*Main dashboard showing platform statistics, match quality metrics, and quick actions*

### Browse Companies
![Browse Companies](docs/images/02-search.png)
*Search and filter companies seeking funding with advanced criteria*

### Top Matches
![Top Matches](docs/images/03-matches.png)
*AI-recommended matches with detailed score breakdowns and explanations*

### Network Analytics
![Network Analytics](docs/images/04-network.png)
*Visualize sector and stage distribution, track platform metrics*

### Settings - Matching Weights
![Settings Weights](docs/images/05-settings-weights.png)
*Adjust matching signal weights with intuitive sliders (must total 100%)*

### Settings - Filters
![Settings Filters](docs/images/06-settings-filters.png)
*Set minimum requirements for companies to be included in matching*

### Company Profile
![Company Profile](docs/images/07-company-profile.png)
*Detailed company information with funding details, traction metrics, and top investor matches*

### Investor Profile
![Investor Profile](docs/images/08-investor-profile.png)
*Investor profiles with investment thesis, focus areas, and network connections*

## 🏗️ Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│  React 19 + TypeScript + Tailwind CSS 4 + shadcn/ui        │
│  - Dashboard, Search, Matches, Network, Settings            │
│  - Company & Investor Profile Pages                         │
│  - Real-time tRPC Client                                    │
└─────────────────┬───────────────────────────────────────────┘
                  │ tRPC (Type-safe API)
┌─────────────────┴───────────────────────────────────────────┐
│                         Backend                              │
│  Express 4 + tRPC 11 + TypeScript                          │
│  - Company Management API                                    │
│  - Investor Management API                                   │
│  - Matching Engine API                                       │
│  - Analytics API                                             │
│  - Settings API                                              │
└─────────────────┬───────────────────────────────────────────┘
                  │ Drizzle ORM
┌─────────────────┴───────────────────────────────────────────┐
│                        Database                              │
│  MySQL / TiDB                                               │
│  - companies, investors, matches                            │
│  - matchingConfig, users                                     │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

```
User Action → tRPC Client → Backend Router → Database Helper → Database
                ↓
          Type-safe Response → UI Update
```

## 🛠️ Technology Stack

### Frontend
- **React 19**: Latest React with concurrent features
- **TypeScript**: Type-safe development
- **Tailwind CSS 4**: Utility-first styling
- **shadcn/ui**: High-quality UI components
- **tRPC React**: Type-safe API client
- **Wouter**: Lightweight routing
- **Lucide React**: Beautiful icons
- **Sonner**: Toast notifications

### Backend
- **Node.js 22**: Latest LTS runtime
- **Express 4**: Web server framework
- **tRPC 11**: End-to-end type-safe APIs
- **Drizzle ORM**: Type-safe database toolkit
- **Zod**: Schema validation
- **SuperJSON**: Enhanced JSON serialization

### Database
- **MySQL / TiDB**: Relational database
- **Drizzle Kit**: Schema migrations

### Development Tools
- **Vite**: Fast build tool
- **TSX**: TypeScript execution
- **pnpm**: Fast package manager

## 🚀 Getting Started

### Prerequisites

- Node.js 22+ installed
- MySQL or TiDB database
- pnpm package manager

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

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL=mysql://user:password@localhost:3306/sprintly
   JWT_SECRET=your-secret-key-here
   VITE_APP_TITLE=Sprintly AI
   VITE_APP_LOGO=/logo.svg
   ```

4. **Initialize the database**
   ```bash
   pnpm db:push
   ```

5. **Seed with mock data**
   ```bash
   npx tsx scripts/seed-company-data.ts
   ```
   This will generate:
   - 50 realistic companies seeking funding
   - 80 investors with investment criteria
   - 150 AI-generated matches

6. **Start the development server**
   ```bash
   pnpm dev
   ```

7. **Open your browser**
   
   Navigate to `http://localhost:3000`

### Project Structure

```
sprintly-mvp/
├── client/                 # Frontend application
│   ├── public/            # Static assets
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   │   ├── ui/       # shadcn/ui components
│   │   │   └── DashboardLayout.tsx
│   │   ├── pages/         # Page components
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Search.tsx
│   │   │   ├── Matches.tsx
│   │   │   ├── Network.tsx
│   │   │   ├── Settings.tsx
│   │   │   ├── CompanyProfile.tsx
│   │   │   └── InvestorProfile.tsx
│   │   ├── lib/           # Utility functions
│   │   │   └── trpc.ts   # tRPC client
│   │   └── App.tsx        # Main app component
│   └── index.html         # HTML entry point
├── server/                # Backend application
│   ├── _core/            # Core server functionality
│   ├── db.ts             # Database queries
│   └── routers.ts        # tRPC routers
├── drizzle/              # Database schema
│   └── schema.ts         # Table definitions
├── scripts/              # Utility scripts
│   └── seed-company-data.ts  # Mock data generator
├── docs/                 # Documentation
│   └── images/           # Screenshots
└── README.md             # This file
```

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

Scores range from 0-100, with:
- **80-100**: Excellent match
- **70-79**: Strong match  
- **60-69**: Good match
- **Below 60**: Weak match

### Adjustable Configuration

All weights and filters are adjustable through the Settings UI:
- **Weights**: Sliders to adjust importance of each factor (must total 100%)
- **Filters**: Minimum thresholds (revenue, team size, pitch deck required, etc.)
- **Presets**: Quick configurations for different matching strategies

## 📡 API Documentation

The platform uses tRPC for type-safe API calls. All endpoints are automatically typed end-to-end.

### Companies Router

```typescript
// Get all companies with optional filters
trpc.companies.list.useQuery({
  sector?: string,
  stage?: string,
  location?: string,
  minRevenue?: number,
  limit?: number
})

// Get single company by ID
trpc.companies.byId.useQuery({ id: number })

// Search companies
trpc.companies.search.useQuery({ query: string })
```

### Investors Router

```typescript
// Get all investors
trpc.investors.list.useQuery()

// Get single investor by ID
trpc.investors.byId.useQuery({ id: number })
```

### Matches Router

```typescript
// Get all matches with optional filters
trpc.matches.list.useQuery({
  companyId?: number,
  investorId?: number,
  minScore?: number,
  limit?: number
})

// Get matches with full details
trpc.matches.withDetails.useQuery({ id: number })
```

### Analytics Router

```typescript
// Get platform analytics
trpc.analytics.overview.useQuery()
// Returns: { totalCompanies, totalInvestors, totalMatches, avgMatchScore }

// Get sector distribution
trpc.analytics.sectorDistribution.useQuery()

// Get stage distribution
trpc.analytics.stageDistribution.useQuery()
```

### Settings Router

```typescript
// Get current matching configuration
trpc.settings.getMatchingConfig.useQuery()

// Update matching configuration
trpc.settings.saveMatchingConfig.useMutation({
  weights: { sector, stage, traction, checkSize, geo, thesis },
  filters: { minRevenue, minTeamSize, requirePitchDeck, requireTraction },
  thresholds: { minMatchScore, minSectorScore, minStageScore }
})

// Apply preset configuration
trpc.settings.applyPreset.useMutation({
  preset: 'conservative' | 'balanced' | 'aggressive'
})

// Export configuration
trpc.settings.exportConfig.useQuery()

// Import configuration
trpc.settings.importConfig.useMutation({ config: string })
```

## 🗄️ Database Schema

### Companies Table
Stores information about companies seeking investment.

| Column | Type | Description |
|--------|------|-------------|
| `id` | INT | Primary key |
| `name` | VARCHAR(255) | Company name |
| `description` | TEXT | Company description |
| `sector` | VARCHAR(100) | Industry sector |
| `stage` | VARCHAR(50) | Funding stage |
| `geography` | VARCHAR(100) | Location |
| `fundingTarget` | INT | Amount seeking (USD) |
| `fundingRaised` | INT | Amount raised (USD) |
| `valuation` | INT | Company valuation (USD) |
| `revenue` | INT | Annual revenue (USD) |
| `revenueGrowth` | INT | Growth rate (%) |
| `mrr` | INT | Monthly recurring revenue |
| `customers` | INT | Number of customers |
| `teamSize` | INT | Number of employees |
| `founded` | INT | Year founded |
| `pitchDeckUrl` | VARCHAR(500) | Pitch deck URL |
| `founderName` | VARCHAR(255) | Founder name |
| `founderEmail` | VARCHAR(255) | Founder email |

### Investors Table
Stores information about investors and their criteria.

| Column | Type | Description |
|--------|------|-------------|
| `id` | INT | Primary key |
| `name` | VARCHAR(255) | Investor name |
| `title` | VARCHAR(100) | Job title |
| `firm` | VARCHAR(255) | Investment firm |
| `type` | VARCHAR(50) | VC, Angel, PE, etc. |
| `focusSectors` | TEXT | Preferred sectors (JSON) |
| `focusStages` | TEXT | Preferred stages (JSON) |
| `focusGeographies` | TEXT | Geographic focus (JSON) |
| `checkSizeMin` | INT | Minimum investment (USD) |
| `checkSizeMax` | INT | Maximum investment (USD) |
| `thesis` | TEXT | Investment thesis |
| `bio` | TEXT | Investor biography |
| `email` | VARCHAR(255) | Contact email |
| `linkedin` | VARCHAR(500) | LinkedIn URL |
| `website` | VARCHAR(500) | Website URL |

### Matches Table
Stores AI-generated matches between companies and investors.

| Column | Type | Description |
|--------|------|-------------|
| `id` | INT | Primary key |
| `companyId` | INT | Foreign key to companies |
| `investorId` | INT | Foreign key to investors |
| `score` | INT | Overall match score (0-100) |
| `sectorScore` | INT | Sector alignment score |
| `stageScore` | INT | Stage fit score |
| `geographyScore` | INT | Geography score |
| `tractionScore` | INT | Traction score |
| `checkSizeScore` | INT | Check size score |
| `thesisScore` | INT | Thesis alignment score |
| `explanation` | TEXT | Why this match works |
| `matchReasons` | TEXT | Detailed reasons (JSON) |
| `confidence` | INT | Match confidence (0-100) |

### MatchingConfig Table
Stores user-specific matching configurations.

| Column | Type | Description |
|--------|------|-------------|
| `id` | INT | Primary key |
| `userId` | INT | Foreign key to users |
| `weights` | TEXT | Weight configuration (JSON) |
| `filters` | TEXT | Filter configuration (JSON) |
| `thresholds` | TEXT | Threshold configuration (JSON) |

## 🚢 Deployment

### Deploy to Manus Platform

1. **Save a checkpoint**
   - Checkpoints are created through the Management UI
   - Click "Save Checkpoint" in the dashboard

2. **Publish to production**
   - Click the **Publish** button in the Management UI
   - Your app will be deployed with auto-scaling, SSL, and CDN
   - Get a custom domain: `your-app.manus.space`

3. **Custom domain** (optional)
   - Go to Settings → Domains in the Management UI
   - Add your custom domain and configure DNS

### Environment Variables

Update these in Settings → Secrets (Management UI):
- `VITE_APP_TITLE` - Change application branding
- Add any custom API keys for external services

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Built with [Manus Platform](https://manus.im) for rapid full-stack development
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)

## 📧 Contact

For questions or support, please open an issue on GitHub.

**Repository**: https://github.com/hrunx/sprintly-mvp

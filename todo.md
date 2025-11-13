# Sprintly MVP - Project TODO

## MAJOR RESTRUCTURE - Company-to-Investor Matchmaking
- [x] Update database schema to separate companies from founders
- [x] Add pitch deck storage and analysis fields
- [x] Add funding requirements and traction metrics to companies
- [x] Regenerate mock data with realistic companies seeking investment
- [x] Update matching algorithm to analyze company-investor fit
- [x] Rebuild company profile pages with pitch deck info
- [x] Update search to show companies instead of founders
- [ ] Add pitch deck upload and analysis features
- [x] Update all UI references from "founders" to "companies"
- [ ] Add detailed match explanation showing fit criteria

## Completed Features
- [x] Database schema with entities, connections, matches
- [x] Mock data generator
- [x] Backend API with matching engine
- [x] Professional dashboard UI
- [x] Search page with filters
- [x] Matches page with recommendations
- [x] Network visualization
- [x] Investor profile pages

## Bug Fixes
- [x] Fix SelectItem empty value error in Search page filters

## Missing Features
- [x] Create investor profile detail page
- [x] Add investor profile route to handle /investor/:id

## No-Code Configuration UI (NEW REQUIREMENT)
- [x] Create Settings page for matching configuration
- [x] Add weight sliders for matching signals (sector, stage, traction, etc.)
- [x] Add filter controls (min revenue, funding range, geography)
- [x] Add toggle switches for optional matching criteria
- [x] Save configuration to database per user/workspace
- [ ] Update backend matching engine to use dynamic weights
- [x] Add preset configurations (Conservative, Balanced, Aggressive)
- [ ] Add real-time preview of how settings affect matches
- [x] Add export/import configuration feature

## Bug Fixes (Current)
- [x] Fix 404 error for /company/:id route
- [x] Create company profile detail page

## Documentation
- [x] Create comprehensive README.md with architecture and features
- [x] Add screenshots of all key pages
- [x] Document setup and deployment instructions

## Screenshots Update
- [x] Capture screenshot of Dashboard page
- [x] Capture screenshot of Search/Browse Companies page
- [x] Capture screenshot of Matches page
- [x] Capture screenshot of Network page
- [x] Capture screenshot of Settings page (all tabs)
- [x] Capture screenshot of Company Profile page
- [x] Capture screenshot of Investor Profile page
- [x] Update README with all new screenshots

## Data Import Feature (NEW REQUIREMENT)
- [x] Create LinkedIn CSV sample templates for companies and investors
- [x] Define CSV format specifications and column mappings
- [x] Build backend CSV parser with validation
- [x] Create bulk import API endpoints
- [x] Build Data Import UI page with file upload
- [x] Add CSV preview and validation before import
- [x] Implement column mapping interface
- [x] Add progress tracking for bulk imports
- [x] Create downloadable sample CSV templates
- [x] Add error handling and validation messages

## Connections Hub & Processing Animation (NEW REQUIREMENT)
- [x] Create Connections Hub page showing all external integrations
- [x] Add LinkedIn connection card (Active status)
- [x] Add Gmail API card (Coming Soon status)
- [x] Add Google Drive card (Coming Soon status)
- [x] Design beautiful connection status indicators
- [x] Add "Connect" buttons with hover effects
- [x] Create animated processing modal component
- [x] Add step-by-step progress animation (6 steps)
- [x] Integrate processing modal into CSV import workflow
- [x] Add smooth transitions and loading animations
- [x] Show AI analysis and matching generation steps

## Next Steps Implementation
- [x] Add real-time match preview in Settings showing before/after weight adjustments
- [x] Build intro request workflow with notification system
- [x] Implement pitch deck PDF upload feature
- [x] Add AI extraction for pitch deck metrics
- [ ] Update README with all new features and screenshots
- [ ] Push all changes to GitHub repository

## Local Deployment Branch (NEW REQUIREMENT)
- [x] Create local2 branch in GitHub
- [x] Remove all Manus OAuth dependencies
- [x] Replace with simple email/password authentication (JWT-based)
- [x] Remove Manus AI service integrations
- [x] Replace with OpenAI API for AI features
- [x] Add cookie-parser middleware for authentication
- [x] Create Login/Register page with tabs
- [x] Update auth context to use JWT tokens
- [x] Create seed script with demo user and sample data
- [x] Test complete authentication workflow
- [x] Update environment variables for local deployment
- [x] Create LOCAL_DEPLOYMENT.md guide with setup instructions
- [x] Docker Compose configuration already exists
- [ ] Push local2 branch to GitHub (requires re-authentication)

## Bug Fixes (Authentication)
- [ ] Fix authentication redirect loop - users see sign-in screen after successful login
- [ ] Investigate cookie persistence and session handling
- [ ] Ensure trpc.auth.me.useQuery() properly detects authenticated user

## Route Audit and Fixes
- [x] Audit all route definitions in App.tsx
- [x] Fix Dashboard.tsx to use Link component for client-side navigation
- [x] Fix Search.tsx to use Link for company profile navigation
- [x] Fix InvestorProfile back button to use browser history
- [x] Test all navigation flows (dashboard, search, profiles)
- [ ] Push local2 branch to GitHub

## Comprehensive Authentication System Audit
- [x] Audit authRouter.ts for proper cookie handling
- [x] Audit server context.ts for JWT verification
- [x] Audit Login.tsx mutation handlers and query invalidation
- [x] Audit useAuth hook for race conditions
- [x] Audit DashboardLayout auth detection logic
- [x] Check cookie-parser middleware configuration
- [x] Verify JWT token generation and validation
- [x] Test login -> dashboard redirect
- [x] Test logout -> login redirect
- [x] Test authenticated user accessing /login
- [x] Fixed cookie configuration with explicit path
- [x] Fixed query invalidation and refetch timing
- [x] Fixed Dashboard.tsx duplicate import
- [x] All authentication flows working perfectly

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

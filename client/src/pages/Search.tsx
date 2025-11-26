import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search as SearchIcon, Building2, MapPin, TrendingUp, DollarSign, ExternalLink, Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Search() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sector, setSector] = useState<string>("all");
  const [stage, setStage] = useState<string>("all");
  const [geography, setGeography] = useState<string>("all");
  const [useAISemantic, setUseAISemantic] = useState(true);

  const { data: companies, isLoading: companiesLoading } = trpc.companies.list.useQuery({
    search: searchTerm || undefined,
    sector: sector === "all" ? undefined : sector,
    stage: stage === "all" ? undefined : stage,
    geography: geography === "all" ? undefined : geography,
    limit: 200,
  });

  const { data: aiResults, isLoading: aiLoading } = trpc.search.semantic.useQuery(
    { query: searchTerm, limit: 20 },
    { enabled: useAISemantic && Boolean(searchTerm) },
  );

  const baseCompanies = companies || [];
  const aiSearchActive = useAISemantic && Boolean(searchTerm);

  const sectorOptions = [
    { label: "Fintech", value: "Fintech" },
    { label: "Healthcare", value: "Healthcare" },
    { label: "AI / ML", value: "AI/ML" },
    { label: "SaaS", value: "SaaS" },
    { label: "E-commerce", value: "E-commerce" },
    { label: "Climate Tech", value: "ClimateTech" },
    { label: "EdTech", value: "EdTech" },
    { label: "Logistics", value: "Logistics" },
    { label: "Cybersecurity", value: "Cybersecurity" },
    { label: "Biotech", value: "Biotech" },
  ];

  const stageOptions = [
    { label: "Pre-seed", value: "Pre-seed" },
    { label: "Seed", value: "Seed" },
    { label: "Series A", value: "Series A" },
    { label: "Series B", value: "Series B" },
    { label: "Series C", value: "Series C" },
    { label: "Growth", value: "Growth" },
  ];

  const geographyOptions = [
    { label: "North America", value: "North America" },
    { label: "Europe", value: "Europe" },
    { label: "Latin America", value: "Latin America" },
    { label: "Asia Pacific", value: "Asia Pacific" },
    { label: "Middle East", value: "Middle East" },
    { label: "Africa", value: "Africa" },
    { label: "Global", value: "Global" },
  ];

  const getLabel = (list: { label: string; value: string }[], value: string) =>
    list.find((item) => item.value === value)?.label || value;

  const parseTags = (value: any) => {
    if (!value) return [] as string[];
    if (Array.isArray(value)) return value;
    if (typeof value === "string") {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) return parsed;
        if (parsed && typeof parsed === "object") return Object.values(parsed).flat().map(String);
      } catch {
        return value.split(",").map(item => item.trim());
      }
    }
    if (typeof value === "object") return Object.values(value).flat().map(String);
    return [];
  };

  const matchesFilters = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();
    const sectorLower = sector.toLowerCase();
    const stageLower = stage.toLowerCase();
    const geoLower = geography.toLowerCase();

    return (company: any) => {
      const haystack = `${company.name} ${company.description || ""} ${company.sector || ""}`.toLowerCase();
      const matchesSearch = !searchLower || aiSearchActive || haystack.includes(searchLower);
      const matchesSector = sectorLower === "all" || (company.sector || "").toLowerCase() === sectorLower;
      const matchesStage = stageLower === "all" || (company.stage || "").toLowerCase() === stageLower;
      const matchesGeo = geoLower === "all" || (company.geography || "").toLowerCase().includes(geoLower);
      return matchesSearch && matchesSector && matchesStage && matchesGeo;
    };
  }, [aiSearchActive, geography, searchTerm, sector, stage]);

  const filteredCompanies = useMemo(
    () => baseCompanies.filter(matchesFilters),
    [baseCompanies, matchesFilters],
  );

  const aiCompanies = useMemo(() => {
    if (!aiSearchActive) return [];
    const byId = new Map(baseCompanies.map(company => [company.id, company]));
    return (aiResults?.results || [])
      .map((result: any) => {
        const dbCompany = byId.get(result.company.id);
        return {
          ...(dbCompany || result.company),
          __aiScore: result.score,
          __aiReason: result.reason,
        };
      })
      .filter(matchesFilters);
  }, [aiResults?.results, aiSearchActive, baseCompanies, matchesFilters]);

  const activeFilters = useMemo(() => {
    const filters: { label: string; value: string }[] = [];
    if (sector !== "all") filters.push({ label: "Sector", value: getLabel(sectorOptions, sector) });
    if (stage !== "all") filters.push({ label: "Stage", value: getLabel(stageOptions, stage) });
    if (geography !== "all") filters.push({ label: "Geography", value: getLabel(geographyOptions, geography) });
    if (searchTerm) filters.push({ label: "Search", value: searchTerm });
    if (useAISemantic) filters.push({ label: "Mode", value: aiResults?.usedAI ? "AI semantic" : "AI fallback" });
    return filters;
  }, [sector, stage, geography, searchTerm, useAISemantic, aiResults?.usedAI]);

  const displayCompanies = aiSearchActive ? aiCompanies : filteredCompanies;
  const displayCount = displayCompanies.length;
  const loading = aiSearchActive ? aiLoading : companiesLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Browse Companies</h1>
          <p className="text-muted-foreground mt-2">
            Discover companies seeking funding using our AI-powered search
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Switch checked={useAISemantic} onCheckedChange={setUseAISemantic} />
            <div className="flex flex-col">
              <span className="text-sm font-medium">AI semantic search</span>
              <span className="text-xs text-muted-foreground">
                Uses OpenAI reranking when enabled
              </span>
            </div>
          </div>
          {useAISemantic && (
            <Badge variant="secondary" className="gap-1">
              <Sparkles className="h-3 w-3" />
              {aiResults?.usedAI ? "OpenAI" : "Fallback"}
            </Badge>
          )}
        </div>
      </div>

      {/* Search Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search Criteria</CardTitle>
          <CardDescription>Filter companies by sector, stage, geography, or search by name</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Name or firm..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Sector</label>
              <Select value={sector} onValueChange={setSector}>
                <SelectTrigger>
                  <SelectValue placeholder="All sectors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All sectors</SelectItem>
                  {sectorOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Stage</label>
              <Select value={stage} onValueChange={setStage}>
                <SelectTrigger>
                  <SelectValue placeholder="All stages" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All stages</SelectItem>
                  {stageOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Geography</label>
              <Select value={geography} onValueChange={setGeography}>
                <SelectTrigger>
                  <SelectValue placeholder="All regions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All regions</SelectItem>
                  {geographyOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            {activeFilters.map((filter) => (
              <Badge key={`${filter.label}-${filter.value}`} variant="outline" className="text-xs">
                <span className="font-medium mr-1">{filter.label}:</span>
                {filter.value}
              </Badge>
            ))}
          </div>

          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("");
                setSector("all");
                setStage("all");
                setGeography("all");
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">
            {loading ? "Searching..." : `${displayCount} Companies Found`}
          </h2>
          <p className="text-sm text-muted-foreground">
            {aiSearchActive
              ? "AI reranks results by semantic relevance"
              : "Refine your filters to find the best matches"}
          </p>
        </div>

        <div className="grid gap-4">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-24 w-full" />
                </CardContent>
              </Card>
            ))
          ) : displayCompanies && displayCompanies.length > 0 ? (
            displayCompanies.map((company: any) => {
              const tags = parseTags(company.tags);
              const isInvestorFirm = tags.map(tag => tag.toLowerCase()).includes("investor firm".toLowerCase());
              const aiScore = company.__aiScore as number | undefined;
              const aiReason = company.__aiReason as string | undefined;
              return (
                <Card key={company.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      {/* Logo */}
                      <div className="flex-shrink-0">
                        <img
                          src={company.logoUrl || "https://api.dicebear.com/7.x/shapes/svg?seed=" + company.name}
                          alt={company.name}
                          className="w-16 h-16 rounded-lg bg-secondary border-2 border-border"
                        />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="text-lg font-semibold">{company.name}</h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                              <span>{company.sector}</span>
                              {company.businessModel && (
                                <>
                                  <span>•</span>
                                  <span>{company.businessModel}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {typeof aiScore === "number" && (
                              <Badge variant="outline" className="gap-1">
                                <Sparkles className="h-3 w-3" />
                                AI {aiScore}%
                              </Badge>
                            )}
                            <Badge variant="secondary">
                              {(company.confidence ?? 70)}% Quality
                            </Badge>
                          </div>
                        </div>

                        <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                          {company.description}
                        </p>

                        <div className="flex flex-wrap gap-4 mt-4 text-sm">
                          {company.stage && (
                            <div className="flex items-center gap-1.5">
                              <Badge variant="outline">{company.stage}</Badge>
                            </div>
                          )}
                          {isInvestorFirm && (
                            <div className="flex items-center gap-1.5">
                              <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">
                                Investor Firm
                              </Badge>
                            </div>
                          )}
                          {company.geography && (
                            <div className="flex items-center gap-1.5">
                              <MapPin className="h-4 w-4 text-green-600" />
                              <span>{company.geography}</span>
                            </div>
                          )}
                          {company.fundingTarget && (
                            <div className="flex items-center gap-1.5">
                              <DollarSign className="h-4 w-4 text-purple-600" />
                              <span>Seeking ${(company.fundingTarget / 1000000).toFixed(1)}M</span>
                            </div>
                          )}
                          {company.revenue && (
                            <div className="flex items-center gap-1.5">
                              <TrendingUp className="h-4 w-4 text-blue-600" />
                              <span>Revenue ${(company.revenue / 1000000).toFixed(1)}M</span>
                            </div>
                          )}
                        </div>

                        {aiReason && (
                          <p className="text-xs text-muted-foreground mt-3">
                            Why it matches: {aiReason}
                          </p>
                        )}

                        {tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {tags.slice(0, 5).map((tag: string, idx: number) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}

                        <div className="flex gap-2 mt-4">
                          <Button size="sm" asChild>
                            <a href={`/company/${company.id}`}>
                              View Profile
                            </a>
                          </Button>
                          {company.websiteUrl && (
                            <Button size="sm" variant="outline" asChild>
                              <a href={company.websiteUrl} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-3 w-3 mr-1" />
                                Website
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <SearchIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No companies found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search criteria or clearing filters
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

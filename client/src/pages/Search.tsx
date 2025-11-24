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

  const { data: companies } = trpc.companies.list.useQuery(
    {
      search: searchTerm || undefined,
      sector: sector === "all" ? undefined : sector,
      stage: stage === "all" ? undefined : stage,
      geography: geography === "all" ? undefined : geography,
      limit: 200,
    },
    { enabled: false }, // only used for enriching connection-derived companies
  );

  const { data: connections } = trpc.connections.list.useQuery();

  const { data: aiResults, isLoading: aiLoading } = trpc.search.semantic.useQuery(
    { query: searchTerm, limit: 20 },
    { enabled: useAISemantic && Boolean(searchTerm) },
  );

  const companyMap = useMemo(
    () => new Map((companies || []).map((company) => [company.id, company])),
    [companies],
  );

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

  const connectionCompanies = useMemo(() => {
    if (!connections) return [];
    const items: any[] = [];

    connections.forEach(profile => {
      if (profile.role !== "founder" && profile.role !== "operator") return;

      const companiesForProfile =
        (profile.linkedCompanies && profile.linkedCompanies.length > 0
          ? profile.linkedCompanies
          : []) ||
        [];

      if (!companiesForProfile.length) {
        companiesForProfile.push({
          ...profile.companyDetails,
          name: profile.companyDetails?.name || profile.company || profile.fullName,
          headquarters: profile.companyDetails?.headquarters || profile.geography,
          companyId: profile.companyId,
        });
      }

      companiesForProfile.forEach((company, idx) => {
        const companyId = company.companyId ?? profile.companyId;
        const dbCompany = companyId ? companyMap.get(companyId) : undefined;
        items.push({
          id: companyId ?? `${profile.id}-${idx}`,
          companyId,
          connectionId: profile.id,
          name: dbCompany?.name || company.name,
          description: dbCompany?.description || company.description || profile.summary,
          sector: dbCompany?.sector || profile.sector || profile.focusAreas?.[0],
          stage: dbCompany?.stage || company.stage || profile.stage,
          geography: dbCompany?.geography || company.headquarters || profile.geography,
          websiteUrl: dbCompany?.websiteUrl || company.website,
          confidence: dbCompany?.confidence ?? profile.accuracy ?? profile.confidence ?? 70,
          tags: dbCompany?.tags || profile.tags,
          fundingTarget: dbCompany?.fundingTarget ?? company.fundingTarget,
          revenue: dbCompany?.revenue ?? undefined,
          fromConnection: true,
        });
      });
    });

    const deduped = new Map<string | number, any>();
    items.forEach(item => {
      const key = item.companyId ?? item.id;
      if (!deduped.has(key)) {
        deduped.set(key, item);
      }
    });

    return Array.from(deduped.values());
  }, [connections, companyMap]);

  const filteredConnectionCompanies = useMemo(() => {
    return connectionCompanies.filter(company => {
      const matchesSearch =
        !searchTerm ||
        `${company.name} ${company.description || ""} ${company.sector || ""}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
      const matchesSector = sector === "all" || (company.sector || "").toLowerCase() === sector.toLowerCase();
      const matchesStage = stage === "all" || (company.stage || "").toLowerCase() === stage.toLowerCase();
      const matchesGeo =
        geography === "all" ||
        (company.geography || "").toLowerCase().includes(geography.toLowerCase());
      return matchesSearch && matchesSector && matchesStage && matchesGeo;
    });
  }, [connectionCompanies, searchTerm, sector, stage, geography]);

  const activeFilters = useMemo(() => {
    const filters: { label: string; value: string }[] = [];
    if (sector !== "all") filters.push({ label: "Sector", value: getLabel(sectorOptions, sector) });
    if (stage !== "all") filters.push({ label: "Stage", value: getLabel(stageOptions, stage) });
    if (geography !== "all") filters.push({ label: "Geography", value: getLabel(geographyOptions, geography) });
    if (searchTerm) filters.push({ label: "Search", value: searchTerm });
    if (useAISemantic) filters.push({ label: "Mode", value: aiResults?.usedAI ? "AI semantic" : "AI fallback" });
    return filters;
  }, [sector, stage, geography, searchTerm, useAISemantic, aiResults?.usedAI]);

  const formatCheckSize = (min?: number | null, max?: number | null) => {
    if (!min && !max) return "Not specified";
    const formatAmount = (amount: number) => {
      if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
      if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
      return `$${amount}`;
    };
    if (min && max) return `${formatAmount(min)} - ${formatAmount(max)}`;
    if (min) return `From ${formatAmount(min)}`;
    if (max) return `Up to ${formatAmount(max)}`;
    return "Not specified";
  };

  const displayCompanies =
    useAISemantic && searchTerm
      ? (() => {
          // Use connection companies only; overlay AI scores when they match connection company ids.
          const base = filteredConnectionCompanies;
          const byId = new Map<string | number, any>();
          base.forEach(item => byId.set(item.companyId ?? item.id, item));

          (aiResults?.results || []).forEach((result: any) => {
            const key = result.company.id;
            if (byId.has(key)) {
              byId.set(key, {
                ...byId.get(key),
                __aiScore: result.score,
                __aiReason: result.reason,
              });
            }
          });

          const combined = Array.from(byId.values());
          const deduped = new Map<string | number, any>();
          combined.forEach(item => {
            const key = item.id ?? item.companyId ?? `${item.connectionId ?? ""}-${item.name}`;
            if (!deduped.has(key)) deduped.set(key, item);
          });
          return Array.from(deduped.values());
        })()
      : (() => {
          // When browsing, show only connection companies.
          const combined = filteredConnectionCompanies;
          const deduped = new Map<string | number, any>();
          combined.forEach(item => {
            const key = item.id ?? item.companyId ?? `${item.connectionId ?? ""}-${item.name}`;
            if (!deduped.has(key)) deduped.set(key, item);
          });
          return Array.from(deduped.values());
        })();

  const displayCount = displayCompanies.length;
  const loading = useAISemantic && searchTerm ? aiLoading : false;

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
            {useAISemantic && searchTerm
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
                              {company.confidence}% Quality
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
                            <a
                              href={
                                company.companyId
                                  ? `/company/${company.companyId}`
                                  : company.connectionId
                                  ? `/connection/${company.connectionId}`
                                  : `/company/${company.id}`
                              }
                            >
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

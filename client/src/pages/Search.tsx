import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search as SearchIcon, Building2, MapPin, TrendingUp, DollarSign, ExternalLink } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
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

  const { data: investors, isLoading } = trpc.entities.list.useQuery({
    type: "investor",
    search: searchTerm || undefined,
    sector: sector === "all" ? undefined : sector,
    stage: stage === "all" ? undefined : stage,
    geography: geography === "all" ? undefined : geography,
    limit: 50,
  });

  const sectors = ["Fintech", "Healthcare", "AI/ML", "SaaS", "E-commerce", "Climate Tech", "EdTech", "Logistics", "Cybersecurity", "Biotech"];
  const stages = ["Pre-seed", "Seed", "Series A", "Series B", "Series C", "Growth"];
  const geographies = ["MENA", "GCC", "North America", "Europe", "Asia Pacific", "Global"];

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Search Investors</h1>
        <p className="text-muted-foreground mt-2">
          Find investors that match your criteria using our AI-powered search
        </p>
      </div>

      {/* Search Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search Criteria</CardTitle>
          <CardDescription>Filter investors by sector, stage, geography, or search by name</CardDescription>
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
                  {sectors.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
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
                  {stages.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
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
                  {geographies.map((g) => (
                    <SelectItem key={g} value={g}>
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
            {isLoading ? "Searching..." : `${investors?.length || 0} Investors Found`}
          </h2>
        </div>

        <div className="grid gap-4">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-24 w-full" />
                </CardContent>
              </Card>
            ))
          ) : investors && investors.length > 0 ? (
            investors.map((investor) => {
              const tags = investor.tags ? JSON.parse(investor.tags as string) : [];
              return (
                <Card key={investor.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      {/* Avatar */}
                      <div className="flex-shrink-0">
                        <img
                          src={investor.avatarUrl || ""}
                          alt={investor.name}
                          className="w-16 h-16 rounded-full bg-secondary"
                        />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="text-lg font-semibold">{investor.name}</h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                              <span>{investor.title}</span>
                              {investor.firm && (
                                <>
                                  <span>•</span>
                                  <Building2 className="h-3 w-3" />
                                  <span>{investor.firm}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <Badge variant="secondary" className="flex-shrink-0">
                            {investor.confidence}% Match
                          </Badge>
                        </div>

                        <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                          {investor.bio || investor.thesis}
                        </p>

                        <div className="flex flex-wrap gap-4 mt-4 text-sm">
                          {investor.sector && (
                            <div className="flex items-center gap-1.5">
                              <TrendingUp className="h-4 w-4 text-blue-600" />
                              <span>{investor.sector}</span>
                            </div>
                          )}
                          {investor.stage && (
                            <div className="flex items-center gap-1.5">
                              <Badge variant="outline">{investor.stage}</Badge>
                            </div>
                          )}
                          {investor.geography && (
                            <div className="flex items-center gap-1.5">
                              <MapPin className="h-4 w-4 text-green-600" />
                              <span>{investor.geography}</span>
                            </div>
                          )}
                          {(investor.checkSizeMin || investor.checkSizeMax) && (
                            <div className="flex items-center gap-1.5">
                              <DollarSign className="h-4 w-4 text-purple-600" />
                              <span>{formatCheckSize(investor.checkSizeMin, investor.checkSizeMax)}</span>
                            </div>
                          )}
                        </div>

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
                            <a href={`/investor/${investor.id}`}>View Profile</a>
                          </Button>
                          {investor.linkedinUrl && (
                            <Button size="sm" variant="outline" asChild>
                              <a href={investor.linkedinUrl} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-3 w-3 mr-1" />
                                LinkedIn
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
                <h3 className="text-lg font-semibold mb-2">No investors found</h3>
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

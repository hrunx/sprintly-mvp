import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Building2,
  TrendingUp,
  MapPin,
  DollarSign,
  Users,
  Sparkles,
  ExternalLink,
  ArrowRight,
} from "lucide-react";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Matches() {
  const [selectedCompany, setSelectedCompany] = useState<number>(1);

  const { data: companies } = trpc.companies.list.useQuery({
    limit: 50,
  });

  const { data: matches, isLoading } = trpc.matches.list.useQuery({
    companyId: selectedCompany,
    limit: 20,
  });

  const { data: investors } = trpc.investors.list.useQuery({
    limit: 200,
  });

  // Create a map of investor data for quick lookup
  const investorMap = new Map(investors?.map((inv) => [inv.id, inv]));

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-50 dark:bg-green-950";
    if (score >= 65) return "text-blue-600 bg-blue-50 dark:bg-blue-950";
    if (score >= 50) return "text-yellow-600 bg-yellow-50 dark:bg-yellow-950";
    return "text-gray-600 bg-gray-50 dark:bg-gray-950";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent Match";
    if (score >= 65) return "Good Match";
    if (score >= 50) return "Moderate Match";
    return "Low Match";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI-Powered Matches</h1>
          <p className="text-muted-foreground mt-2">
            Discover the best investor matches for your company based on AI analysis
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-600 text-white">
          <Sparkles className="h-5 w-5" />
          <span className="font-semibold">Smart Matching</span>
        </div>
      </div>

      {/* Company Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Select Company</CardTitle>
          <CardDescription>Choose a company to see investor matches</CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedCompany.toString()}
            onValueChange={(value) => setSelectedCompany(parseInt(value))}
          >
            <SelectTrigger className="w-full md:w-96">
              <SelectValue placeholder="Select company" />
            </SelectTrigger>
            <SelectContent>
              {companies?.map((company) => (
                <SelectItem key={company.id} value={company.id.toString()}>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    <span>{company.name}</span>
                    <span className="text-muted-foreground text-xs">
                      • {company.sector} • {company.stage}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Matches List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : matches && matches.length > 0 ? (
        <div className="space-y-4">
          {matches.map((match) => {
            const investor = investorMap.get(match.investorId);
            if (!investor) return null;

            const matchReasons = match.matchReasons
              ? JSON.parse(match.matchReasons as string)
              : [];
            const concerns = match.concerns ? JSON.parse(match.concerns as string) : [];

            return (
              <Card
                key={match.id}
                className="hover:shadow-lg transition-all cursor-pointer"
                onClick={() => (window.location.href = `/investor/${investor.id}`)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-6">
                    {/* Investor Info */}
                    <div className="flex-1 space-y-4">
                      <div className="flex items-start gap-4">
                        <img
                          src={investor.avatarUrl || "https://api.dicebear.com/7.x/avataaars/svg?seed=investor"}
                          alt={investor.name}
                          className="w-16 h-16 rounded-full border-2 border-border"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-xl font-semibold">{investor.name}</h3>
                            <Badge variant="outline" className="text-xs">
                              {investor.type}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground text-sm mb-2">
                            {investor.title} at {investor.firm}
                          </p>
                          <p className="text-sm line-clamp-2">{investor.bio}</p>
                        </div>
                      </div>

                      {/* Match Details */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="text-xs text-muted-foreground">Sector</div>
                            <div className="text-sm font-medium">{investor.sector}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="text-xs text-muted-foreground">Stage</div>
                            <div className="text-sm font-medium">{investor.stage}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="text-xs text-muted-foreground">Geography</div>
                            <div className="text-sm font-medium">{investor.geography}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="text-xs text-muted-foreground">Check Size</div>
                            <div className="text-sm font-medium">
                              ${(investor.checkSizeMin! / 1000000).toFixed(1)}M - $
                              {(investor.checkSizeMax! / 1000000).toFixed(1)}M
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Match Explanation */}
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Why this is a good match:</div>
                        <p className="text-sm text-muted-foreground">{match.explanation}</p>
                        
                        {matchReasons.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {matchReasons.map((reason: string, idx: number) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {reason}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Score Breakdown */}
                      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                        <div className="text-center">
                          <div className="text-xs text-muted-foreground mb-1">Sector</div>
                          <div className="text-sm font-bold">{match.sectorScore}%</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-muted-foreground mb-1">Stage</div>
                          <div className="text-sm font-bold">{match.stageScore}%</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-muted-foreground mb-1">Geo</div>
                          <div className="text-sm font-bold">{match.geoScore}%</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-muted-foreground mb-1">Traction</div>
                          <div className="text-sm font-bold">{match.tractionScore}%</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-muted-foreground mb-1">Check Size</div>
                          <div className="text-sm font-bold">{match.checkSizeScore}%</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-muted-foreground mb-1">Thesis</div>
                          <div className="text-sm font-bold">{match.thesisScore}%</div>
                        </div>
                      </div>
                    </div>

                    {/* Match Score */}
                    <div className="flex flex-col items-center gap-2">
                      <div
                        className={`flex flex-col items-center justify-center w-24 h-24 rounded-full border-4 ${getScoreColor(
                          match.score
                        )}`}
                      >
                        <div className="text-3xl font-bold">{match.score}</div>
                        <div className="text-xs">Score</div>
                      </div>
                      <Badge className={getScoreColor(match.score)}>
                        {getScoreLabel(match.score)}
                      </Badge>
                      <Button size="sm" variant="outline" className="mt-2">
                        View Profile
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No matches found</h3>
            <p className="text-muted-foreground">
              Try selecting a different company or adjusting your matching criteria
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

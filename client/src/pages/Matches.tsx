import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Target,
  TrendingUp,
  MapPin,
  Building2,
  Network,
  DollarSign,
  ExternalLink,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Matches() {
  const [selectedFounder, setSelectedFounder] = useState<number>(1);

  const { data: founders } = trpc.entities.list.useQuery({
    type: "founder",
    limit: 20,
  });

  const { data: matches, isLoading } = trpc.matching.founderMatches.useQuery({
    founderId: selectedFounder,
    limit: 20,
  });

  const { data: investors } = trpc.entities.list.useQuery({
    type: "investor",
    limit: 100,
  });

  // Create a map of investor data for quick lookup
  const investorMap = new Map(investors?.map((inv) => [inv.id, inv]));

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-blue-600";
    if (score >= 40) return "text-orange-600";
    return "text-gray-600";
  };

  const getScoreBadgeVariant = (score: number): "default" | "secondary" | "outline" => {
    if (score >= 80) return "default";
    if (score >= 60) return "secondary";
    return "outline";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Target className="h-8 w-8 text-primary" />
            Top Matches
          </h1>
          <p className="text-muted-foreground mt-2">
            AI-recommended investor matches based on multi-factor scoring
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white">
          <Sparkles className="h-5 w-5" />
          <span className="font-semibold">AI Powered</span>
        </div>
      </div>

      {/* Founder Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Select Founder</CardTitle>
          <CardDescription>Choose a founder to see their top investor matches</CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedFounder.toString()}
            onValueChange={(value) => setSelectedFounder(parseInt(value))}
          >
            <SelectTrigger className="w-full md:w-96">
              <SelectValue placeholder="Select a founder" />
            </SelectTrigger>
            <SelectContent>
              {founders?.map((founder) => (
                <SelectItem key={founder.id} value={founder.id.toString()}>
                  <div className="flex items-center gap-2">
                    <img
                      src={founder.avatarUrl || ""}
                      alt={founder.name}
                      className="w-6 h-6 rounded-full"
                    />
                    <span>{founder.name}</span>
                    <span className="text-muted-foreground">• {founder.firm}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Matches List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">
            {isLoading ? "Loading matches..." : `${matches?.length || 0} Recommended Matches`}
          </h2>
        </div>

        <div className="space-y-4">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-32 w-full" />
                </CardContent>
              </Card>
            ))
          ) : matches && matches.length > 0 ? (
            matches.map((match) => {
              const investor = investorMap.get(match.investorId);
              if (!investor) return null;

              const tags = investor.tags ? JSON.parse(investor.tags as string) : [];

              return (
                <Card key={match.id} className="hover:shadow-lg transition-all border-l-4 border-l-primary">
                  <CardContent className="p-6">
                    <div className="flex gap-6">
                      {/* Avatar */}
                      <div className="flex-shrink-0">
                        <img
                          src={investor.avatarUrl || ""}
                          alt={investor.name}
                          className="w-20 h-20 rounded-full bg-secondary"
                        />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div>
                            <h3 className="text-xl font-semibold">{investor.name}</h3>
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
                          <Badge
                            variant={getScoreBadgeVariant(match.score)}
                            className={`text-lg px-4 py-1 ${getScoreColor(match.score)}`}
                          >
                            {match.score}% Match
                          </Badge>
                        </div>

                        {/* Match Explanation */}
                        <div className="bg-accent/30 rounded-lg p-4 mb-4">
                          <p className="text-sm leading-relaxed">{match.explanation}</p>
                        </div>

                        {/* Score Breakdown */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Sector</span>
                              <span className="font-semibold">{match.sectorScore}%</span>
                            </div>
                            <Progress value={match.sectorScore || 0} className="h-2" />
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Stage</span>
                              <span className="font-semibold">{match.stageScore}%</span>
                            </div>
                            <Progress value={match.stageScore || 0} className="h-2" />
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Geography</span>
                              <span className="font-semibold">{match.geoScore}%</span>
                            </div>
                            <Progress value={match.geoScore || 0} className="h-2" />
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Traction</span>
                              <span className="font-semibold">{match.tractionScore}%</span>
                            </div>
                            <Progress value={match.tractionScore || 0} className="h-2" />
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Check Size</span>
                              <span className="font-semibold">{match.checkSizeScore}%</span>
                            </div>
                            <Progress value={match.checkSizeScore || 0} className="h-2" />
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Network</span>
                              <span className="font-semibold">{match.graphScore}%</span>
                            </div>
                            <Progress value={match.graphScore || 0} className="h-2" />
                          </div>
                        </div>

                        {/* Investor Details */}
                        <div className="flex flex-wrap gap-4 text-sm mb-4">
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
                              <span>
                                ${(investor.checkSizeMin || 0) / 1000}K - $
                                {(investor.checkSizeMax || 0) / 1000000}M
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Tags */}
                        {tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {tags.slice(0, 6).map((tag: string, idx: number) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2">
                          <Button size="sm" className="gap-2">
                            View Intro Path
                            <Network className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline" asChild>
                            <a href={`/investor/${investor.id}`}>
                              View Profile
                              <ChevronRight className="h-3 w-3 ml-1" />
                            </a>
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
                <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No matches found</h3>
                <p className="text-muted-foreground">
                  Try selecting a different founder or check back later
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

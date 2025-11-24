import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, Users, TrendingUp, ArrowRight, Sparkles } from "lucide-react";
import { useMemo } from "react";
import { trpc } from "@/lib/trpc";

interface MatchingConfig {
  weights: {
    sector: number;
    stage: number;
    geography: number;
    traction: number;
    checkSize: number;
    thesis: number;
  };
}

interface MatchPreviewProps {
  config: MatchingConfig;
}

export function MatchPreview({ config }: MatchPreviewProps) {
  const { data: matches, isLoading: matchesLoading } = trpc.matches.list.useQuery({ limit: 1 });
  const topMatch = matches?.[0];

  const { data: company, isLoading: companyLoading } = trpc.companies.byId.useQuery(
    { id: topMatch?.companyId ?? 0 },
    { enabled: Boolean(topMatch?.companyId) },
  );
  const { data: investor, isLoading: investorLoading } = trpc.investors.byId.useQuery(
    { id: topMatch?.investorId ?? 0 },
    { enabled: Boolean(topMatch?.investorId) },
  );

  const loading = matchesLoading || (Boolean(topMatch) && (companyLoading || investorLoading));

  const matchReasons = useMemo(() => {
    if (!topMatch?.matchReasons) return [];
    try {
      const parsed =
        typeof topMatch.matchReasons === "string"
          ? JSON.parse(topMatch.matchReasons)
          : topMatch.matchReasons;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [topMatch?.matchReasons]);

  const breakdown = useMemo(() => {
    if (!topMatch) return [];

    const scores = {
      sector: topMatch.sectorScore ?? 0,
      stage: topMatch.stageScore ?? 0,
      geography: topMatch.geoScore ?? 0,
      traction: topMatch.tractionScore ?? 0,
      checkSize: topMatch.checkSizeScore ?? 0,
      thesis: topMatch.thesisScore ?? 0,
    };

    const labels: Record<keyof MatchingConfig["weights"], string> = {
      sector: "Sector",
      stage: "Stage",
      geography: "Geography",
      traction: "Traction",
      checkSize: "Check Size",
      thesis: "Thesis",
    };

    const totalWeight = Math.max(
      1,
      Object.values(config.weights).reduce((sum, w) => sum + w, 0),
    );

    return (Object.keys(labels) as Array<keyof typeof labels>).map(key => {
      const weight = config.weights[key];
      const contribution = Math.round((scores[key] * weight) / totalWeight);
      return {
        key,
        name: labels[key],
        score: scores[key],
        weight,
        contribution,
      };
    });
  }, [config.weights, topMatch]);

  const overallScore = useMemo(() => {
    if (breakdown.length === 0) return topMatch?.score ?? 0;
    const sum = breakdown.reduce((acc, item) => acc + item.contribution, 0);
    return Math.max(0, Math.min(100, Math.round(sum)));
  }, [breakdown, topMatch?.score]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return "bg-green-100";
    if (score >= 60) return "bg-yellow-100";
    return "bg-red-100";
  };

  const formatMoneyShort = (value?: number | null) => {
    if (!value) return "N/A";
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value}`;
  };

  const hasEntities = Boolean(topMatch && company && investor);

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <CardTitle>Live Match Preview</CardTitle>
        </div>
        <CardDescription>
          See how your weight adjustments affect match scores in real-time
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading && (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        )}

        {!loading && !hasEntities && (
          <div className="p-4 rounded-lg border bg-muted/40 text-sm text-muted-foreground">
            No matches in the database yet. Import companies and investors, run matching, and this
            preview will reflect real pairs automatically.
          </div>
        )}

        {!loading && hasEntities && company && investor && topMatch && (
          <>
            {/* Match Participants */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              {/* Company */}
              <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold text-blue-900">{company.name}</span>
                </div>
                <div className="space-y-1 text-xs text-blue-700">
                  <div className="flex justify-between">
                    <span>Sector:</span>
                    <span className="font-medium">{company.sector || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Stage:</span>
                    <span className="font-medium">{company.stage || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Revenue:</span>
                    <span className="font-medium">{formatMoneyShort(company.revenue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Seeking:</span>
                    <span className="font-medium">{formatMoneyShort(company.fundingTarget)}</span>
                  </div>
                </div>
              </div>

              {/* Match Score */}
              <div className="flex flex-col items-center justify-center p-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
                  <div
                    className={`relative w-24 h-24 rounded-full flex items-center justify-center ${getScoreBgColor(overallScore)} border-4 border-primary`}
                  >
                    <div className="text-center">
                      <div className={`text-3xl font-bold ${getScoreColor(overallScore)}`}>
                        {overallScore}
                      </div>
                      <div className="text-xs text-muted-foreground">Match</div>
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground mt-2 md:hidden" />
              </div>

              {/* Investor */}
              <div className="p-4 rounded-lg bg-purple-50 border border-purple-200">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-purple-600" />
                  <span className="font-semibold text-purple-900">{investor.name}</span>
                </div>
                <div className="space-y-1 text-xs text-purple-700">
                  <div className="flex justify-between">
                    <span>Focus:</span>
                    <span className="font-medium">{investor.sector || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Stages:</span>
                    <span className="font-medium">{investor.stage || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Check Size:</span>
                    <span className="font-medium">
                      {investor.checkSizeMin || investor.checkSizeMax
                        ? `${formatMoneyShort(investor.checkSizeMin)} - ${formatMoneyShort(investor.checkSizeMax)}`
                        : "Not set"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Location:</span>
                    <span className="font-medium">{investor.geography || "N/A"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Score Breakdown */}
            <div>
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Score Breakdown
              </h4>
              <div className="space-y-3">
                {breakdown
                  .sort((a, b) => b.contribution - a.contribution)
                  .map(item => (
                    <div key={item.name} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{item.name}</span>
                          <Badge variant="outline" className="text-xs">
                            Weight: {item.weight}%
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Base: {item.score}</span>
                          <span className={`font-semibold ${getScoreColor(item.contribution)}`}>
                            +{item.contribution}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={item.contribution} className="h-2 flex-1" />
                        <span className="text-xs text-muted-foreground w-12 text-right">
                          {item.contribution}%
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Quality Indicator */}
            <div className={`p-4 rounded-lg border-2 ${
              overallScore >= 80 
                ? "bg-green-50 border-green-200" 
                : overallScore >= 60 
                ? "bg-yellow-50 border-yellow-200" 
                : "bg-red-50 border-red-200"
            }`}>
              <p className="text-sm font-medium mb-1">
                {overallScore >= 80 
                  ? "🎯 Excellent Match!" 
                  : overallScore >= 60 
                  ? "✅ Good Match" 
                  : "⚠️ Moderate Match"}
              </p>
              <p className="text-xs text-muted-foreground">
                {overallScore >= 80 
                  ? "This company-investor pair shows strong alignment across all key factors." 
                  : overallScore >= 60 
                  ? "This match meets most criteria but has room for improvement in some areas." 
                  : "Consider adjusting weights or thresholds to improve match quality."}
              </p>
            </div>

            {(topMatch.explanation || matchReasons.length > 0) && (
              <div className="space-y-3">
                {topMatch.explanation && (
                  <div className="p-3 rounded-lg border bg-muted/30 text-sm text-muted-foreground">
                    {topMatch.explanation}
                  </div>
                )}
                {matchReasons.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {matchReasons.map((reason, idx) => (
                      <Badge key={idx} variant="secondary">
                        {reason}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

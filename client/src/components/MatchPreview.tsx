import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Building2, Users, TrendingUp, ArrowRight, Sparkles } from "lucide-react";
import { useMemo } from "react";

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

// Sample data for preview
const SAMPLE_COMPANY = {
  name: "TechFlow AI",
  sector: "AI/ML",
  stage: "Series A",
  location: "San Francisco, CA",
  revenue: "$2.5M ARR",
  teamSize: 15,
  fundingGoal: "$5M"
};

const SAMPLE_INVESTOR = {
  name: "Venture Partners",
  focus: ["AI/ML", "SaaS"],
  stages: ["Seed", "Series A"],
  checkSize: "$3-7M",
  location: "San Francisco, CA"
};

// Scoring logic (simplified version of backend logic)
const calculateMatchScore = (config: MatchingConfig) => {
  const scores = {
    sector: 95, // AI/ML match
    stage: 100, // Series A perfect match
    geography: 100, // Same location
    traction: 85, // Good revenue
    checkSize: 90, // $5M fits in $3-7M range
    thesis: 80, // Good alignment
  };

  const totalWeight = Object.values(config.weights).reduce((sum, w) => sum + w, 0);
  
  const weightedScore = Object.entries(config.weights).reduce((sum, [key, weight]) => {
    const score = scores[key as keyof typeof scores];
    return sum + (score * weight) / totalWeight;
  }, 0);

  return {
    overall: Math.round(weightedScore),
    breakdown: Object.entries(scores).map(([key, score]) => ({
      name: key.charAt(0).toUpperCase() + key.slice(1),
      score,
      weight: config.weights[key as keyof typeof config.weights],
      contribution: Math.round((score * config.weights[key as keyof typeof config.weights]) / totalWeight)
    }))
  };
};

export function MatchPreview({ config }: MatchPreviewProps) {
  const matchResult = useMemo(() => calculateMatchScore(config), [config]);

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
        {/* Match Participants */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          {/* Company */}
          <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-blue-900">{SAMPLE_COMPANY.name}</span>
            </div>
            <div className="space-y-1 text-xs text-blue-700">
              <div className="flex justify-between">
                <span>Sector:</span>
                <span className="font-medium">{SAMPLE_COMPANY.sector}</span>
              </div>
              <div className="flex justify-between">
                <span>Stage:</span>
                <span className="font-medium">{SAMPLE_COMPANY.stage}</span>
              </div>
              <div className="flex justify-between">
                <span>Revenue:</span>
                <span className="font-medium">{SAMPLE_COMPANY.revenue}</span>
              </div>
              <div className="flex justify-between">
                <span>Seeking:</span>
                <span className="font-medium">{SAMPLE_COMPANY.fundingGoal}</span>
              </div>
            </div>
          </div>

          {/* Match Score */}
          <div className="flex flex-col items-center justify-center p-4">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
              <div className={`relative w-24 h-24 rounded-full flex items-center justify-center ${getScoreBgColor(matchResult.overall)} border-4 border-primary`}>
                <div className="text-center">
                  <div className={`text-3xl font-bold ${getScoreColor(matchResult.overall)}`}>
                    {matchResult.overall}
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
              <span className="font-semibold text-purple-900">{SAMPLE_INVESTOR.name}</span>
            </div>
            <div className="space-y-1 text-xs text-purple-700">
              <div className="flex justify-between">
                <span>Focus:</span>
                <span className="font-medium">{SAMPLE_INVESTOR.focus.join(", ")}</span>
              </div>
              <div className="flex justify-between">
                <span>Stages:</span>
                <span className="font-medium">{SAMPLE_INVESTOR.stages.join(", ")}</span>
              </div>
              <div className="flex justify-between">
                <span>Check Size:</span>
                <span className="font-medium">{SAMPLE_INVESTOR.checkSize}</span>
              </div>
              <div className="flex justify-between">
                <span>Location:</span>
                <span className="font-medium">{SAMPLE_INVESTOR.location}</span>
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
            {matchResult.breakdown
              .sort((a, b) => b.contribution - a.contribution)
              .map((item) => (
                <div key={item.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{item.name}</span>
                      <Badge variant="outline" className="text-xs">
                        Weight: {item.weight}%
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        Base: {item.score}
                      </span>
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
          matchResult.overall >= 80 
            ? "bg-green-50 border-green-200" 
            : matchResult.overall >= 60 
            ? "bg-yellow-50 border-yellow-200" 
            : "bg-red-50 border-red-200"
        }`}>
          <p className="text-sm font-medium mb-1">
            {matchResult.overall >= 80 
              ? "🎯 Excellent Match!" 
              : matchResult.overall >= 60 
              ? "✅ Good Match" 
              : "⚠️ Moderate Match"}
          </p>
          <p className="text-xs text-muted-foreground">
            {matchResult.overall >= 80 
              ? "This company-investor pair shows strong alignment across all key factors." 
              : matchResult.overall >= 60 
              ? "This match meets most criteria but has room for improvement in some areas." 
              : "Consider adjusting weights or thresholds to improve match quality."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface MatchScoreBreakdownProps {
  overallScore: number;
  sectorScore: number | null;
  stageScore: number | null;
  geoScore: number | null;
  tractionScore: number | null;
  checkSizeScore: number | null;
  thesisScore: number | null;
  matchReasons?: string | null;
}

export function MatchScoreBreakdown({
  overallScore,
  sectorScore,
  stageScore,
  geoScore,
  tractionScore,
  checkSizeScore,
  thesisScore,
  matchReasons,
}: MatchScoreBreakdownProps) {
  const getScoreColor = (score: number | null) => {
    if (!score) return "text-gray-400";
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return <Badge className="bg-green-600">Excellent</Badge>;
    if (score >= 60) return <Badge className="bg-yellow-600">Good</Badge>;
    if (score >= 40) return <Badge className="bg-orange-600">Fair</Badge>;
    return <Badge variant="destructive">Poor</Badge>;
  };

  const factors = [
    { name: "Sector Alignment", score: sectorScore, weight: "25%" },
    { name: "Stage Fit", score: stageScore, weight: "20%" },
    { name: "Geography Match", score: geoScore, weight: "15%" },
    { name: "Traction Requirements", score: tractionScore, weight: "15%" },
    { name: "Check Size Compatibility", score: checkSizeScore, weight: "15%" },
    { name: "Thesis Alignment", score: thesisScore, weight: "10%" },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Match Score Breakdown</CardTitle>
            <CardDescription>Six-factor compatibility analysis</CardDescription>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold">{overallScore}%</div>
            <div className="text-sm text-muted-foreground">Overall Score</div>
            {getScoreBadge(overallScore)}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Factor Scores */}
        <div className="space-y-4">
          {factors.map((factor) => (
            <div key={factor.name} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{factor.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{factor.weight}</span>
                  <span className={`font-bold ${getScoreColor(factor.score)}`}>
                    {factor.score ?? "N/A"}
                    {factor.score !== null && "%"}
                  </span>
                </div>
              </div>
              <Progress value={factor.score ?? 0} className="h-2" />
            </div>
          ))}
        </div>

        {/* Match Reasons */}
        {matchReasons && (
          <div className="pt-4 border-t">
            <h4 className="text-sm font-semibold mb-2">Key Strengths</h4>
            <p className="text-sm text-muted-foreground">{matchReasons}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

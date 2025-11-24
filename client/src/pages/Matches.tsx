import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import {
  Building2,
  TrendingUp,
  MapPin,
  DollarSign,
  Users,
  Sparkles,
  ExternalLink,
  ArrowRight,
  Send,
  Flame,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Matches() {
  const [selectedCompany, setSelectedCompany] = useState<number | null>(null);
  const [weights, setWeights] = useState({
    sector: 25,
    stage: 20,
    geography: 10,
    traction: 20,
    checkSize: 15,
    thesis: 10,
  });
  const [temperature, setTemperature] = useState(0.1);
  const [lastEmails, setLastEmails] = useState<{
    investor: { subject: string; body: string };
    founder: { subject: string; body: string };
  } | null>(null);

  const { data: companies } = trpc.companies.list.useQuery({
    limit: 200,
  });
  const { data: connections } = trpc.connections.list.useQuery();

  const {
    data: matchesData,
    isLoading: matchesLoading,
    refetch: refetchMatches,
  } = trpc.matches.list.useQuery(
    selectedCompany
      ? {
          companyId: selectedCompany,
          limit: 20,
        }
      : undefined,
    { enabled: Boolean(selectedCompany) },
  );

  const { data: investors } = trpc.investors.list.useQuery(
    { limit: 200 },
    { enabled: Boolean(selectedCompany) },
  );

  const companyMap = useMemo(
    () => new Map((companies || []).map(company => [company.id, company])),
    [companies],
  );

  const connectionCompanies = useMemo(() => {
    if (!connections) return [];
    const items: any[] = [];

    connections.forEach(profile => {
      if (profile.role !== "founder" && profile.role !== "operator") return;

      const linked =
        (profile.linkedCompanies && profile.linkedCompanies.length > 0
          ? profile.linkedCompanies
          : []) || [];

      if (!linked.length && profile.companyId) {
        linked.push({
          ...profile.companyDetails,
          name: profile.companyDetails?.name || profile.company || profile.fullName,
          headquarters: profile.companyDetails?.headquarters || profile.geography,
          companyId: profile.companyId,
        });
      }

      linked.forEach(company => {
        const companyId = company.companyId ?? profile.companyId;
        if (!companyId) return;
        const dbCompany = companyMap.get(companyId);
        items.push({
          id: companyId,
          companyId,
          name: dbCompany?.name || company.name,
          description: dbCompany?.description || company.description || profile.summary,
          sector: dbCompany?.sector || profile.sector || profile.focusAreas?.[0],
          stage: dbCompany?.stage || company.stage || profile.stage,
          geography: dbCompany?.geography || company.headquarters || profile.geography,
          websiteUrl: dbCompany?.websiteUrl || company.website,
          founderEmail: dbCompany?.founderEmail,
          confidence: dbCompany?.confidence ?? profile.accuracy ?? profile.confidence ?? 70,
        });
      });
    });

    const deduped = new Map<number, any>();
    items.forEach(item => {
      if (!deduped.has(item.companyId)) deduped.set(item.companyId, item);
    });

    return Array.from(deduped.values());
  }, [connections, companyMap]);

  const companyOptions = connectionCompanies.length > 0 ? connectionCompanies : companies || [];

  const connectionInvestorIds = useMemo(() => {
    const ids = new Set<number>();
    connections?.forEach(profile => {
      if (profile.investorId) ids.add(profile.investorId);
    });
    return ids;
  }, [connections]);

  const requestIntroMutation = trpc.introRequests.create.useMutation();
  const handleManualRun = async () => {
    if (!selectedCompany) {
      toast.error("Select a company first");
      return;
    }
    try {
      const res = await manualMatchMutation.mutateAsync({
        companyId: selectedCompany,
        weights,
        temperature,
        limit: 25,
        persist: true,
      });
      toast.success("Recomputed matches", {
        description: `Generated ${res.generated} matches using your weights`,
      });
      refetchMatches();
    } catch (error: any) {
      toast.error(error?.message || "Failed to run manual matching");
    }
  };
  const manualMatchMutation = trpc.matches.manualRun.useMutation();

  const handleRequestIntro = async (e: React.MouseEvent, companyId: number, investorId: number) => {
    e.stopPropagation();
    try {
      const res = await requestIntroMutation.mutateAsync({ companyId, investorId });
      setLastEmails(res.emails || null);
      toast.success("Introduction request sent!", {
        description: res.emails ? "Draft emails prepared for both sides." : undefined,
      });
    } catch (error) {
      toast.error("Failed to send introduction request");
    }
  };

  // Create a map of investor data for quick lookup
  const investorMap = useMemo(
    () =>
      new Map(
        (investors || [])
          .filter(inv => connectionInvestorIds.size === 0 || connectionInvestorIds.has(inv.id))
          .map(inv => [inv.id, inv]),
      ),
    [connectionInvestorIds, investors],
  );

  useEffect(() => {
    if (!selectedCompany && companyOptions && companyOptions.length > 0) {
      setSelectedCompany(companyOptions[0].id || companyOptions[0].companyId);
    }
  }, [companyOptions, selectedCompany]);

  const filteredMatches = useMemo(() => {
    if (!matchesData) return [];
    if (connectionInvestorIds.size === 0) return matchesData;
    return matchesData.filter(match => connectionInvestorIds.has(match.investorId));
  }, [connectionInvestorIds, matchesData]);

  const matches = filteredMatches;

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
          {companyOptions && companyOptions.length > 0 ? (
            <Select
              value={selectedCompany?.toString() ?? ""}
              onValueChange={(value) => setSelectedCompany(parseInt(value))}
            >
              <SelectTrigger className="w-full md:w-96">
                <SelectValue placeholder="Select company" />
              </SelectTrigger>
              <SelectContent>
                {companyOptions.map((company: any) => {
                  const value = company.companyId ?? company.id;
                  return (
                    <SelectItem key={value} value={value.toString()}>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      <span>{company.name}</span>
                      <span className="text-muted-foreground text-xs">
                        • {company.sector || "N/A"} • {company.stage || "N/A"}
                      </span>
                    </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          ) : (
            <p className="text-sm text-muted-foreground">
              No companies found from your LinkedIn connections. Import your CSV to get started.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Manual Matching Controls</CardTitle>
          <CardDescription>Adjust weights and temperature, then re-run matching instantly</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {([
              { key: "sector", label: "Sector alignment" },
              { key: "stage", label: "Stage fit" },
              { key: "geography", label: "Geography" },
              { key: "traction", label: "Traction" },
              { key: "checkSize", label: "Check size" },
              { key: "thesis", label: "Thesis fit" },
            ] as const).map(entry => (
              <div key={entry.key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">{entry.label}</Label>
                  <Badge variant="secondary">{weights[entry.key]}%</Badge>
                </div>
                <Slider
                  value={[weights[entry.key]]}
                  max={40}
                  step={1}
                  onValueChange={([value]) => setWeights(prev => ({ ...prev, [entry.key]: value }))}
                />
              </div>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-500" />
              <Label>Temperature {temperature.toFixed(2)}</Label>
            </div>
            <Slider
              value={[temperature * 100]}
              onValueChange={([value]) => setTemperature(value / 100)}
              max={100}
              step={5}
              className="flex-1"
            />
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Higher temperature introduces variety into the ranking; lower temperature keeps it deterministic.
            </p>
            <Button
              onClick={handleManualRun}
              disabled={!selectedCompany || manualMatchMutation.isPending}
              className="gap-2"
            >
              {manualMatchMutation.isPending ? (
                <>
                  <Sparkles className="h-4 w-4 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Start new matching
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {lastEmails && (
        <Card>
          <CardHeader>
            <CardTitle>Email drafts ready</CardTitle>
            <CardDescription>Copy/paste to send to both parties (sending integration coming later)</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline">Founder</Badge>
                <span className="text-sm text-muted-foreground">{lastEmails.founder.subject}</span>
              </div>
              <pre className="bg-muted p-3 rounded-md text-xs whitespace-pre-wrap leading-relaxed">{lastEmails.founder.body}</pre>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline">Investor</Badge>
                <span className="text-sm text-muted-foreground">{lastEmails.investor.subject}</span>
              </div>
              <pre className="bg-muted p-3 rounded-md text-xs whitespace-pre-wrap leading-relaxed">{lastEmails.investor.body}</pre>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Matches List */}
      {!selectedCompany ? (
        <Card>
          <CardContent className="p-6 text-muted-foreground">
            Select or import a company to see matches.
          </CardContent>
        </Card>
      ) : matchesLoading ? (
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
                            <Badge className="text-xs bg-emerald-100 text-emerald-800 border-emerald-200">
                              {investor.type || "Investor"}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground text-sm mb-2">
                            {investor.title} at {investor.firm}
                          </p>
                          <p className="text-sm line-clamp-2">{investor.bio || "No bio yet"}</p>
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
                              {investor.checkSizeMin && investor.checkSizeMax
                                ? `$${(investor.checkSizeMin / 1_000_000).toFixed(1)}M - $${(investor.checkSizeMax / 1_000_000).toFixed(1)}M`
                                : investor.checkSizeMin
                                ? `From $${(investor.checkSizeMin / 1_000_000).toFixed(1)}M`
                                : investor.checkSizeMax
                                ? `Up to $${(investor.checkSizeMax / 1_000_000).toFixed(1)}M`
                                : "Not specified"}
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
                      <div className="flex flex-col gap-2 mt-2">
                        <Button size="sm" variant="outline">
                          View Profile
                          <ArrowRight className="h-4 w-4 ml-1" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="default"
                          onClick={(e) => handleRequestIntro(e, selectedCompany, investor.id)}
                          disabled={requestIntroMutation.isPending}
                        >
                          <Send className="h-4 w-4 mr-1" />
                          Request Intro
                        </Button>
                      </div>
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

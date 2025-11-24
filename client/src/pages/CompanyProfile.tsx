import { trpc } from "@/lib/trpc";
import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Building2,
  MapPin,
  Calendar,
  Users,
  TrendingUp,
  DollarSign,
  Target,
  Globe,
  FileText,
  ExternalLink,
  Sparkles,
  BarChart3,
  Briefcase,
} from "lucide-react";
import { useRoute } from "wouter";
import { PitchDeckUpload } from "@/components/PitchDeckUpload";

export default function CompanyProfile() {
  const [, params] = useRoute("/company/:id");
  const companyId = params?.id ? parseInt(params.id) : 0;

  const queryEnabled = companyId > 0;
  const { data: company, isLoading } = trpc.companies.byId.useQuery({ id: companyId }, { enabled: queryEnabled });
  const { data: matches } = trpc.matches.list.useQuery({ companyId, limit: 5 }, { enabled: queryEnabled });
  const { data: investors } = trpc.investors.list.useQuery({ limit: 200 }, { enabled: queryEnabled });

  const tags = useMemo(() => {
    if (!company?.tags) return [];
    try {
      const parsed = typeof company.tags === "string" ? JSON.parse(company.tags) : company.tags;
      if (Array.isArray(parsed)) {
        return parsed;
      }
      if (parsed && typeof parsed === "object") {
        return Object.values(parsed)
          .flatMap((value) => {
            if (Array.isArray(value)) return value;
            if (typeof value === "string") return value.split(",").map((item) => item.trim());
            return [];
          })
          .filter(Boolean);
      }
      if (typeof parsed === "string") {
        return parsed.split(",").map((item) => item.trim());
      }
    } catch (error) {
      console.warn("[CompanyProfile] Failed to parse tags", error);
    }
    return [];
  }, [company?.tags]);

  const deckAnalysis = useMemo(() => {
    if (!company?.pitchDeckAnalysis) return null as any;
    try {
      return typeof company.pitchDeckAnalysis === "string"
        ? JSON.parse(company.pitchDeckAnalysis)
        : company.pitchDeckAnalysis;
    } catch (error) {
      console.warn("[CompanyProfile] Failed to parse pitch deck analysis", error);
      return null;
    }
  }, [company?.pitchDeckAnalysis]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Company not found</h3>
          <p className="text-muted-foreground">The company you're looking for doesn't exist.</p>
          <Button className="mt-4" onClick={() => (window.location.href = "/search")}>
            Browse Companies
          </Button>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number | null) => {
    if (!amount) return "N/A";
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-2">
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            {/* Logo */}
            <img
              src={company.logoUrl || `https://api.dicebear.com/7.x/shapes/svg?seed=${company.name}`}
              alt={company.name}
              className="w-24 h-24 rounded-xl border-2 border-border"
            />

            {/* Company Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">{company.name}</h1>
                  <p className="text-muted-foreground mt-2 text-lg">{company.description}</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-600 text-white">
                  <Sparkles className="h-5 w-5" />
                  <span className="font-semibold">{company.confidence}% Quality</span>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mt-4">
                <Badge variant="default">{company.sector}</Badge>
                <Badge variant="secondary">{company.stage}</Badge>
                {company.businessModel && <Badge variant="outline">{company.businessModel}</Badge>}
                {tags.slice(0, 5).map((tag: string, idx: number) => (
                  <Badge key={idx} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-xs text-muted-foreground">Location</div>
                    <div className="text-sm font-medium">{company.geography}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-xs text-muted-foreground">Founded</div>
                    <div className="text-sm font-medium">{company.foundedYear || "N/A"}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-xs text-muted-foreground">Team Size</div>
                    <div className="text-sm font-medium">{company.teamSize || "N/A"}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-xs text-muted-foreground">Business Model</div>
                    <div className="text-sm font-medium">{company.businessModel || "N/A"}</div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 mt-6">
                {company.websiteUrl && (
                  <Button asChild>
                    <a href={company.websiteUrl} target="_blank" rel="noopener noreferrer">
                      <Globe className="h-4 w-4 mr-2" />
                      Visit Website
                    </a>
                  </Button>
                )}
                {company.pitchDeckUrl && (
                  <Button variant="outline" asChild>
                    <a href={company.pitchDeckUrl} target="_blank" rel="noopener noreferrer">
                      <FileText className="h-4 w-4 mr-2" />
                      View Pitch Deck
                    </a>
                  </Button>
                )}

              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Funding Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-purple-600" />
              Funding Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Funding Round</span>
              <Badge variant="secondary">{company.fundingRound || "N/A"}</Badge>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Seeking</span>
              <span className="font-semibold text-lg">{formatCurrency(company.fundingTarget)}</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Already Raised</span>
              <span className="font-semibold">{formatCurrency(company.fundingRaised)}</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Valuation</span>
              <span className="font-semibold">{formatCurrency(company.valuation)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Traction Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Traction & Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Annual Revenue</span>
              <span className="font-semibold text-lg">{formatCurrency(company.revenue)}</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Revenue Growth</span>
              <span className="font-semibold text-green-600">
                {company.revenueGrowth ? `+${company.revenueGrowth}%` : "N/A"}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Customers</span>
              <span className="font-semibold">{company.customers?.toLocaleString() || "N/A"}</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">MRR</span>
              <span className="font-semibold">{formatCurrency(company.mrr)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pitch Deck Upload */}
      <PitchDeckUpload companyId={companyId} companyName={company.name} />

      {deckAnalysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-600" />
              Pitch Deck Insights
            </CardTitle>
            <CardDescription>LLM-generated summary from the uploaded deck</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {deckAnalysis.summary && (
              <div className="p-4 rounded-lg border bg-muted/40 text-sm text-muted-foreground">
                {deckAnalysis.summary}
              </div>
            )}
            {deckAnalysis.highlights && deckAnalysis.highlights.length > 0 && (
              <div>
                <div className="text-xs text-muted-foreground mb-1">Highlights</div>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  {deckAnalysis.highlights.map((item: string, idx: number) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
            {deckAnalysis.risks && deckAnalysis.risks.length > 0 && (
              <div>
                <div className="text-xs text-muted-foreground mb-1">Risks / Questions</div>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  {deckAnalysis.risks.map((item: string, idx: number) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {deckAnalysis.metrics && (
              <div className="grid grid-cols-2 gap-3">
                {deckAnalysis.metrics.revenue && (
                  <div className="p-3 rounded-lg border bg-card">
                    <div className="text-xs text-muted-foreground mb-1">Revenue</div>
                    <div className="font-semibold">{deckAnalysis.metrics.revenue}</div>
                  </div>
                )}
                {deckAnalysis.metrics.teamSize && (
                  <div className="p-3 rounded-lg border bg-card">
                    <div className="text-xs text-muted-foreground mb-1">Team Size</div>
                    <div className="font-semibold">{deckAnalysis.metrics.teamSize}</div>
                  </div>
                )}
                {deckAnalysis.metrics.marketSize && (
                  <div className="p-3 rounded-lg border bg-card">
                    <div className="text-xs text-muted-foreground mb-1">Market Size</div>
                    <div className="font-semibold">{deckAnalysis.metrics.marketSize}</div>
                  </div>
                )}
                {deckAnalysis.metrics.customers && (
                  <div className="p-3 rounded-lg border bg-card">
                    <div className="text-xs text-muted-foreground mb-1">Customers</div>
                    <div className="font-semibold">{deckAnalysis.metrics.customers}</div>
                  </div>
                )}
                {deckAnalysis.metrics.growth && (
                  <div className="p-3 rounded-lg border bg-card">
                    <div className="text-xs text-muted-foreground mb-1">Growth</div>
                    <div className="font-semibold text-green-600">{deckAnalysis.metrics.growth}</div>
                  </div>
                )}
                {deckAnalysis.metrics.fundingTarget && (
                  <div className="p-3 rounded-lg border bg-card">
                    <div className="text-xs text-muted-foreground mb-1">Funding Target</div>
                    <div className="font-semibold">{deckAnalysis.metrics.fundingTarget}</div>
                  </div>
                )}
                {deckAnalysis.metrics.businessModel && (
                  <div className="p-3 rounded-lg border bg-card">
                    <div className="text-xs text-muted-foreground mb-1">Business Model</div>
                    <Badge>{deckAnalysis.metrics.businessModel}</Badge>
                  </div>
                )}
                {deckAnalysis.metrics.competitors && deckAnalysis.metrics.competitors.length > 0 && (
                  <div className="p-3 rounded-lg border bg-card">
                    <div className="text-xs text-muted-foreground mb-1">Competitors</div>
                    <div className="flex flex-wrap gap-2">
                      {deckAnalysis.metrics.competitors.map((comp: string, idx: number) => (
                        <Badge key={idx} variant="outline">
                          {comp}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Founder Information */}
      {company.founderName && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Founder
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-4">
              <img
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${company.founderName}`}
                alt={company.founderName}
                className="w-16 h-16 rounded-full border-2 border-border"
              />
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{company.founderName}</h3>
                {company.founderEmail && (
                  <p className="text-sm text-muted-foreground">{company.founderEmail}</p>
                )}
                {company.founderLinkedin && (
                  <Button variant="outline" size="sm" className="mt-3" asChild>
                    <a href={company.founderLinkedin} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3 w-3 mr-2" />
                      LinkedIn Profile
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}



      {/* Top Investor Matches */}
      {matches && matches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              Top Investor Matches
            </CardTitle>
            <CardDescription>AI-recommended investors for this company</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {matches.slice(0, 5).map((match) => (
                (() => {
                  const investor = investors?.find(inv => inv.id === match.investorId);
                  return (
                    <div
                      key={match.id}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent cursor-pointer"
                      onClick={() => (window.location.href = `/investor/${match.investorId}`)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold">
                          {match.score}
                        </div>
                        <div>
                          <div className="font-medium">
                            {investor ? investor.name : `Investor #${match.investorId}`}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {investor?.firm || investor?.stage || "Match ready"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {match.explanation?.substring(0, 80) || ""}
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        View Profile
                      </Button>
                    </div>
                  );
                })()
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

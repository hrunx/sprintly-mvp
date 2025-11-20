import { trpc } from "@/lib/trpc";
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

  const { data: company, isLoading } = trpc.companies.byId.useQuery({ id: companyId });
  const { data: matches } = trpc.matches.list.useQuery({ companyId, limit: 5 });

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

  const computeTags = () => {
    if (!company.tags) return [];
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
  };

  const tags = computeTags();

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
      <PitchDeckUpload companyId={companyId} />

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
                      <div className="font-medium">Investor #{match.investorId}</div>
                      <div className="text-xs text-muted-foreground">
                        {match.explanation?.substring(0, 60)}...
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    View Profile
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

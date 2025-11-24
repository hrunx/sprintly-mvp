import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Building2,
  MapPin,
  TrendingUp,
  DollarSign,
  ExternalLink,
  Mail,
  Globe,
  Linkedin,
  ArrowLeft,
  Network,
} from "lucide-react";
import { useLocation } from "wouter";

export default function InvestorProfile() {
  const [, params] = useRoute("/investor/:id");
  const [, setLocation] = useLocation();
  const investorId = params?.id ? parseInt(params.id) : 0;

  const { data: investor, isLoading } = trpc.investors.byId.useQuery({ id: investorId });
  const { data: connections, isLoading: connectionsLoading } = trpc.connections.list.useQuery();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-48 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!investor) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => setLocation("/search")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Search
        </Button>
        <Card>
          <CardContent className="p-12 text-center">
            <h2 className="text-2xl font-bold mb-2">Investor Not Found</h2>
            <p className="text-muted-foreground">
              The investor profile you're looking for doesn't exist.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const computeTags = () => {
    if (!investor.tags) return [];
    try {
      const parsed = typeof investor.tags === "string" ? JSON.parse(investor.tags) : investor.tags;
      if (Array.isArray(parsed)) return parsed;
      if (parsed && typeof parsed === "object") {
        return Object.values(parsed)
          .flatMap((value) => {
            if (Array.isArray(value)) return value;
            if (typeof value === "string") return value.split(",").map((tag) => tag.trim());
            return [];
          })
          .filter(Boolean);
      }
      if (typeof parsed === "string") {
        return parsed.split(",").map((tag) => tag.trim());
      }
    } catch (error) {
      console.warn("[InvestorProfile] Failed to parse tags", error);
    }
    return [];
  };

  const focusTags = Array.from(
    new Set(
      computeTags()
        .map((tag: string) => tag?.trim())
        .filter((tag: string | undefined) => !!tag),
    ),
  );
  const connectionProfile = connections?.find((c: any) => c.investorId === investorId);
  const scrapedFacts = connectionProfile?.scrapedFacts || [];
  const scrapedSummary = connectionProfile?.scrapedSummary;
  const notableInvestments = investor.notableInvestments
    ? investor.notableInvestments.split(",").map(item => item.trim()).filter(Boolean)
    : [];
  const portfolioCompanies = investor.portfolioCompanies
    ? investor.portfolioCompanies.split(",").map(item => item.trim()).filter(Boolean)
    : [];

  const avatarUrl =
    investor.avatarUrl ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(investor.name || investor.firm || "investor")}`;

  const formatMoney = (amount?: number | null) => {
    if (!amount || amount <= 0) return null;
    if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount.toLocaleString()}`;
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => setLocation("/search")}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Search
      </Button>

      {/* Header Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <img
                src={avatarUrl}
                alt={investor.name}
                className="w-24 h-24 rounded-full bg-secondary border-2 border-border"
              />
            </div>

            {/* Header Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <h1 className="text-3xl font-bold">{investor.name}</h1>
                  <div className="flex items-center gap-2 text-lg text-muted-foreground mt-2">
                    <span>{investor.title}</span>
                    {investor.firm && (
                      <>
                        <span>•</span>
                        <Building2 className="h-4 w-4" />
                        <span>{investor.firm}</span>
                      </>
                    )}
                  </div>
                </div>
                <Badge variant="secondary" className="text-lg px-4 py-1">
                  {investor.confidence}% Confidence
                </Badge>
              </div>

              {/* Quick Stats */}
              <div className="flex flex-wrap gap-4 text-sm mt-4">
                {investor.sector && (
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">{investor.sector}</span>
                    {investor.subSector && (
                      <span className="text-muted-foreground">• {investor.subSector}</span>
                    )}
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
                      {formatMoney(investor.checkSizeMin) || "N/A"}{" "}
                      {investor.checkSizeMax ? `- ${formatMoney(investor.checkSizeMax)}` : ""}
                    </span>
                  </div>
                )}
              </div>

              {/* Contact Actions */}
              <div className="flex gap-2 mt-4">
                {investor.email && (
                  <Button size="sm" asChild>
                    <a href={`mailto:${investor.email}`}>
                      <Mail className="h-3 w-3 mr-1" />
                      Email
                    </a>
                  </Button>
                )}
                {investor.linkedinUrl && (
                  <Button size="sm" variant="outline" asChild>
                    <a href={investor.linkedinUrl} target="_blank" rel="noopener noreferrer">
                      <Linkedin className="h-3 w-3 mr-1" />
                      LinkedIn
                    </a>
                  </Button>
                )}
                {investor.websiteUrl && (
                  <Button size="sm" variant="outline" asChild>
                    <a href={investor.websiteUrl} target="_blank" rel="noopener noreferrer">
                      <Globe className="h-3 w-3 mr-1" />
                      Website
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bio & Thesis */}
      <div className="grid gap-6 md:grid-cols-2">
        {investor.bio && (
          <Card>
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">{investor.bio}</p>
            </CardContent>
          </Card>
        )}

        {investor.thesis && (
          <Card>
            <CardHeader>
              <CardTitle>Investment Thesis</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">{investor.thesis}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Tags */}
      <Card>
        <CardHeader>
          <CardTitle>Focus Areas & Expertise</CardTitle>
          <CardDescription>
            {focusTags.length > 0
              ? "Submitted focus tags from this investor"
              : "No focus areas have been provided yet"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {focusTags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {focusTags.map((tag: string, idx: number) => (
                <Badge key={`${tag}-${idx}`} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No tags available</p>
          )}
        </CardContent>
      </Card>

      {/* Track Record */}
      <Card>
        <CardHeader>
          <CardTitle>Track Record</CardTitle>
          <CardDescription>Past investments and portfolio</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {portfolioCompanies.length > 0 && (
            <div>
              <div className="text-xs text-muted-foreground mb-1">Portfolio</div>
              <div className="flex flex-wrap gap-2">
                {portfolioCompanies.map((company, idx) => (
                  <Badge key={`${company}-${idx}`} variant="outline">
                    {company}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {notableInvestments.length > 0 && (
            <div>
              <div className="text-xs text-muted-foreground mb-1">Notable Investments</div>
              <div className="flex flex-wrap gap-2">
                {notableInvestments.map((item, idx) => (
                  <Badge key={`${item}-${idx}`} variant="secondary">
                    {item}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {investor.investmentCount && (
            <div className="text-sm text-muted-foreground">
              Total investments: <span className="font-semibold text-foreground">{investor.investmentCount}</span>
            </div>
          )}
          {!portfolioCompanies.length && !notableInvestments.length && !investor.investmentCount && (
            <p className="text-muted-foreground text-sm">No track record details yet.</p>
          )}
        </CardContent>
      </Card>

      {/* Enrichment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            Enrichment
          </CardTitle>
          <CardDescription>Scraped facts from the connections import</CardDescription>
        </CardHeader>
        <CardContent>
          {connectionsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : connectionProfile ? (
            <div className="space-y-3">
              {scrapedSummary && (
                <div className="p-3 rounded-lg border bg-muted/40 text-sm text-muted-foreground">
                  {scrapedSummary}
                </div>
              )}
              {scrapedFacts.length > 0 ? (
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  {scrapedFacts.map((fact: string, idx: number) => (
                    <li key={idx}>{fact}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No scraped facts captured yet.</p>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              We haven't enriched this investor from a connections upload yet.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activity Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Last interaction:{" "}
            {investor.lastInteraction
              ? new Date(investor.lastInteraction).toLocaleDateString()
              : "Never"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            Profile created on {new Date(investor.createdAt).toLocaleDateString()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

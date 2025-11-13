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
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-3xl font-bold text-white">
                {investor.name.charAt(0)}
              </div>
            </div>

            {/* Header Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <h1 className="text-3xl font-bold">{investor.name}</h1>
                  {investor.firm && (
                    <div className="flex items-center gap-2 text-lg text-muted-foreground mt-2">
                      <Building2 className="h-4 w-4" />
                      <span>{investor.firm}</span>
                    </div>
                  )}
                  {investor.type && (
                    <Badge variant="secondary" className="mt-2">
                      {investor.type}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="flex flex-wrap gap-4 text-sm mt-4">
                {investor.sector && (
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">{investor.sector}</span>
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
                {investor.linkedIn && (
                  <Button size="sm" variant="outline" asChild>
                    <a href={investor.linkedIn} target="_blank" rel="noopener noreferrer">
                      <Linkedin className="h-3 w-3 mr-1" />
                      LinkedIn
                    </a>
                  </Button>
                )}
                {investor.website && (
                  <Button size="sm" variant="outline" asChild>
                    <a href={investor.website} target="_blank" rel="noopener noreferrer">
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

      {/* Bio */}
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

      {/* Investment Criteria */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            Investment Criteria
          </CardTitle>
          <CardDescription>Focus areas and investment preferences</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {investor.sector && (
              <div>
                <div className="text-sm font-medium mb-1">Sectors</div>
                <div className="text-sm text-muted-foreground">{investor.sector}</div>
              </div>
            )}
            {investor.stage && (
              <div>
                <div className="text-sm font-medium mb-1">Stages</div>
                <div className="text-sm text-muted-foreground">{investor.stage}</div>
              </div>
            )}
            {investor.geography && (
              <div>
                <div className="text-sm font-medium mb-1">Geography</div>
                <div className="text-sm text-muted-foreground">{investor.geography}</div>
              </div>
            )}
            {(investor.checkSizeMin || investor.checkSizeMax) && (
              <div>
                <div className="text-sm font-medium mb-1">Check Size</div>
                <div className="text-sm text-muted-foreground">
                  ${(investor.checkSizeMin || 0) / 1000}K - ${(investor.checkSizeMax || 0) / 1000000}M
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Activity Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>
            Last updated: {new Date(investor.updatedAt).toLocaleDateString()}
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

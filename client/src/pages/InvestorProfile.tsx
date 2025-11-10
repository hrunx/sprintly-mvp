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
  Users,
} from "lucide-react";
import { useLocation } from "wouter";

export default function InvestorProfile() {
  const [, params] = useRoute("/investor/:id");
  const [, setLocation] = useLocation();
  const investorId = params?.id ? parseInt(params.id) : 0;

  const { data: investor, isLoading } = trpc.entities.byId.useQuery({ id: investorId });
  const { data: connections, isLoading: connectionsLoading } = trpc.entities.connections.useQuery({
    entityId: investorId,
  });

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

  const tags = investor.tags ? JSON.parse(investor.tags as string) : [];

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
                src={investor.avatarUrl || ""}
                alt={investor.name}
                className="w-24 h-24 rounded-full bg-secondary"
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
      {tags.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Focus Areas & Expertise</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag: string, idx: number) => (
                <Badge key={idx} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Network Connections */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            Network Connections
          </CardTitle>
          <CardDescription>
            {connectionsLoading
              ? "Loading connections..."
              : `${connections?.length || 0} connections in the network`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {connectionsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : connections && connections.length > 0 ? (
            <div className="space-y-3">
              {connections.slice(0, 5).map((connection) => (
                <div
                  key={connection.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">
                        Connection #{connection.sourceId === investorId ? connection.targetId : connection.sourceId}
                      </div>
                      <div className="text-sm text-muted-foreground capitalize">
                        {connection.relationshipType.replace("_", " ")}
                      </div>
                    </div>
                  </div>
                  <Badge variant="secondary">{connection.strength}% strength</Badge>
                </div>
              ))}
              {connections.length > 5 && (
                <p className="text-sm text-muted-foreground text-center pt-2">
                  And {connections.length - 5} more connections...
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No connections found in the network
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

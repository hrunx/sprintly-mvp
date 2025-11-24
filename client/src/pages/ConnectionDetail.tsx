import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Building2,
  FileText,
  Globe,
  ExternalLink,
  Link as LinkIcon,
  LucideCheckCircle2,
  Mail,
  Sparkles,
  UserCircle,
} from "lucide-react";

export default function ConnectionDetail() {
  const [, params] = useRoute("/connection/:id");
  const [, setLocation] = useLocation();
  const profileId = params?.id || "";

  const { data: profile, isLoading } = trpc.connections.byId.useQuery(
    { id: profileId },
    { enabled: Boolean(profileId) },
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => setLocation("/connections")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Connections
        </Button>
        <Card>
          <CardContent className="p-8 text-center">
            <UserCircle className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">Connection not found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const linkedCompanies = profile.linkedCompanies || [];
  const attachments = profile.attachedFiles || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" onClick={() => setLocation("/connections")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        {profile.investorId && (
          <Button variant="outline" onClick={() => setLocation(`/investor/${profile.investorId}`)}>
            View investor profile
          </Button>
        )}
        {profile.companyId && (
          <Button variant="outline" onClick={() => setLocation(`/company/${profile.companyId}`)}>
            View company
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-6 flex flex-col gap-4">
          <div className="flex items-start gap-4">
            <Avatar className="h-14 w-14">
              <AvatarFallback>{profile.fullName.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold">{profile.fullName}</h1>
                <Badge variant="secondary" className="capitalize">{profile.role}</Badge>
                <Badge variant="outline">Accuracy {profile.accuracy || 0}%</Badge>
                {profile.confidence >= 90 && (
                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
                    <LucideCheckCircle2 className="h-4 w-4 mr-1" />
                    High confidence
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground">
                {profile.title || "Unknown title"} {profile.company ? `• ${profile.company}` : ""}
              </p>
              <div className="flex gap-2 mt-3 flex-wrap">
                {profile.linkedinUrl && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={profile.linkedinUrl} target="_blank" rel="noreferrer">
                      <LinkIcon className="h-4 w-4 mr-1" />
                      LinkedIn
                    </a>
                  </Button>
                )}
                {profile.email && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={`mailto:${profile.email}`}>
                      <Mail className="h-4 w-4 mr-1" />
                      Email
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Sparkles className="h-4 w-4 text-primary" />
                Summary
              </div>
              <p className="text-muted-foreground leading-relaxed">{profile.summary}</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Globe className="h-4 w-4 text-primary" />
                Scraped insight
              </div>
              <p className="text-muted-foreground leading-relaxed">
                {profile.scrapedSummary || "No scraped summary yet"}
              </p>
              {profile.scrapeSources && profile.scrapeSources.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {profile.scrapeSources.map(source => (
                    <Badge key={source} variant="outline">
                      <a href={source} target="_blank" rel="noreferrer" className="hover:underline">
                        {source}
                      </a>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Tags & Focus</CardTitle>
            <CardDescription>LLM + scraped facts</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {(profile.tags || []).length ? (
              profile.tags!.map(tag => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))
            ) : (
              <p className="text-muted-foreground text-sm">No tags yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Scraped facts</CardTitle>
            <CardDescription>Grounded from Firecrawl scans</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {profile.scrapedFacts && profile.scrapedFacts.length ? (
              profile.scrapedFacts.map((fact, idx) => (
                <div key={`${fact}-${idx}`} className="flex items-start gap-2 text-sm">
                  <LucideCheckCircle2 className="h-4 w-4 text-primary mt-0.5" />
                  <span className="text-muted-foreground">{fact}</span>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-sm">No scraped facts captured yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Linked companies
          </CardTitle>
          <CardDescription>Multi-company detection from enrichment</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {linkedCompanies.length === 0 ? (
            <p className="text-muted-foreground text-sm">No companies detected yet.</p>
          ) : (
            linkedCompanies.map(company => (
              <div key={company.name} className="p-3 rounded-lg border flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Badge variant={company.isPrimary ? "default" : "secondary"}>
                    {company.isPrimary ? "Primary" : "Related"}
                  </Badge>
                  <span className="font-semibold">{company.name}</span>
                </div>
                <div className="text-sm text-muted-foreground flex flex-wrap gap-2">
                  {company.stage && <Badge variant="outline">Stage: {company.stage}</Badge>}
                  {company.headquarters && <Badge variant="outline">HQ: {company.headquarters}</Badge>}
                  {company.fundingRaised && (
                    <Badge variant="outline">Raised: ${company.fundingRaised?.toLocaleString()}</Badge>
                  )}
                </div>
                {company.description && <p className="text-sm text-muted-foreground">{company.description}</p>}
                {company.website && (
                  <Button variant="link" size="sm" className="px-0" asChild>
                    <a href={company.website} target="_blank" rel="noreferrer">
                      <LinkIcon className="h-3 w-3 mr-1" />
                      {company.website}
                    </a>
                  </Button>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Attachments
          </CardTitle>
          <CardDescription>Uploaded files tied to this connection</CardDescription>
        </CardHeader>
        <CardContent>
          {attachments.length === 0 ? (
            <p className="text-muted-foreground text-sm">No attachments yet.</p>
          ) : (
            <ul className="space-y-2">
              {attachments.map(file => (
                <li key={file.id} className="flex items-center justify-between text-sm">
                  <span className="truncate">{file.name}</span>
                  <Button variant="ghost" size="sm" asChild>
                    <a href={file.url} target="_blank" rel="noreferrer">
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Open
                    </a>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

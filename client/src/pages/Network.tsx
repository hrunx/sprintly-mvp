import { useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Network as NetworkIcon, Users, Building2, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Network() {
  const { data: sectorDistribution, isLoading: sectorsLoading } =
    trpc.analytics.sectorDistribution.useQuery();
  const { data: analytics, isLoading: analyticsLoading } = trpc.analytics.overview.useQuery();
  const { data: recentActivity } = trpc.analytics.recentActivity.useQuery();
  const { data: topEntities } = trpc.analytics.topEntities.useQuery();
  const { data: matches, isLoading: matchesLoading } = trpc.matches.list.useQuery({ limit: 200 });
  const { data: companies, isLoading: companiesLoading } = trpc.companies.list.useQuery({ limit: 200 });
  const { data: investors, isLoading: investorsLoading } = trpc.investors.list.useQuery({ limit: 200 });

  const companyMap = useMemo(
    () => new Map((companies || []).map(company => [company.id, company])),
    [companies],
  );
  const investorMap = useMemo(
    () => new Map((investors || []).map(investor => [investor.id, investor])),
    [investors],
  );

  const filteredMatches = matches || [];

  const totalCompanies = analytics?.totalCompanies || companies?.length || 0;
  const totalInvestors = analytics?.totalInvestors || investors?.length || 0;
  const totalMatches = analytics?.totalMatches || filteredMatches.length || 0;

  const density =
    totalMatches && totalCompanies + totalInvestors > 1
      ? (
          (totalMatches /
            ((totalCompanies + totalInvestors) * (totalCompanies + totalInvestors - 1))) *
          100
        ).toFixed(1)
      : "0.0";

  const avgConnections =
    totalCompanies + totalInvestors > 0
      ? Math.round(totalMatches / (totalCompanies + totalInvestors))
      : 0;

  const matchRate =
    totalCompanies && totalInvestors
      ? ((totalMatches / (totalCompanies * totalInvestors)) * 100).toFixed(1)
      : "0.0";

  const sectorData = sectorDistribution || [];
  const sectorTotal = useMemo(
    () => sectorData.reduce((sum, item: any) => sum + Number((item as any).count || 0), 0),
    [sectorData],
  );

  const activity = useMemo(() => recentActivity ?? null, [recentActivity]);

  const topInvestors = topEntities?.investors || [];
  const topCompanies = topEntities?.companies || [];
  const activityFeed = activity ?? recentActivity;

  const isLoading =
    sectorsLoading ||
    analyticsLoading ||
    matchesLoading ||
    companiesLoading ||
    investorsLoading;

  const displayedMatches = filteredMatches.slice(0, 50);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <NetworkIcon className="h-8 w-8 text-primary" />
          Network Intelligence
        </h1>
        <p className="text-muted-foreground mt-2">
          Explore your ecosystem connections and sector distribution
        </p>
      </div>

      {/* Network Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Network Density</CardTitle>
            <NetworkIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {density}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">Connection ratio</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Connections</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {avgConnections}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Per entity</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Match Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {matchRate}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">Founder-investor pairs</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sector Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Sector Distribution</CardTitle>
          <CardDescription>
            Breakdown of founders by sector in your network
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : sectorData && sectorData.length > 0 ? (
            <div className="space-y-4">
              {sectorData.map((item) => {
                const percentage = (
                  (Number((item as any).count) / Math.max(sectorTotal, 1)) *
                  100
                ).toFixed(1);

                return (
                  <div key={(item as any).sector} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-primary" />
                        <span className="font-medium">{(item as any).sector}</span>
                        <Badge variant="secondary">{(item as any).count} founders</Badge>
                      </div>
                      <span className="text-sm font-semibold text-muted-foreground">
                        {percentage}%
                      </span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No sector data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Network Visualization */}
      <Card>
        <CardHeader>
          <CardTitle>Network Graph</CardTitle>
          <CardDescription>
            Top matches across your database
          </CardDescription>
        </CardHeader>
        <CardContent>
          {displayedMatches.length > 0 ? (
            <div className="space-y-3">
              {displayedMatches.map(match => {
                const company = companyMap.get(match.companyId);
                const investor = investorMap.get(match.investorId);
                return (
                  <div
                    key={match.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:border-primary transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{match.score}</Badge>
                      <div>
                        <div className="font-medium">
                          {company?.name || `Company #${match.companyId}`}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          ↔ {investor?.name || `Investor #${match.investorId}`}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground text-right">
                      {company?.sector || investor?.sector
                        ? `${company?.sector || "Sector"} • ${investor?.sector || "Thesis"}`
                        : "Match from database"}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="aspect-video rounded-lg border-2 border-dashed flex items-center justify-center bg-muted/40 text-sm text-muted-foreground text-center px-6">
              No matches yet. Import companies and investors, then run matching to populate this graph.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Network Insights */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Connected Entities</CardTitle>
            <CardDescription>Most influential nodes in your network</CardDescription>
          </CardHeader>
          <CardContent>
            {topInvestors.length > 0 || topCompanies.length > 0 ? (
              <div className="space-y-3">
                {topInvestors.map(entity => (
                  <div
                    key={`inv-${entity?.id}`}
                    className="flex items-center justify-between p-3 rounded-lg border hover:border-primary transition-colors"
                  >
                    <div>
                      <div className="font-medium">{entity?.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {entity?.title || "Investor"} • {entity?.firm || "Firm unknown"}
                      </div>
                    </div>
                    <Badge variant="secondary">{entity?.connections} matches</Badge>
                  </div>
                ))}
                {topCompanies.map(entity => (
                  <div
                    key={`co-${entity?.id}`}
                    className="flex items-center justify-between p-3 rounded-lg border hover:border-primary transition-colors"
                  >
                    <div>
                      <div className="font-medium">{entity?.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {entity?.sector || "Sector"} • {entity?.stage || "Stage"}
                      </div>
                    </div>
                    <Badge variant="secondary">{entity?.connections} matches</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                This view will populate after real network data is ingested from your CSV and matches are generated.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest network updates and connections</CardDescription>
          </CardHeader>
          <CardContent>
            {activityFeed && (activityFeed.matches.length > 0 || activityFeed.companies.length > 0) ? (
              <div className="space-y-4">
                {activityFeed.matches.map(item => (
                  <div key={`match-${item.id}`} className="flex items-start gap-3 pb-3 border-b last:border-0">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">
                        Match created • Score {item.score}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Company #{item.companyId} ↔ Investor #{item.investorId}
                      </div>
                    </div>
                  </div>
                ))}
                {activityFeed.companies.map(item => (
                  <div key={`company-${item.id}`} className="flex items-start gap-3 pb-3 border-b last:border-0">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">Company imported</div>
                      <div className="text-xs text-muted-foreground">
                        {item.name} • {item.sector || "Sector"} • {item.stage || "Stage"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                Activity feed will appear after real connections and matches are created.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

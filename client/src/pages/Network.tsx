import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Network as NetworkIcon, Users, Building2, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Network() {
  const { data: sectorDistribution, isLoading: sectorsLoading } =
    trpc.analytics.sectorDistribution.useQuery();
  const { data: analytics, isLoading: analyticsLoading } = trpc.analytics.overview.useQuery();

  const isLoading = sectorsLoading || analyticsLoading;

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
                  {analytics?.totalMatches && analytics?.totalCompanies && analytics?.totalInvestors
                    ? (
                        (analytics.totalMatches /
                          ((analytics.totalCompanies + analytics.totalInvestors) *
                            (analytics.totalCompanies + analytics.totalInvestors - 1))) *
                        100
                      ).toFixed(1)
                    : 0}
                  %
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
                  {analytics?.totalMatches && analytics?.totalCompanies && analytics?.totalInvestors
                    ? Math.round(
                        analytics.totalMatches / (analytics.totalCompanies + analytics.totalInvestors)
                      )
                    : 0}
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
                  {analytics?.totalMatches && analytics?.totalCompanies && analytics?.totalInvestors
                    ? ((analytics.totalMatches / (analytics.totalCompanies * analytics.totalInvestors)) * 100).toFixed(
                        1
                      )
                    : 0}
                  %
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
          {sectorsLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : sectorDistribution && sectorDistribution.length > 0 ? (
            <div className="space-y-4">
              {sectorDistribution.map((item) => {
                const total = sectorDistribution.reduce((sum, s) => sum + Number(s.count), 0);
                const percentage = ((Number(item.count) / total) * 100).toFixed(1);

                return (
                  <div key={item.sector} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-primary" />
                        <span className="font-medium">{item.sector}</span>
                        <Badge variant="secondary">{item.count} founders</Badge>
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

      {/* Network Visualization Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Network Graph</CardTitle>
          <CardDescription>
            Interactive visualization of your founder-investor network
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="aspect-video bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 rounded-lg flex items-center justify-center border-2 border-dashed">
            <div className="text-center space-y-4">
              <NetworkIcon className="h-16 w-16 mx-auto text-primary opacity-50" />
              <div>
                <h3 className="font-semibold text-lg mb-2">Interactive Network Graph</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  Visualize connections between founders, investors, and enablers with an
                  interactive force-directed graph. Click nodes to explore relationships and
                  discover intro paths.
                </p>
              </div>
              <Badge variant="secondary" className="mt-4">
                Coming Soon
              </Badge>
            </div>
          </div>
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
            <div className="text-sm text-muted-foreground">
              This view will populate after real network data is ingested from your CSV and matches are generated.
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest network updates and connections</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              Activity feed will appear after real connections and matches are created.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

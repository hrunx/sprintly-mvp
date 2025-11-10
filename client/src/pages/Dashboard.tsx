import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building2, Network, Target, TrendingUp, Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { data: analytics, isLoading } = trpc.analytics.overview.useQuery();

  const stats = [
    {
      title: "Total Companies",
      value: analytics?.totalCompanies || 0,
      icon: Building2,
      description: "Companies seeking funding",
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950",
    },
    {
      title: "Total Investors",
      value: analytics?.totalInvestors || 0,
      icon: Users,
      description: "Active investors",
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950",
    },
    {
      title: "Smart Matches",
      value: analytics?.totalMatches || 0,
      icon: Target,
      description: "AI-generated matches",
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950",
    },
    {
      title: "Avg Match Score",
      value: `${analytics?.avgMatchScore || 0}%`,
      icon: TrendingUp,
      description: "Match quality",
      color: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-950",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Welcome to your AI-powered matchmaking platform
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white">
          <Sparkles className="h-5 w-5" />
          <span className="font-semibold">AI Powered</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <div className="text-2xl font-bold">{stat.value.toLocaleString()}</div>
                )}
                <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Performance Metrics */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Match Quality
            </CardTitle>
            <CardDescription>Average matching score across all recommendations</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-16 w-full" />
            ) : (
              <div className="space-y-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold">{analytics?.avgMatchScore || 0}%</span>
                  <span className="text-sm text-muted-foreground">confidence score</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all"
                    style={{ width: `${analytics?.avgMatchScore || 0}%` }}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Based on sector alignment, stage fit, and network proximity
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Get started with these common tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <a
              href="/search"
              className="block p-4 rounded-lg border hover:border-primary hover:bg-accent/50 transition-all cursor-pointer"
            >
              <div className="font-semibold">Browse Companies</div>
              <div className="text-sm text-muted-foreground">
                Discover companies seeking funding
              </div>
            </a>
            <a
              href="/matches"
              className="block p-4 rounded-lg border hover:border-primary hover:bg-accent/50 transition-all cursor-pointer"
            >
              <div className="font-semibold">View Top Matches</div>
              <div className="text-sm text-muted-foreground">
                See AI-recommended investor matches
              </div>
            </a>
            <a
              href="/network"
              className="block p-4 rounded-lg border hover:border-primary hover:bg-accent/50 transition-all cursor-pointer"
            >
              <div className="font-semibold">Explore Network</div>
              <div className="text-sm text-muted-foreground">
                Visualize your connection graph
              </div>
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

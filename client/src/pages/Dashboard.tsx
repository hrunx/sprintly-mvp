import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Building2, Users, Target } from "lucide-react";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { data: analytics, isLoading } = trpc.analytics.overview.useQuery();

  const stats = [
    {
      title: "Total Companies",
      value: analytics?.totalCompanies || 0,
      description: "Companies seeking funding",
      icon: Building2,
      color: "text-blue-600",
    },
    {
      title: "Total Investors",
      value: analytics?.totalInvestors || 0,
      description: "Active investors",
      icon: Users,
      color: "text-purple-600",
    },
    {
      title: "Smart Matches",
      value: analytics?.totalMatches || 0,
      description: "AI-generated matches",
      icon: Target,
      color: "text-green-600",
    },
    {
      title: "Avg Match Score",
      value: `${analytics?.avgMatchScore || 0}%`,
      description: "Match quality",
      icon: TrendingUp,
      color: "text-orange-600",
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to your AI-powered matchmaking platform
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4 rounded-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to your AI-powered matchmaking platform
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Match Quality Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Match Quality
            </CardTitle>
            <CardDescription>Average matching score across all recommendations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-4xl font-bold">{analytics?.avgMatchScore || 0}%</div>
                <div className="text-sm text-muted-foreground">confidence score</div>
              </div>
              <div className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 h-2 rounded-full" />
              <p className="text-sm text-muted-foreground">
                Based on sector alignment, stage fit, and network proximity
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions Card */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Get started with these common tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link
              href="/search"
              className="block p-4 rounded-lg border hover:border-primary hover:bg-accent/50 transition-all cursor-pointer"
            >
              <div className="font-semibold">Browse Companies</div>
              <div className="text-sm text-muted-foreground">
                Discover companies seeking funding
              </div>
            </Link>
            <Link
              href="/matches"
              className="block p-4 rounded-lg border hover:border-primary hover:bg-accent/50 transition-all cursor-pointer"
            >
              <div className="font-semibold">View Top Matches</div>
              <div className="text-sm text-muted-foreground">
                See AI-recommended investor matches
              </div>
            </Link>
            <Link
              href="/network"
              className="block p-4 rounded-lg border hover:border-primary hover:bg-accent/50 transition-all cursor-pointer"
            >
              <div className="font-semibold">Explore Network</div>
              <div className="text-sm text-muted-foreground">
                Visualize your connection graph
              </div>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

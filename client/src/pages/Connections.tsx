import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, Linkedin, Mail, FolderOpen, Zap, TrendingUp, Users } from "lucide-react";

const connections = [
  {
    id: "linkedin",
    name: "LinkedIn",
    icon: Linkedin,
    status: "active",
    description: "Import companies and investors from LinkedIn Sales Navigator and Recruiter exports",
    features: [
      "Bulk company import from CSV",
      "Investor profile import",
      "Automatic data mapping",
      "Real-time validation"
    ],
    color: "bg-blue-500",
    connected: true
  },
  {
    id: "gmail",
    name: "Gmail API",
    icon: Mail,
    status: "coming_soon",
    description: "Analyze email conversations to discover warm introductions and relationship strength",
    features: [
      "Email intelligence analysis",
      "Intro path discovery",
      "Relationship scoring",
      "Auto-detect connections"
    ],
    color: "bg-red-500",
    connected: false
  },
  {
    id: "gdrive",
    name: "Google Drive",
    icon: FolderOpen,
    status: "coming_soon",
    description: "Automatically analyze pitch decks and extract key metrics, traction data, and market insights",
    features: [
      "AI pitch deck analysis",
      "Auto-extract metrics",
      "Market size detection",
      "Competitive analysis"
    ],
    color: "bg-green-500",
    connected: false
  }
];

const benefits = [
  {
    icon: Zap,
    title: "No-Code Integration",
    description: "Connect external data sources with just a few clicks. No technical knowledge required."
  },
  {
    icon: TrendingUp,
    title: "AI-Powered Analysis",
    description: "Automatically extract insights from your data using advanced AI and machine learning."
  },
  {
    icon: Users,
    title: "Network Intelligence",
    description: "Discover hidden connections and warm introduction paths across your network."
  }
];

export default function Connections() {
  return (
    <div className="container py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Connections</h1>
        <p className="text-muted-foreground">
          Connect external data sources to supercharge your matchmaking with AI-powered insights
        </p>
      </div>

      {/* Benefits Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {benefits.map((benefit) => (
          <Card key={benefit.title} className="border-2">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <benefit.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Connections Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {connections.map((connection) => {
          const Icon = connection.icon;
          const isActive = connection.status === "active";
          const isComingSoon = connection.status === "coming_soon";

          return (
            <Card key={connection.id} className="relative overflow-hidden border-2 hover:shadow-lg transition-shadow">
              {/* Status Badge */}
              <div className="absolute top-4 right-4 z-10">
                {isActive ? (
                  <Badge className="bg-green-500 hover:bg-green-600">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Active
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="bg-orange-100 text-orange-700 hover:bg-orange-200">
                    <Clock className="w-3 h-3 mr-1" />
                    Coming Soon
                  </Badge>
                )}
              </div>

              <CardHeader>
                <div className="flex items-center gap-4 mb-2">
                  <div className={`p-3 rounded-xl ${connection.color} text-white`}>
                    <Icon className="w-8 h-8" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">{connection.name}</CardTitle>
                  </div>
                </div>
                <CardDescription className="text-sm leading-relaxed">
                  {connection.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Features List */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Features:</p>
                  <ul className="space-y-1.5">
                    {connection.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Action Button */}
                {isActive ? (
                  <Button 
                    className="w-full" 
                    onClick={() => window.location.href = '/import'}
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Use Connection
                  </Button>
                ) : (
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    disabled
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    Coming Soon
                  </Button>
                )}
              </CardContent>

              {/* Decorative gradient overlay for coming soon items */}
              {isComingSoon && (
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-muted/20 pointer-events-none" />
              )}
            </Card>
          );
        })}
      </div>

      {/* Info Card */}
      <Card className="mt-8 border-2 border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-2">More Integrations Coming Soon!</h3>
              <p className="text-sm text-muted-foreground mb-4">
                We're constantly adding new data sources and integrations to make your matchmaking even more powerful. 
                Stay tuned for updates on Salesforce, HubSpot, AngelList, and more!
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">Salesforce</Badge>
                <Badge variant="outline">HubSpot</Badge>
                <Badge variant="outline">AngelList</Badge>
                <Badge variant="outline">Crunchbase</Badge>
                <Badge variant="outline">PitchBook</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

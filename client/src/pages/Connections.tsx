import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Clock,
  Zap,
  TrendingUp,
  Users,
  RefreshCcw,
  Upload,
  Database,
  Rocket,
  Link as LinkIcon,
  FileUp,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const benefits = [
  {
    icon: Zap,
    title: "No-Code Integration",
    description: "Connect external data sources with just a few clicks. No technical knowledge required.",
  },
  {
    icon: TrendingUp,
    title: "AI-Powered Analysis",
    description: "Automatically enrich people and companies with LLM research and confidence scores.",
  },
  {
    icon: Users,
    title: "Network Intelligence",
    description: "Discover who is an investor vs. founder and push them straight into the matchmaking engine.",
  },
];

function formatConfidence(value?: number | null) {
  if (!value && value !== 0) return "N/A";
  return `${Math.round(value)}%`;
}

export default function Connections() {
  const [csvData, setCsvData] = useState<string>("");
  const { data: profiles = [], isLoading, refetch } = trpc.connections.list.useQuery();

  const syncMutation = trpc.connections.syncLinkedIn.useMutation({
    onSuccess: (res) => {
      toast.success(`Synced ${res.imported} profiles`, {
        description: `Investors added: ${res.db.investorsAdded}, Companies added: ${res.db.companiesAdded}`,
      });
      refetch();
    },
    onError: (error) => toast.error(error.message || "Failed to sync LinkedIn export"),
  });

  const refreshMutation = trpc.connections.refreshProfile.useMutation({
    onSuccess: () => {
      toast.success("Profile refreshed");
      refetch();
    },
    onError: (error) => toast.error(error.message || "Failed to refresh profile"),
  });

  const uploadMutation = trpc.connections.uploadAttachment.useMutation({
    onSuccess: () => {
      toast.success("File attached");
      refetch();
    },
    onError: (error) => toast.error(error.message || "Failed to attach file"),
  });

  const ingestCsvMutation = trpc.connections.ingestCsv.useMutation({
    onSuccess: (res) => {
      toast.success(`Processed ${res.imported} contacts from upload`, {
        description: `Investors added: ${res.db.investorsAdded}, Companies added: ${res.db.companiesAdded}`,
      });
      setCsvData("");
      refetch();
    },
    onError: (error) => toast.error(error.message || "Failed to process CSV"),
  });

  const pushMutation = trpc.connections.pushToMatching.useMutation({
    onSuccess: (res) => {
      toast.success("Sent to matching engine", {
        description: `Matches generated: ${res.db.matchesGenerated}`,
      });
      refetch();
    },
    onError: (error) => toast.error(error.message || "Failed to push to matching"),
  });

  const orderedProfiles = useMemo(
    () =>
      [...profiles].sort((a, b) => (b.accuracy || 0) - (a.accuracy || 0)),
    [profiles],
  );

  const handleCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCsvData(reader.result as string);
    };
    reader.readAsText(file);
  };

  const handleUpload = (id: string) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "*/*";
    input.onchange = async event => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const data = reader.result as string;
        uploadMutation.mutate({
          id,
          fileName: file.name,
          mimeType: file.type || "application/octet-stream",
          dataBase64: data,
        });
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  return (
    <div className="container py-8 max-w-7xl space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Connections</h1>
          <p className="text-muted-foreground">
            Import LinkedIn connections, enrich them with AI, and push investors & founders into matchmaking.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => syncMutation.mutate({ limit: 20 })}
            disabled={syncMutation.isPending}
            className="gap-2"
          >
            {syncMutation.isPending ? <Clock className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
            Sync first 20 from CSV
          </Button>
          <Button variant="outline" onClick={() => refetch()} className="gap-2" disabled={isLoading}>
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      <Card className="border-2">
        <CardHeader>
          <CardTitle>Upload LinkedIn CSV</CardTitle>
          <CardDescription>Drop your LinkedIn connections export to auto-enrich and push into matching.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="border-2 border-dashed rounded-lg p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <FileUp className="h-5 w-5 text-primary" />
              <div>
                <p className="font-semibold">Upload CSV</p>
                <p className="text-sm text-muted-foreground">Supports the standard LinkedIn connections export.</p>
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-2">
              <input type="file" accept=".csv" onChange={handleCsvUpload} className="hidden" id="connection-upload" />
              <label htmlFor="connection-upload">
                <Button variant="outline" asChild>
                  <span>Choose CSV</span>
                </Button>
              </label>
              <Button
                onClick={() => ingestCsvMutation.mutate({ csvData, limit: 20 })}
                disabled={!csvData || ingestCsvMutation.isPending}
              >
                {ingestCsvMutation.isPending ? <Clock className="h-4 w-4 animate-spin mr-2" /> : <Rocket className="h-4 w-4 mr-2" />}
                Process uploaded CSV
              </Button>
            </div>
          </div>
          {csvData && (
            <p className="text-xs text-muted-foreground">
              Loaded file with {csvData.split("\n").length - 1} rows. Click “Process uploaded CSV” to enrich and sync.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {benefits.map(benefit => (
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

      <Card className="border-2 border-primary/20 bg-primary/5">
        <CardContent className="pt-6 flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <Database className="h-5 w-5 text-primary" />
            <div>
              <p className="font-semibold">LinkedIn export detected</p>
              <p className="text-sm text-muted-foreground">
                The backend reads `/Connections.csv` (first 20 rows) and enriches each person with LLM + heuristics.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">Investors mapped: {profiles.filter(p => p.role === "investor").length}</Badge>
            <Badge variant="outline">Founders mapped: {profiles.filter(p => p.role === "founder").length}</Badge>
            <Badge variant="outline">Awaiting files: {profiles.filter(p => !p.attachedFiles?.length).length}</Badge>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <Card>
          <CardContent className="p-6 text-muted-foreground">Loading connections…</CardContent>
        </Card>
      ) : orderedProfiles.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center space-y-3">
            <h3 className="text-xl font-semibold">No profiles yet</h3>
            <p className="text-sm text-muted-foreground">
              Click “Sync first 20 from CSV” to import the LinkedIn export automatically.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {orderedProfiles.map(profile => (
            <Card key={profile.id} className="border-2 hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-xl">{profile.fullName}</CardTitle>
                  <CardDescription className="text-sm">
                    {profile.title || "No title"} {profile.company ? `• ${profile.company}` : ""}
                  </CardDescription>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant="secondary" className="capitalize">{profile.role}</Badge>
                    <Badge variant="outline">Accuracy {formatConfidence(profile.accuracy)}</Badge>
                    <Badge variant="outline">
                      {profile.matchStatus === "matched" ? "Matches ready" : "Pending matchmaking"}
                    </Badge>
                  </div>
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  <p>Confidence: {formatConfidence(profile.confidence)}</p>
                  {profile.lastEnrichedAt && <p>Updated {new Date(profile.lastEnrichedAt).toLocaleDateString()}</p>}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {profile.summary}
                </p>

                <div className="flex flex-wrap gap-2 text-xs">
                  {profile.sector && <Badge variant="outline">Sector: {profile.sector}</Badge>}
                  {profile.stage && <Badge variant="outline">Stage: {profile.stage}</Badge>}
                  {profile.geography && <Badge variant="outline">Geo: {profile.geography}</Badge>}
                </div>

                <div className="flex flex-wrap gap-2">
                  {profile.tags?.slice(0, 6).map(tag => (
                    <Badge key={tag} variant="outline">{tag}</Badge>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2">
                  {profile.linkedinUrl && (
                    <Button asChild variant="outline" size="sm">
                      <a href={profile.linkedinUrl} target="_blank" rel="noreferrer">
                        <LinkIcon className="h-4 w-4 mr-2" />
                        LinkedIn
                      </a>
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="secondary"
                    className="gap-1"
                    onClick={() => handleUpload(profile.id)}
                    disabled={uploadMutation.isPending}
                  >
                    <Upload className="h-4 w-4" />
                    Upload file
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="gap-1"
                    onClick={() => refreshMutation.mutate({ id: profile.id })}
                    disabled={refreshMutation.isPending}
                  >
                    <RefreshCcw className="h-4 w-4" />
                    Re-enrich
                  </Button>
                  <Button
                    size="sm"
                    className="gap-1"
                    onClick={() => pushMutation.mutate({ id: profile.id })}
                    disabled={pushMutation.isPending}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Push to matching
                  </Button>
                </div>

                {profile.attachedFiles?.length ? (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Attached files</p>
                    <ul className="space-y-1">
                      {profile.attachedFiles.map(file => (
                        <li key={file.id} className="flex items-center justify-between text-sm">
                          <span className="truncate">{file.name}</span>
                          <a
                            href={file.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary text-xs"
                          >
                            View
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

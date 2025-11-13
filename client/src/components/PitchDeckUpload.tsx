import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileText, Sparkles, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ExtractedMetrics {
  revenue?: string;
  teamSize?: number;
  marketSize?: string;
  customers?: number;
  growth?: string;
  fundingTarget?: string;
  businessModel?: string;
  competitors?: string[];
}

interface PitchDeckUploadProps {
  companyId: number;
  onSuccess?: (metrics: ExtractedMetrics) => void;
}

export function PitchDeckUpload({ companyId, onSuccess }: PitchDeckUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [extractedMetrics, setExtractedMetrics] = useState<ExtractedMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.type !== "application/pdf") {
      setError("Please upload a PDF file");
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError("File size must be less than 10MB");
      return;
    }

    setFile(selectedFile);
    setError(null);
  };

  const simulateAnalysis = async () => {
    // Simulate AI analysis steps
    const steps = [
      { progress: 20, message: "Uploading pitch deck..." },
      { progress: 40, message: "Extracting text from PDF..." },
      { progress: 60, message: "AI analyzing business metrics..." },
      { progress: 80, message: "Identifying key data points..." },
      { progress: 100, message: "Analysis complete!" },
    ];

    for (const step of steps) {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setProgress(step.progress);
      toast.info(step.message);
    }

    // Simulated extracted metrics
    const mockMetrics: ExtractedMetrics = {
      revenue: "$2.5M ARR",
      teamSize: 15,
      marketSize: "$50B TAM",
      customers: 150,
      growth: "300% YoY",
      fundingTarget: "$5M",
      businessModel: "B2B SaaS",
      competitors: ["Competitor A", "Competitor B", "Competitor C"],
    };

    setExtractedMetrics(mockMetrics);
    if (onSuccess) {
      onSuccess(mockMetrics);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setAnalyzing(true);
    setProgress(0);
    setError(null);

    try {
      await simulateAnalysis();
      toast.success("Pitch deck analyzed successfully!");
    } catch (err: any) {
      setError(err.message || "Failed to analyze pitch deck");
      toast.error("Analysis failed");
    } finally {
      setUploading(false);
      setAnalyzing(false);
    }
  };

  const resetUpload = () => {
    setFile(null);
    setProgress(0);
    setExtractedMetrics(null);
    setError(null);
  };

  return (
    <Card className="border-2 border-dashed">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <CardTitle>AI Pitch Deck Analysis</CardTitle>
        </div>
        <CardDescription>
          Upload your pitch deck and let AI extract key metrics automatically
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!extractedMetrics ? (
          <>
            {/* File Upload */}
            <div className="flex items-center gap-4">
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className="hidden"
                id="pitch-deck-upload"
                disabled={uploading}
              />
              <label
                htmlFor="pitch-deck-upload"
                className="flex-1 flex items-center justify-center gap-2 p-8 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent transition-colors"
              >
                <Upload className="h-6 w-6 text-muted-foreground" />
                <div className="text-center">
                  <p className="font-medium">
                    {file ? file.name : "Click to upload pitch deck"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PDF format, max 10MB
                  </p>
                </div>
              </label>
            </div>

            {/* Upload Button */}
            {file && !uploading && (
              <div className="flex gap-2">
                <Button onClick={handleUpload} className="flex-1">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Analyze with AI
                </Button>
                <Button variant="outline" onClick={resetUpload}>
                  Cancel
                </Button>
              </div>
            )}

            {/* Progress */}
            {uploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Analyzing...</span>
                  <span className="font-medium">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>AI is extracting metrics from your pitch deck</span>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </>
        ) : (
          <>
            {/* Success State */}
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Successfully extracted {Object.keys(extractedMetrics).length} key metrics from your
                pitch deck!
              </AlertDescription>
            </Alert>

            {/* Extracted Metrics */}
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Extracted Metrics
              </h4>

              <div className="grid grid-cols-2 gap-3">
                {extractedMetrics.revenue && (
                  <div className="p-3 rounded-lg border bg-card">
                    <div className="text-xs text-muted-foreground mb-1">Revenue</div>
                    <div className="font-semibold">{extractedMetrics.revenue}</div>
                  </div>
                )}

                {extractedMetrics.teamSize && (
                  <div className="p-3 rounded-lg border bg-card">
                    <div className="text-xs text-muted-foreground mb-1">Team Size</div>
                    <div className="font-semibold">{extractedMetrics.teamSize} people</div>
                  </div>
                )}

                {extractedMetrics.marketSize && (
                  <div className="p-3 rounded-lg border bg-card">
                    <div className="text-xs text-muted-foreground mb-1">Market Size</div>
                    <div className="font-semibold">{extractedMetrics.marketSize}</div>
                  </div>
                )}

                {extractedMetrics.customers && (
                  <div className="p-3 rounded-lg border bg-card">
                    <div className="text-xs text-muted-foreground mb-1">Customers</div>
                    <div className="font-semibold">{extractedMetrics.customers}</div>
                  </div>
                )}

                {extractedMetrics.growth && (
                  <div className="p-3 rounded-lg border bg-card">
                    <div className="text-xs text-muted-foreground mb-1">Growth Rate</div>
                    <div className="font-semibold text-green-600">{extractedMetrics.growth}</div>
                  </div>
                )}

                {extractedMetrics.fundingTarget && (
                  <div className="p-3 rounded-lg border bg-card">
                    <div className="text-xs text-muted-foreground mb-1">Funding Target</div>
                    <div className="font-semibold">{extractedMetrics.fundingTarget}</div>
                  </div>
                )}
              </div>

              {extractedMetrics.businessModel && (
                <div className="p-3 rounded-lg border bg-card">
                  <div className="text-xs text-muted-foreground mb-1">Business Model</div>
                  <Badge>{extractedMetrics.businessModel}</Badge>
                </div>
              )}

              {extractedMetrics.competitors && extractedMetrics.competitors.length > 0 && (
                <div className="p-3 rounded-lg border bg-card">
                  <div className="text-xs text-muted-foreground mb-2">Competitors Mentioned</div>
                  <div className="flex flex-wrap gap-2">
                    {extractedMetrics.competitors.map((comp, idx) => (
                      <Badge key={idx} variant="outline">
                        {comp}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button className="flex-1">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Apply to Profile
              </Button>
              <Button variant="outline" onClick={resetUpload}>
                Upload Another
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

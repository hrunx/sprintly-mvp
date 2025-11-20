import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sliders,
  Save,
  RotateCcw,
  Download,
  Upload,
  Sparkles,
  TrendingUp,
  Target,
  MapPin,
  DollarSign,
  Building2,
  FileText,
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { MatchPreview } from "@/components/MatchPreview";

interface MatchingConfig {
  weights: {
    sector: number;
    stage: number;
    geography: number;
    traction: number;
    checkSize: number;
    thesis: number;
  };
  filters: {
    minRevenue: number;
    minTeamSize: number;
    requirePitchDeck: boolean;
    requireTraction: boolean;
  };
  thresholds: {
    minMatchScore: number;
    minSectorScore: number;
    minStageScore: number;
  };
}

const DEFAULT_CONFIG: MatchingConfig = {
  weights: {
    sector: 25,
    stage: 20,
    geography: 10,
    traction: 20,
    checkSize: 15,
    thesis: 10,
  },
  filters: {
    minRevenue: 0,
    minTeamSize: 0,
    requirePitchDeck: false,
    requireTraction: false,
  },
  thresholds: {
    minMatchScore: 50,
    minSectorScore: 60,
    minStageScore: 50,
  },
};

const PRESETS = {
  conservative: {
    name: "Conservative",
    description: "High-quality matches only, strict criteria",
    config: {
      weights: {
        sector: 30,
        stage: 25,
        geography: 10,
        traction: 20,
        checkSize: 10,
        thesis: 5,
      },
      filters: {
        minRevenue: 500000,
        minTeamSize: 5,
        requirePitchDeck: true,
        requireTraction: true,
      },
      thresholds: {
        minMatchScore: 70,
        minSectorScore: 80,
        minStageScore: 75,
      },
    },
  },
  balanced: {
    name: "Balanced",
    description: "Good balance between quality and quantity",
    config: DEFAULT_CONFIG,
  },
  aggressive: {
    name: "Aggressive",
    description: "Maximum matches, lower thresholds",
    config: {
      weights: {
        sector: 20,
        stage: 15,
        geography: 15,
        traction: 15,
        checkSize: 20,
        thesis: 15,
      },
      filters: {
        minRevenue: 0,
        minTeamSize: 0,
        requirePitchDeck: false,
        requireTraction: false,
      },
      thresholds: {
        minMatchScore: 40,
        minSectorScore: 40,
        minStageScore: 40,
      },
    },
  },
};

export default function Settings() {
  const [config, setConfig] = useState<MatchingConfig>(DEFAULT_CONFIG);
  const [selectedPreset, setSelectedPreset] = useState<string>("balanced");
  const [hasChanges, setHasChanges] = useState(false);

  const { data: savedConfig, isLoading } = trpc.settings.getMatchingConfig.useQuery();
  const saveConfigMutation = trpc.settings.saveMatchingConfig.useMutation();
  const resetDatabaseMutation = trpc.system.factoryResetData.useMutation();

  useEffect(() => {
    if (savedConfig) {
      setConfig(savedConfig);
    }
  }, [savedConfig]);

  const updateWeight = (key: keyof MatchingConfig["weights"], value: number) => {
    setConfig((prev) => ({
      ...prev,
      weights: { ...prev.weights, [key]: value },
    }));
    setHasChanges(true);
  };

  const updateFilter = (key: keyof MatchingConfig["filters"], value: any) => {
    setConfig((prev) => ({
      ...prev,
      filters: { ...prev.filters, [key]: value },
    }));
    setHasChanges(true);
  };

  const updateThreshold = (key: keyof MatchingConfig["thresholds"], value: number) => {
    setConfig((prev) => ({
      ...prev,
      thresholds: { ...prev.thresholds, [key]: value },
    }));
    setHasChanges(true);
  };

  const applyPreset = (presetKey: keyof typeof PRESETS) => {
    setConfig(PRESETS[presetKey].config);
    setSelectedPreset(presetKey);
    setHasChanges(true);
    toast.success(`Applied ${PRESETS[presetKey].name} preset`);
  };

  const saveConfig = async () => {
    try {
      await saveConfigMutation.mutateAsync(config);
      setHasChanges(false);
      toast.success("Configuration saved successfully!");
    } catch (error) {
      toast.error("Failed to save configuration");
    }
  };

  const resetToDefault = () => {
    setConfig(DEFAULT_CONFIG);
    setSelectedPreset("balanced");
    setHasChanges(true);
    toast.info("Reset to default configuration");
  };

  const handleFactoryReset = async () => {
    try {
      await resetDatabaseMutation.mutateAsync();
      toast.success("All investor, company, and match data has been cleared.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Failed to reset database: ${message}`);
    }
  };

  const exportConfig = () => {
    const dataStr = JSON.stringify(config, null, 2);
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
    const exportFileDefaultName = "sprintly-matching-config.json";

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
    toast.success("Configuration exported!");
  };

  const importConfig = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event: any) => {
        try {
          const imported = JSON.parse(event.target.result);
          setConfig(imported);
          setHasChanges(true);
          toast.success("Configuration imported!");
        } catch (error) {
          toast.error("Invalid configuration file");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const totalWeight = Object.values(config.weights).reduce((sum, val) => sum + val, 0);
  const isWeightValid = Math.abs(totalWeight - 100) < 0.1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Matching Configuration</h1>
          <p className="text-muted-foreground mt-2">
            Customize how the AI matches companies with investors
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportConfig}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={importConfig}>
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" size="sm" onClick={resetToDefault}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button
            onClick={saveConfig}
            disabled={!hasChanges || !isWeightValid}
            className="bg-gradient-to-r from-purple-500 to-pink-600"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      {/* Weight Warning */}
      {!isWeightValid && (
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-600" />
              <span className="font-medium">
                Total weight must equal 100% (currently {totalWeight.toFixed(1)}%)
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Admin Controls */}
      <Card className="border-destructive/40 bg-destructive/5">
        <CardHeader>
          <CardTitle className="text-destructive">Factory Reset Data</CardTitle>
          <CardDescription>
            Wipe all imported companies, investors, matches, lists, and analytics.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-muted-foreground md:max-w-2xl">
            This action cannot be undone. Use only when you need a clean slate for demos.
          </p>
          <Button
            variant="destructive"
            onClick={handleFactoryReset}
            disabled={resetDatabaseMutation.isPending}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            {resetDatabaseMutation.isPending ? "Resetting..." : "Factory Reset Data"}
          </Button>
        </CardContent>
      </Card>

      {/* Live Match Preview */}
      <MatchPreview config={config} />

      <Tabs defaultValue="weights" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="weights">
            <Sliders className="h-4 w-4 mr-2" />
            Weights
          </TabsTrigger>
          <TabsTrigger value="filters">
            <Target className="h-4 w-4 mr-2" />
            Filters
          </TabsTrigger>
          <TabsTrigger value="thresholds">
            <TrendingUp className="h-4 w-4 mr-2" />
            Thresholds
          </TabsTrigger>
          <TabsTrigger value="presets">
            <Sparkles className="h-4 w-4 mr-2" />
            Presets
          </TabsTrigger>
        </TabsList>

        {/* Weights Tab */}
        <TabsContent value="weights" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Matching Signal Weights</CardTitle>
              <CardDescription>
                Adjust how much each factor contributes to the overall match score. Total must equal
                100%.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Sector Weight */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-blue-600" />
                    <Label>Sector Alignment</Label>
                  </div>
                  <Badge variant="secondary">{config.weights.sector}%</Badge>
                </div>
                <Slider
                  value={[config.weights.sector]}
                  onValueChange={([value]) => updateWeight("sector", value)}
                  max={100}
                  step={1}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  How important is it that the company's sector matches the investor's focus?
                </p>
              </div>

              {/* Stage Weight */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <Label>Stage Fit</Label>
                  </div>
                  <Badge variant="secondary">{config.weights.stage}%</Badge>
                </div>
                <Slider
                  value={[config.weights.stage]}
                  onValueChange={([value]) => updateWeight("stage", value)}
                  max={100}
                  step={1}
                />
                <p className="text-xs text-muted-foreground">
                  How important is it that the company's funding stage matches investor preferences?
                </p>
              </div>

              {/* Geography Weight */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-red-600" />
                    <Label>Geographic Proximity</Label>
                  </div>
                  <Badge variant="secondary">{config.weights.geography}%</Badge>
                </div>
                <Slider
                  value={[config.weights.geography]}
                  onValueChange={([value]) => updateWeight("geography", value)}
                  max={100}
                  step={1}
                />
                <p className="text-xs text-muted-foreground">
                  How important is geographic alignment between company and investor?
                </p>
              </div>

              {/* Traction Weight */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-purple-600" />
                    <Label>Traction & Metrics</Label>
                  </div>
                  <Badge variant="secondary">{config.weights.traction}%</Badge>
                </div>
                <Slider
                  value={[config.weights.traction]}
                  onValueChange={([value]) => updateWeight("traction", value)}
                  max={100}
                  step={1}
                />
                <p className="text-xs text-muted-foreground">
                  How important are revenue, growth rate, and other traction metrics?
                </p>
              </div>

              {/* Check Size Weight */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-yellow-600" />
                    <Label>Check Size Match</Label>
                  </div>
                  <Badge variant="secondary">{config.weights.checkSize}%</Badge>
                </div>
                <Slider
                  value={[config.weights.checkSize]}
                  onValueChange={([value]) => updateWeight("checkSize", value)}
                  max={100}
                  step={1}
                />
                <p className="text-xs text-muted-foreground">
                  How important is it that funding needs match investor check size?
                </p>
              </div>

              {/* Thesis Weight */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-indigo-600" />
                    <Label>Thesis Alignment</Label>
                  </div>
                  <Badge variant="secondary">{config.weights.thesis}%</Badge>
                </div>
                <Slider
                  value={[config.weights.thesis]}
                  onValueChange={([value]) => updateWeight("thesis", value)}
                  max={100}
                  step={1}
                />
                <p className="text-xs text-muted-foreground">
                  How important is alignment between company pitch and investor thesis?
                </p>
              </div>

              {/* Total Weight Indicator */}
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Total Weight</span>
                  <Badge
                    variant={isWeightValid ? "default" : "destructive"}
                    className="text-lg px-4 py-1"
                  >
                    {totalWeight.toFixed(1)}%
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Filters Tab */}
        <TabsContent value="filters" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Company Filters</CardTitle>
              <CardDescription>
                Set minimum requirements for companies to be included in matching
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Min Revenue */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Minimum Annual Revenue</Label>
                  <Badge variant="secondary">
                    ${(config.filters.minRevenue / 1000).toFixed(0)}K
                  </Badge>
                </div>
                <Slider
                  value={[config.filters.minRevenue]}
                  onValueChange={([value]) => updateFilter("minRevenue", value)}
                  max={5000000}
                  step={100000}
                />
              </div>

              {/* Min Team Size */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Minimum Team Size</Label>
                  <Badge variant="secondary">{config.filters.minTeamSize} people</Badge>
                </div>
                <Slider
                  value={[config.filters.minTeamSize]}
                  onValueChange={([value]) => updateFilter("minTeamSize", value)}
                  max={50}
                  step={1}
                />
              </div>

              {/* Require Pitch Deck */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Require Pitch Deck</Label>
                  <p className="text-xs text-muted-foreground">
                    Only match companies that have uploaded a pitch deck
                  </p>
                </div>
                <Switch
                  checked={config.filters.requirePitchDeck}
                  onCheckedChange={(checked) => updateFilter("requirePitchDeck", checked)}
                />
              </div>

              {/* Require Traction */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Require Traction</Label>
                  <p className="text-xs text-muted-foreground">
                    Only match companies with revenue or significant user base
                  </p>
                </div>
                <Switch
                  checked={config.filters.requireTraction}
                  onCheckedChange={(checked) => updateFilter("requireTraction", checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Thresholds Tab */}
        <TabsContent value="thresholds" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Match Score Thresholds</CardTitle>
              <CardDescription>
                Set minimum scores required for matches to be shown
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Min Match Score */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Minimum Overall Match Score</Label>
                  <Badge variant="secondary">{config.thresholds.minMatchScore}%</Badge>
                </div>
                <Slider
                  value={[config.thresholds.minMatchScore]}
                  onValueChange={([value]) => updateThreshold("minMatchScore", value)}
                  max={100}
                  step={5}
                />
                <p className="text-xs text-muted-foreground">
                  Hide matches below this overall score
                </p>
              </div>

              {/* Min Sector Score */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Minimum Sector Score</Label>
                  <Badge variant="secondary">{config.thresholds.minSectorScore}%</Badge>
                </div>
                <Slider
                  value={[config.thresholds.minSectorScore]}
                  onValueChange={([value]) => updateThreshold("minSectorScore", value)}
                  max={100}
                  step={5}
                />
                <p className="text-xs text-muted-foreground">
                  Require at least this level of sector alignment
                </p>
              </div>

              {/* Min Stage Score */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Minimum Stage Score</Label>
                  <Badge variant="secondary">{config.thresholds.minStageScore}%</Badge>
                </div>
                <Slider
                  value={[config.thresholds.minStageScore]}
                  onValueChange={([value]) => updateThreshold("minStageScore", value)}
                  max={100}
                  step={5}
                />
                <p className="text-xs text-muted-foreground">
                  Require at least this level of stage fit
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Presets Tab */}
        <TabsContent value="presets" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            {Object.entries(PRESETS).map(([key, preset]) => (
              <Card
                key={key}
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  selectedPreset === key ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => applyPreset(key as keyof typeof PRESETS)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {preset.name}
                    {selectedPreset === key && <Badge>Active</Badge>}
                  </CardTitle>
                  <CardDescription>{preset.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Min Match Score</span>
                      <span className="font-medium">
                        {preset.config.thresholds.minMatchScore}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Min Revenue</span>
                      <span className="font-medium">
                        ${(preset.config.filters.minRevenue / 1000).toFixed(0)}K
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Pitch Deck Required</span>
                      <span className="font-medium">
                        {preset.config.filters.requirePitchDeck ? "Yes" : "No"}
                      </span>
                    </div>
                  </div>
                  <Button className="w-full mt-4" variant="outline">
                    Apply Preset
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

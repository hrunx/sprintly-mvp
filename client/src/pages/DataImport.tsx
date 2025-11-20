import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { Upload, Download, FileText, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { ProcessingModal } from "@/components/ProcessingModal";

export default function DataImport() {
  const [activeTab, setActiveTab] = useState<"companies" | "investors">("companies");
  const [csvData, setCsvData] = useState<string>("");
  const [parsedData, setParsedData] = useState<any>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [showProcessing, setShowProcessing] = useState(false);

  const uploadCompaniesMutation = trpc.csv.uploadCompanies.useMutation();
  const uploadInvestorsMutation = trpc.csv.uploadInvestors.useMutation();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setCsvData(text);
      setParsedData(null);
      setImportResult(null);
    };
    reader.readAsText(file);
  };

  const handleParseCSV = async () => {
    if (!csvData) {
      toast.error("Please upload a CSV file first");
      return;
    }

    setImporting(true);
    setShowProcessing(true);

    try {
      if (activeTab === "companies") {
        const result = await uploadCompaniesMutation.mutateAsync({ csvContent: csvData });
        setParsedData(result);
        setImportResult({ imported: result.count, total: result.count });
        toast.success(`✅ ${result.count} companies uploaded to database`);
      } else {
        const result = await uploadInvestorsMutation.mutateAsync({ csvContent: csvData });
        setParsedData(result);
        setImportResult({ 
          imported: result.count, 
          total: result.count,
          matchingResult: result.matchingResult 
        });
        toast.success(`✅ ${result.count} investors uploaded to database`);
        
        // Show matching completion notification
        setTimeout(() => {
          toast.success(
            `🎯 Matching engine completed! ${result.matchingResult.created} new matches created. Check the Top Matches tab for latest results.`,
            { duration: 8000 }
          );
        }, 1000);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to upload CSV");
      setImporting(false);
      setShowProcessing(false);
    }
  };

  const handleImport = () => {
    // Import is now handled directly in handleParseCSV
    handleParseCSV();
  };

  const downloadTemplate = (type: "companies" | "investors") => {
    const filename = type === "companies" 
      ? "linkedin-companies-sample.csv"
      : "linkedin-investors-sample.csv";
    window.open(`/templates/${filename}`, "_blank");
  };

  return (
    <div className="container py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Data Import</h1>
        <p className="text-muted-foreground">
          Import companies and investors from LinkedIn CSV exports or other sources
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="companies">Import Companies</TabsTrigger>
          <TabsTrigger value="investors">Import Investors</TabsTrigger>
        </TabsList>

        <TabsContent value="companies" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload Companies CSV</CardTitle>
              <CardDescription>
                Import companies seeking funding from LinkedIn Sales Navigator or custom CSV
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => downloadTemplate("companies")}
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download Sample Template
                </Button>
                <span className="text-sm text-muted-foreground">
                  Use this template to format your data correctly
                </span>
              </div>

              <div 
                className="border-2 border-dashed rounded-lg p-8 text-center transition-colors hover:border-primary/50"
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files[0];
                  if (file && file.type === 'text/csv') {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                      const text = e.target?.result as string;
                      setCsvData(text);
                      setParsedData(null);
                      setImportResult(null);
                    };
                    reader.readAsText(file);
                  } else {
                    toast.error('Please upload a CSV file');
                  }
                }}
                onDragOver={(e) => e.preventDefault()}
              >
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="companies-csv-upload"
                />
                <label htmlFor="companies-csv-upload" className="cursor-pointer">
                  <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm font-medium mb-1">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">
                    CSV files only (max 10MB)
                  </p>
                </label>
              </div>

              {csvData && (
                <Alert>
                  <FileText className="w-4 h-4" />
                  <AlertDescription>
                    CSV file loaded ({csvData.split('\n').length - 1} rows). Click "Parse & Preview" to validate.
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={handleParseCSV}
                  disabled={!csvData || uploadCompaniesMutation.isPending || importing}
                  className="gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Parse & Preview
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={!parsedData || importing}
                  variant="default"
                  className="gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Import to Database
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="investors" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload Investors CSV</CardTitle>
              <CardDescription>
                Import investors from LinkedIn Recruiter, AngelList, or custom CSV
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => downloadTemplate("investors")}
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download Sample Template
                </Button>
                <span className="text-sm text-muted-foreground">
                  Use this template to format your data correctly
                </span>
              </div>

              <div 
                className="border-2 border-dashed rounded-lg p-8 text-center transition-colors hover:border-primary/50"
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files[0];
                  if (file && file.type === 'text/csv') {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                      const text = e.target?.result as string;
                      setCsvData(text);
                      setParsedData(null);
                      setImportResult(null);
                    };
                    reader.readAsText(file);
                  } else {
                    toast.error('Please upload a CSV file');
                  }
                }}
                onDragOver={(e) => e.preventDefault()}
              >
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="investors-csv-upload"
                />
                <label htmlFor="investors-csv-upload" className="cursor-pointer">
                  <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm font-medium mb-1">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">
                    CSV files only (max 10MB)
                  </p>
                </label>
              </div>

              {csvData && (
                <Alert>
                  <FileText className="w-4 h-4" />
                  <AlertDescription>
                    CSV file loaded ({csvData.split('\n').length - 1} rows). Click "Parse & Preview" to validate.
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={handleParseCSV}
                  disabled={!csvData || uploadInvestorsMutation.isPending || importing}
                  className="gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Parse & Preview
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={!parsedData || importing}
                  variant="default"
                  className="gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Import to Database
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Preview Section */}
      {parsedData && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Preview & Validation</CardTitle>
            <CardDescription>
              Review the parsed data before importing to the database
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center gap-2 p-4 border rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-sm font-medium">Valid Rows</p>
                  <p className="text-2xl font-bold">
                    {activeTab === "companies" 
                      ? parsedData.companies?.length || 0
                      : parsedData.investors?.length || 0}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-4 border rounded-lg">
                <XCircle className="w-5 h-5 text-red-500" />
                <div>
                  <p className="text-sm font-medium">Errors</p>
                  <p className="text-2xl font-bold">{parsedData.errors?.length || 0}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-4 border rounded-lg">
                <FileText className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-sm font-medium">Total Rows</p>
                  <p className="text-2xl font-bold">{parsedData.total || 0}</p>
                </div>
              </div>
            </div>

            {parsedData.errors && parsedData.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>
                  <p className="font-medium mb-2">Validation Errors:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {parsedData.errors.slice(0, 5).map((err: any, idx: number) => (
                      <li key={idx} className="text-sm">
                        Row {err.row}: {err.error}
                      </li>
                    ))}
                    {parsedData.errors.length > 5 && (
                      <li className="text-sm">...and {parsedData.errors.length - 5} more errors</li>
                    )}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {activeTab === "companies" && parsedData.companies && (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company Name</TableHead>
                      <TableHead>Sector</TableHead>
                      <TableHead>Stage</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Seeking</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedData.companies.slice(0, 10).map((company: any, idx: number) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{company.name}</TableCell>
                        <TableCell>{company.sector}</TableCell>
                        <TableCell>{company.stage}</TableCell>
                        <TableCell>{company.geography}</TableCell>
                        <TableCell>${(company.fundingTarget / 1000000).toFixed(1)}M</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {parsedData.companies.length > 10 && (
                  <div className="p-2 text-center text-sm text-muted-foreground border-t">
                    Showing 10 of {parsedData.companies.length} companies
                  </div>
                )}
              </div>
            )}

            {activeTab === "investors" && parsedData.investors && (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Firm</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Check Size</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedData.investors.slice(0, 10).map((investor: any, idx: number) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{investor.name}</TableCell>
                        <TableCell>{investor.title}</TableCell>
                        <TableCell>{investor.firm}</TableCell>
                        <TableCell>{investor.geography}</TableCell>
                        <TableCell>
                          ${(investor.checkSizeMin / 1000000).toFixed(1)}M - ${(investor.checkSizeMax / 1000000).toFixed(1)}M
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {parsedData.investors.length > 10 && (
                  <div className="p-2 text-center text-sm text-muted-foreground border-t">
                    Showing 10 of {parsedData.investors.length} investors
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Import Result */}
      {importResult && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Import Complete</CardTitle>
            <CardDescription>
              Data has been imported to the database
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Import Progress</span>
                <span className="text-sm text-muted-foreground">
                  {importResult.imported} / {importResult.total}
                </span>
              </div>
              <Progress 
                value={(importResult.imported / importResult.total) * 100} 
                className="h-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2 p-4 border rounded-lg bg-green-50">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-sm font-medium">Successfully Imported</p>
                  <p className="text-2xl font-bold">{importResult.imported}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-4 border rounded-lg bg-red-50">
                <XCircle className="w-5 h-5 text-red-500" />
                <div>
                  <p className="text-sm font-medium">Failed</p>
                  <p className="text-2xl font-bold">{importResult.errors?.length || 0}</p>
                </div>
              </div>
            </div>

            {importResult.errors && importResult.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>
                  <p className="font-medium mb-2">Import Errors:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {importResult.errors.slice(0, 5).map((err: any, idx: number) => (
                      <li key={idx} className="text-sm">
                        {err.company || err.investor}: {err.error}
                      </li>
                    ))}
                    {importResult.errors.length > 5 && (
                      <li className="text-sm">...and {importResult.errors.length - 5} more errors</li>
                    )}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
      {/* Processing Modal */}
      <ProcessingModal
        open={showProcessing}
        onComplete={() => {
          setShowProcessing(false);
          setImporting(false);
        }}
        type={activeTab}
        count={parsedData?.[activeTab === "companies" ? "companies" : "investors"]?.length || 0}
      />
    </div>
  );
}

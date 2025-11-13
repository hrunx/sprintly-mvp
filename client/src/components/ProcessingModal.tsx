import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, FileText, Search, Building2, Brain, Target, Sparkles } from "lucide-react";

const processingSteps = [
  {
    id: 1,
    icon: FileText,
    title: "Reading CSV File",
    description: "Loading and parsing your data...",
    duration: 1500
  },
  {
    id: 2,
    icon: Search,
    title: "Validating Data",
    description: "Checking data quality and format...",
    duration: 1200
  },
  {
    id: 3,
    icon: Building2,
    title: "Structuring Records",
    description: "Organizing companies and investors...",
    duration: 1000
  },
  {
    id: 4,
    icon: Brain,
    title: "AI Profile Analysis",
    description: "Extracting insights with AI...",
    duration: 2000
  },
  {
    id: 5,
    icon: Target,
    title: "Generating Matches",
    description: "Finding perfect investor-company pairs...",
    duration: 1800
  },
  {
    id: 6,
    icon: Sparkles,
    title: "Import Complete",
    description: "Your data is ready!",
    duration: 800
  }
];

interface ProcessingModalProps {
  open: boolean;
  onComplete: () => void;
  type: "companies" | "investors";
  count: number;
}

export function ProcessingModal({ open, onComplete, type, count }: ProcessingModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!open) {
      setCurrentStep(0);
      setProgress(0);
      return;
    }

    let stepTimeout: NodeJS.Timeout;
    let progressInterval: NodeJS.Timeout;

    const runStep = (stepIndex: number) => {
      if (stepIndex >= processingSteps.length) {
        setTimeout(() => {
          onComplete();
        }, 500);
        return;
      }

      setCurrentStep(stepIndex);
      const step = processingSteps[stepIndex];
      const stepProgress = (stepIndex / processingSteps.length) * 100;
      const nextStepProgress = ((stepIndex + 1) / processingSteps.length) * 100;

      // Animate progress bar
      let currentProgress = stepProgress;
      progressInterval = setInterval(() => {
        currentProgress += (nextStepProgress - stepProgress) / (step.duration / 50);
        if (currentProgress >= nextStepProgress) {
          currentProgress = nextStepProgress;
          clearInterval(progressInterval);
        }
        setProgress(currentProgress);
      }, 50);

      // Move to next step
      stepTimeout = setTimeout(() => {
        clearInterval(progressInterval);
        runStep(stepIndex + 1);
      }, step.duration);
    };

    runStep(0);

    return () => {
      clearTimeout(stepTimeout);
      clearInterval(progressInterval);
    };
  }, [open, onComplete]);

  const currentStepData = processingSteps[currentStep];
  const StepIcon = currentStepData?.icon || FileText;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <div className="py-6">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">Processing Your Data</h2>
            <p className="text-sm text-muted-foreground">
              Importing {count} {type} with AI-powered analysis
            </p>
          </div>

          {/* Current Step Animation */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative mb-6">
              {/* Animated background pulse */}
              <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
              <div className="relative bg-primary text-primary-foreground p-6 rounded-full">
                <StepIcon className="w-12 h-12" />
              </div>
            </div>
            
            <h3 className="text-lg font-semibold mb-1">{currentStepData?.title}</h3>
            <p className="text-sm text-muted-foreground">{currentStepData?.description}</p>
          </div>

          {/* Progress Bar */}
          <div className="space-y-3 mb-8">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Step {currentStep + 1} of {processingSteps.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
          </div>

          {/* Steps List */}
          <div className="space-y-3">
            {processingSteps.map((step, index) => {
              const Icon = step.icon;
              const isCompleted = index < currentStep;
              const isCurrent = index === currentStep;
              const isPending = index > currentStep;

              return (
                <div
                  key={step.id}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                    isCurrent ? "bg-primary/10 border-2 border-primary" : 
                    isCompleted ? "bg-green-50 border border-green-200" : 
                    "bg-muted/30 border border-transparent"
                  }`}
                >
                  <div className={`p-2 rounded-lg ${
                    isCurrent ? "bg-primary text-primary-foreground" :
                    isCompleted ? "bg-green-500 text-white" :
                    "bg-muted"
                  }`}>
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${
                      isPending ? "text-muted-foreground" : ""
                    }`}>
                      {step.title}
                    </p>
                  </div>
                  {isCurrent && (
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RegistrationProgressProps {
  currentStep: number;
  totalSteps: number;
}

const steps = [
  { number: 1, label: 'Account Created' },
  { number: 2, label: 'Personal Details' },
  { number: 3, label: 'College Details' },
];

export function RegistrationProgress({ currentStep }: RegistrationProgressProps) {
  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                  currentStep > step.number
                    ? "bg-success text-success-foreground"
                    : currentStep === step.number
                    ? "gradient-primary text-primary-foreground shadow-elevated"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {currentStep > step.number ? (
                  <Check className="w-5 h-5" />
                ) : (
                  step.number
                )}
              </div>
              <span
                className={cn(
                  "mt-2 text-xs font-medium text-center max-w-[80px]",
                  currentStep >= step.number
                    ? "text-foreground"
                    : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "flex-1 h-0.5 mx-2 transition-all",
                  currentStep > step.number
                    ? "bg-success"
                    : "bg-muted"
                )}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

"use client";

interface ProgressBarProps {
  currentStep: number;
  totalSteps?: number;
}

const stepLabels = ["Format", "Photo", "Message", "Payment"];

export default function ProgressBar({
  currentStep,
  totalSteps = 4,
}: ProgressBarProps) {
  return (
    <div className="w-full px-6 py-3">
      <div className="flex items-center justify-between max-w-xs mx-auto">
        {Array.from({ length: totalSteps }, (_, i) => {
          const step = i + 1;
          const isCompleted = step < currentStep;
          const isActive = step === currentStep;
          const filled = isCompleted || isActive;

          return (
            <div key={step} className="flex items-center flex-1 last:flex-none">
              {/* Step circle + label */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-7 h-7 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300 ${
                    filled
                      ? "bg-teal text-white"
                      : "bg-sand-200 text-sand-600"
                  }`}
                  style={
                    isActive
                      ? { animation: "pulse-glow 2s ease-in-out infinite" }
                      : undefined
                  }
                >
                  {isCompleted ? (
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    step
                  )}
                </div>
                {/* Labels hidden on mobile, all visible on desktop */}
                <span
                  className={`hidden sm:block text-[10px] mt-1 transition-all duration-200 ${
                    isActive
                      ? "text-teal font-semibold"
                      : isCompleted
                      ? "text-teal/60"
                      : "text-sand-500"
                  }`}
                >
                  {stepLabels[i]}
                </span>
              </div>

              {/* Connector line with fill animation */}
              {step < totalSteps && (
                <div className="flex-1 h-[2px] mx-2 sm:mb-5 bg-sand-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-teal rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: isCompleted ? "100%" : "0%",
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

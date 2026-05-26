const STEPS = ["paid", "printing", "shipped"];
const STEP_LABELS: Record<string, string> = {
  paid: "Paid",
  printing: "Printing",
  shipped: "Shipped",
};

interface StatusStepperProps {
  status: string;
}

export default function StatusStepper({ status }: StatusStepperProps) {
  // cancelled / pending / paid_print_failed don't fit the stepper
  if (status === "cancelled" || status === "pending") return null;

  const currentIdx = STEPS.indexOf(
    status === "paid_print_failed" ? "paid" : status
  );
  const isFailed = status === "paid_print_failed";

  return (
    <div className="flex items-center gap-1">
      {STEPS.map((step, idx) => {
        const isComplete = idx < currentIdx;
        const isCurrent = idx === currentIdx;
        const isError = isCurrent && isFailed;

        return (
          <div key={step} className="flex items-center gap-1 flex-1 last:flex-none">
            {/* Dot */}
            <div className="flex flex-col items-center">
              <div
                className={`w-2 h-2 rounded-full transition-colors ${
                  isError
                    ? "bg-red-400"
                    : isComplete
                    ? "bg-teal"
                    : isCurrent
                    ? "bg-teal ring-2 ring-teal/20"
                    : "bg-sand-200"
                }`}
              />
              <span
                className={`text-[8px] mt-0.5 leading-none ${
                  isCurrent || isComplete ? "text-teal font-medium" : "text-sand-400"
                }`}
              >
                {STEP_LABELS[step]}
              </span>
            </div>

            {/* Connector */}
            {idx < STEPS.length - 1 && (
              <div className="flex-1 h-[1.5px] mb-3 rounded-full overflow-hidden bg-sand-200">
                <div
                  className={`h-full rounded-full transition-all ${
                    isComplete ? "bg-teal w-full" : "w-0"
                  }`}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

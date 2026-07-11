import React from "react";
import { getStage } from "@/lib/workflow";
import { Check } from "lucide-react";

const STAGE_LABELS = ["Referral", "Active", "Review", "Discharged"];

export default function WorkflowStepper({ caseData }) {
  const currentStage = getStage(caseData);

  return (
    <div className="flex items-center gap-1">
      {STAGE_LABELS.map((label, i) => {
        const isDone = i < currentStage;
        const isCurrent = i === currentStage;
        const isDischarged = currentStage === 3;
        const color = isDischarged && i === 3 ? "#16A34A" : "#D97706";

        return (
          <React.Fragment key={i}>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <div
                className="flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold"
                style={{
                  backgroundColor: isDone || isCurrent ? color : "#E5E7EB",
                  color: isDone || isCurrent ? "#fff" : "#9CA3AF",
                }}
              >
                {isDone ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </div>
              <span
                className={`text-xs font-medium hidden sm:inline ${isCurrent ? "text-gray-900" : "text-gray-400"}`}
              >
                {label}
              </span>
            </div>
            {i < STAGE_LABELS.length - 1 && (
              <div
                className="flex-1 h-0.5 rounded-full min-w-[8px]"
                style={{ backgroundColor: isDone ? color : "#E5E7EB" }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
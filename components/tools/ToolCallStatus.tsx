import { CircleCheck, CircleDot, RotateCw } from "lucide-react";

export type ToolState = "result" | "partial-call" | "call" | "error";

export interface ToolCallStatusProps {
  state: ToolState;
  errorMessage?: string;
}

export function ToolCallStatus({ state, errorMessage }: ToolCallStatusProps) {
  switch (state) {
    case "result":
      return (
        <div className="flex items-center gap-1 text-green-500">
          <CircleCheck className="h-3 w-3" />
          <span>Successfully processed</span>
        </div>
      );

    case "partial-call":
    case "call":
      return (
        <div className="flex items-center gap-1 text-amber-500">
          <RotateCw className="h-3 w-3 animate-spin" />
          <span>Processing...</span>
        </div>
      );

    case "error":
      return (
        <div className="flex items-center gap-1 text-red-500">
          <CircleDot className="h-3 w-3" />
          <span>Error: {errorMessage || "Unknown error"}</span>
        </div>
      );

    default:
      return null;
  }
}

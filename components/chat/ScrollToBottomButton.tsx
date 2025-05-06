import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

interface ScrollToBottomButtonProps {
  onClick: () => void;
}

export function ScrollToBottomButton({ onClick }: ScrollToBottomButtonProps) {
  return (
    <Button
      variant="outline"
      size="icon"
      className="absolute bottom-20 right-4 rounded-full shadow-md bg-background z-10"
      onClick={onClick}
      aria-label="Scroll to bottom"
    >
      <ChevronDown className="h-4 w-4" />
    </Button>
  );
}

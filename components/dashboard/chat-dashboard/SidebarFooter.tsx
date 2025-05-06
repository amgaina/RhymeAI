import { Settings, SplitSquareVertical } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SidebarFooterProps {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

export function SidebarFooter({
  sidebarCollapsed,
  setSidebarCollapsed,
}: SidebarFooterProps) {
  return (
    <div className="p-4 border-t border-border flex items-center justify-between">
      <Button
        variant="ghost"
        className={`${
          sidebarCollapsed ? "w-auto px-2" : "w-full justify-start gap-2"
        }`}
        title="Settings"
      >
        <Settings className="h-4 w-4" />
        {!sidebarCollapsed && <span>Settings</span>}
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <SplitSquareVertical className="h-4 w-4" />
      </Button>
    </div>
  );
}

import Link from "next/link";
import { Home, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SidebarHeaderProps {
  sidebarCollapsed: boolean;
  createEventLink: string;
  onCreateNewEvent?: () => void;
}

export function SidebarHeader({
  sidebarCollapsed,
  createEventLink,
  onCreateNewEvent,
}: SidebarHeaderProps) {
  const handleCreateEvent = (e: React.MouseEvent) => {
    if (onCreateNewEvent) {
      e.preventDefault();
      onCreateNewEvent();
    }
  };

  return (
    <div
      className={`p-4 border-b border-border ${
        sidebarCollapsed ? "flex justify-center" : ""
      }`}
    >
      {!sidebarCollapsed ? (
        <>
          <Link href="/dashboard">
            <Button variant="ghost" className="w-full justify-start gap-2 mb-2">
              <Home className="h-4 w-4" />
              Dashboard Home
            </Button>
          </Link>

          {onCreateNewEvent ? (
            <Button
              onClick={handleCreateEvent}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-2"
            >
              <PlusCircle className="h-4 w-4" />
              Create New Event
            </Button>
          ) : (
            <Link href={createEventLink}>
              <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-2">
                <PlusCircle className="h-4 w-4" />
                Create New Event
              </Button>
            </Link>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center space-y-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="h-10 w-10">
              <Home className="h-5 w-5" />
            </Button>
          </Link>

          {onCreateNewEvent ? (
            <Button
              onClick={handleCreateEvent}
              size="icon"
              className="h-10 w-10 bg-primary hover:bg-primary/90"
            >
              <PlusCircle className="h-5 w-5" />
            </Button>
          ) : (
            <Link href={createEventLink}>
              <Button
                size="icon"
                className="h-10 w-10 bg-primary hover:bg-primary/90"
              >
                <PlusCircle className="h-5 w-5" />
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

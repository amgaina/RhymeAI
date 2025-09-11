import { Calendar, Mic2, FileText, Clock } from "lucide-react";

interface SidebarStatsProps {
  sidebarCollapsed: boolean;
  totalEvents: number;
  activeVoices: number;
  scriptSegments: number;
  contentMinutes: number;
}

export function SidebarStats({
  sidebarCollapsed,
  totalEvents,
  activeVoices,
  scriptSegments,
  contentMinutes,
}: SidebarStatsProps) {
  return (
    <div
      className={`${sidebarCollapsed ? "py-4" : "p-4"} border-b border-border`}
    >
      {!sidebarCollapsed ? (
        <>
          <h3 className="text-sm font-medium mb-3 text-muted-foreground">
            EVENT STATS
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2 p-2 rounded-md hover:bg-accent/10">
              <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center">
                <Calendar className="h-4 w-4 text-accent" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Events</p>
                <p className="font-semibold">{totalEvents}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 rounded-md hover:bg-accent/10">
              <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center">
                <Mic2 className="h-4 w-4 text-accent" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Active Voices</p>
                <p className="font-semibold">{activeVoices}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 rounded-md hover:bg-accent/10">
              <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center">
                <FileText className="h-4 w-4 text-accent" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  Script Segments
                </p>
                <p className="font-semibold">{scriptSegments}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 rounded-md hover:bg-accent/10">
              <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center">
                <Clock className="h-4 w-4 text-accent" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  Content Minutes
                </p>
                <p className="font-semibold">{contentMinutes}</p>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center space-y-4">
          <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center">
            <Calendar className="h-5 w-5 text-accent" />
          </div>
          <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center">
            <Mic2 className="h-5 w-5 text-accent" />
          </div>
          <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center">
            <FileText className="h-5 w-5 text-accent" />
          </div>
          <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center">
            <Clock className="h-5 w-5 text-accent" />
          </div>
        </div>
      )}
    </div>
  );
}

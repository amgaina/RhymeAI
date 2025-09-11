import { ToolCall } from "ai";
import { Badge } from "@/components/ui/badge";
import { Volume2, Settings, Mic } from "lucide-react";

interface VoiceSettingsToolViewProps {
  tool: ToolCall;
  isUpdate?: boolean;
}

export function VoiceSettingsToolView({
  tool,
  isUpdate = false,
}: VoiceSettingsToolViewProps) {
  // Safely check for result existence
  if (!tool || !tool.result) {
    return (
      <div className="mt-2 text-sm text-muted-foreground">
        No voice settings information available
      </div>
    );
  }

  // Check for errors
  if (tool.result.success === false) {
    return (
      <div className="mt-2 text-sm text-red-500">
        {isUpdate
          ? "Voice settings update failed"
          : "Failed to retrieve voice settings"}
        :{String(tool.result.error) || "Unknown error"}
      </div>
    );
  }

  // For voice settings retrieval
  if (!isUpdate && tool.result.voiceSettings) {
    const settings = tool.result.voiceSettings;

    return (
      <div className="mt-2">
        <div className="text-sm mb-2 flex items-center gap-2">
          <Mic className="h-4 w-4 text-primary" />
          <span>Voice settings</span>
        </div>

        <div className="border rounded-md p-3 bg-background/80">
          <div className="grid grid-cols-2 gap-y-2 gap-x-4">
            {settings.provider && (
              <div className="text-sm">
                <span className="text-xs text-muted-foreground">Provider:</span>
                <div className="font-medium">{settings.provider}</div>
              </div>
            )}

            {settings.voiceName && (
              <div className="text-sm">
                <span className="text-xs text-muted-foreground">Voice:</span>
                <div className="font-medium">{settings.voiceName}</div>
              </div>
            )}

            {settings.pitch !== undefined && (
              <div className="text-sm">
                <span className="text-xs text-muted-foreground">Pitch:</span>
                <div className="font-medium">{settings.pitch}</div>
              </div>
            )}

            {settings.speed !== undefined && (
              <div className="text-sm">
                <span className="text-xs text-muted-foreground">Speed:</span>
                <div className="font-medium">{settings.speed}x</div>
              </div>
            )}
          </div>

          {settings.sampleUrl && (
            <div className="mt-3 pt-2 border-t border-muted/30">
              <div className="text-xs text-muted-foreground mb-1">Sample:</div>
              <audio
                controls
                className="w-full h-8"
                src={settings.sampleUrl}
              ></audio>
            </div>
          )}
        </div>
      </div>
    );
  }

  // For voice settings update
  if (isUpdate && tool.result.success) {
    return (
      <div className="mt-2">
        <div className="text-sm mb-2 flex items-center gap-2">
          <Settings className="h-4 w-4 text-green-500" />
          <span>Voice settings updated successfully</span>
        </div>

        {tool.result.updatedSettings && (
          <div className="border rounded-md p-3 bg-background/80">
            <div className="grid grid-cols-2 gap-y-2 gap-x-4">
              {Object.entries(tool.result.updatedSettings).map(
                ([key, value]) =>
                  key !== "sampleUrl" && (
                    <div key={key} className="text-sm">
                      <span className="text-xs text-muted-foreground capitalize">
                        {key.replace(/([A-Z])/g, " $1").trim()}:
                      </span>
                      <div className="font-medium">{String(value)}</div>
                    </div>
                  )
              )}
            </div>

            {tool.result.updatedSettings.sampleUrl && (
              <div className="mt-3 pt-2 border-t border-muted/30">
                <div className="text-xs text-muted-foreground mb-1">
                  New sample:
                </div>
                <audio
                  controls
                  className="w-full h-8"
                  src={tool.result.updatedSettings.sampleUrl}
                ></audio>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Generic success message
  return (
    <div className="mt-2 text-sm">
      <div className="flex items-center gap-2">
        <Settings className="h-4 w-4 text-green-500" />
        <span>
          {isUpdate ? "Voice settings updated" : "Retrieved voice settings"}
        </span>
      </div>
    </div>
  );
}

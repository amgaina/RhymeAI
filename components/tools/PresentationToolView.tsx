import { ToolCall } from "ai";
import { Badge } from "@/components/ui/badge";
import { Download, ExternalLink, PresentationIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PresentationToolViewProps {
  tool: ToolCall;
}

export function PresentationToolView({ tool }: PresentationToolViewProps) {
  // Safely check for result existence
  if (!tool || !tool.result) {
    return (
      <div className="mt-2 text-sm text-muted-foreground">
        No presentation information available
      </div>
    );
  }

  // Check for errors or explicit failure
  if (tool.result.success === false) {
    return (
      <div className="mt-2 text-sm text-red-500">
        Presentation generation failed:{" "}
        {String(tool.result.error) || "Unknown error"}
      </div>
    );
  }

  // For successful presentation generation
  if (tool.result.success && tool.result.presentationUrl) {
    return (
      <div className="mt-2">
        <div className="text-sm mb-2 flex items-center gap-2">
          <PresentationIcon className="h-4 w-4 text-green-500" />
          <span>Presentation generated successfully</span>
        </div>

        <div className="border rounded-md p-3 bg-background/80">
          <div className="text-sm mb-3">
            {tool.result.slides
              ? `Created presentation with ${tool.result.slides} slides`
              : "Presentation ready for download"}
          </div>

          <div className="flex flex-wrap gap-2">
            {tool.result.presentationUrl && (
              <Button size="sm" variant="outline" asChild>
                <a
                  href={tool.result.presentationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download</span>
                </a>
              </Button>
            )}

            {tool.result.previewUrl && (
              <Button size="sm" variant="outline" asChild>
                <a
                  href={tool.result.previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Preview</span>
                </a>
              </Button>
            )}
          </div>

          {tool.result.slideDetails &&
            Array.isArray(tool.result.slideDetails) && (
              <div className="mt-3 pt-2 border-t border-muted/30">
                <div className="text-xs font-medium mb-2">Slide overview:</div>
                <div className="max-h-40 overflow-y-auto space-y-1.5 pr-2">
                  {tool.result.slideDetails.map((slide: any, index: number) => (
                    <div key={index} className="text-xs flex items-start gap-2">
                      <Badge variant="outline" className="shrink-0">
                        {index + 1}
                      </Badge>
                      <span className="text-muted-foreground">
                        {slide?.title || slide?.content || `Slide ${index + 1}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
        </div>
      </div>
    );
  }

  // Generic success message when details are missing
  return (
    <div className="mt-2 text-sm">
      <div className="flex items-center gap-2">
        <FilePresentation className="h-4 w-4 text-green-500" />
        <span>Presentation created successfully</span>
      </div>

      {tool.result.message && (
        <div className="text-xs text-muted-foreground mt-1">
          {tool.result.message}
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useChatUIBridge } from "@/lib/chat-ui-bridge";
import ChatLayoutViewer from "./ChatLayoutViewer";
import ChatScriptViewer from "./ChatScriptViewer";

interface ChatUIContainerProps {
  useDialog?: boolean; // Whether to use a dialog or sheet
}

export function ChatUIContainer({ useDialog = false }: ChatUIContainerProps) {
  const { activeComponent, componentData, closeComponent } = useChatUIBridge();

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && activeComponent !== "none") {
        closeComponent();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeComponent, closeComponent]);

  // Render nothing if no component is active
  if (activeComponent === "none") {
    return null;
  }

  // Render the appropriate component based on the active component type
  const renderComponent = () => {
    switch (activeComponent) {
      case "layout":
        return (
          <ChatLayoutViewer
            eventId={componentData.eventId}
            layoutData={componentData.layoutData}
            onClose={closeComponent}
          />
        );
      case "script":
        return (
          <ChatScriptViewer
            eventId={componentData.eventId}
            scriptData={componentData.scriptData}
            onClose={closeComponent}
          />
        );
      case "audio":
        // Audio player component would go here
        return (
          <div className="p-4">
            <h2 className="text-lg font-semibold">Audio Player</h2>
            <p>Audio player for event {componentData.eventId}</p>
            <button onClick={closeComponent}>Close</button>
          </div>
        );
      default:
        return null;
    }
  };

  // Use either Dialog or Sheet based on the useDialog prop
  if (useDialog) {
    return (
      <Dialog
        open={activeComponent !== "none"}
        onOpenChange={(open) => !open && closeComponent()}
      >
        <DialogContent className="max-w-4xl w-full p-0 overflow-hidden">
          {renderComponent()}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet
      open={activeComponent !== "none"}
      onOpenChange={(open) => !open && closeComponent()}
    >
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl md:max-w-2xl lg:max-w-4xl p-0 overflow-y-auto"
      >
        <div className="p-4">{renderComponent()}</div>
      </SheetContent>
    </Sheet>
  );
}

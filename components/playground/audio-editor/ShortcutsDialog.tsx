"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";
import {
  ShortcutGroup,
  formatShortcut,
} from "@/lib/hooks/useKeyboardShortcuts";

interface ShortcutsDialogProps {
  shortcutGroups: ShortcutGroup[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function ShortcutsDialog({
  shortcutGroups,
  open: controlledOpen,
  onOpenChange,
}: ShortcutsDialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);

  // Use controlled state if provided, otherwise use internal state
  const open = controlledOpen !== undefined ? controlledOpen : uncontrolledOpen;
  const setOpen = (newOpen: boolean) => {
    if (onOpenChange) {
      onOpenChange(newOpen);
    } else {
      setUncontrolledOpen(newOpen);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          title="Keyboard Shortcuts"
        >
          <HelpCircle className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Use these keyboard shortcuts to speed up your workflow.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {shortcutGroups.map((group) => (
            <div key={group.name} className="space-y-2">
              <h3 className="font-medium text-sm">{group.name}</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {group.shortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center py-1 px-2 rounded-md hover:bg-accent/50"
                  >
                    <span className="text-muted-foreground">
                      {shortcut.description}
                    </span>
                    <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">
                      {formatShortcut(shortcut)}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-end">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

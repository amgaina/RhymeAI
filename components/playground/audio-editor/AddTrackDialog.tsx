"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";

interface AddTrackDialogProps {
  onAddTrack: (type: "emcee" | "background" | "effects", name: string) => void;
}

export default function AddTrackDialog({ onAddTrack }: AddTrackDialogProps) {
  const [open, setOpen] = useState(false);
  const [trackType, setTrackType] = useState<"emcee" | "background" | "effects">("emcee");
  const [trackName, setTrackName] = useState("");

  const handleSubmit = () => {
    if (!trackName.trim()) {
      return; // Don't add tracks without a name
    }
    
    onAddTrack(trackType, trackName);
    setTrackName("");
    setTrackType("emcee");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="w-full flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Track
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Track</DialogTitle>
          <DialogDescription>
            Create a new audio track for your project.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="track-type" className="text-right">
              Type
            </Label>
            <Select
              value={trackType}
              onValueChange={(value) => 
                setTrackType(value as "emcee" | "background" | "effects")
              }
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select track type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="emcee">Emcee Voice</SelectItem>
                <SelectItem value="background">Background Music</SelectItem>
                <SelectItem value="effects">Sound Effects</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="track-name" className="text-right">
              Name
            </Label>
            <Input
              id="track-name"
              value={trackName}
              onChange={(e) => setTrackName(e.target.value)}
              placeholder="Enter track name"
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSubmit} disabled={!trackName.trim()}>
            Add Track
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

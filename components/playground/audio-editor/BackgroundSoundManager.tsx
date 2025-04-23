"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Upload,
  Play,
  Pause,
  Plus,
  Music,
  Search,
  MoreHorizontal,
  GalleryHorizontal,
  Volume2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Slider } from "@/components/ui/slider";
import { getBackgroundMusicOptions } from "@/app/actions/playground/audio-editor";
import { toast } from "sonner";

interface BackgroundSoundManagerProps {
  onAddToTrack: (
    soundUrl: string,
    trackId: number,
    metadata: BackgroundSoundMetadata
  ) => void;
  trackId: number;
  projectDuration: number;
}

interface BackgroundSoundMetadata {
  name: string;
  duration: number;
  category?: string;
  type: "music" | "effect";
}

// Sound categories
const CATEGORIES = [
  "All",
  "Corporate",
  "Conference",
  "Technology",
  "Motivational",
  "Transitions",
  "Audience",
  "Alerts",
  "Feedback",
];

export default function BackgroundSoundManager({
  onAddToTrack,
  trackId,
  projectDuration = 60,
}: BackgroundSoundManagerProps) {
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [filter, setFilter] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [previewVolume, setPreviewVolume] = useState(80);
  const [backgroundSounds, setBackgroundSounds] = useState<
    Array<{
      id: string;
      name: string;
      category: string;
      duration: string;
      type: "music" | "effect";
    }>
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load background sounds
  useEffect(() => {
    const loadSounds = async () => {
      try {
        setIsLoading(true);
        const sounds = await getBackgroundMusicOptions();

        // Convert to our format with types
        const formattedSounds = sounds.map((sound) => ({
          ...sound,
          type:
            sound.category === "Transitions" ||
            sound.category === "Audience" ||
            sound.category === "Alerts" ||
            sound.category === "Feedback"
              ? ("effect" as const)
              : ("music" as const),
        }));

        setBackgroundSounds(formattedSounds);
      } catch (error) {
        console.error("Error loading sounds:", error);
        toast.error("Failed to load background sounds");
      } finally {
        setIsLoading(false);
      }
    };

    loadSounds();
  }, []);

  const handlePlaySound = (soundId: string) => {
    if (isPlaying === soundId) {
      setIsPlaying(null);
      // Stop audio playback logic would go here
    } else {
      setIsPlaying(soundId);
      // Actual sound playing would be implemented here

      // Auto-stop after a short preview
      setTimeout(() => setIsPlaying(null), 5000);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files);
      setUploadedFiles((prev) => [...prev, ...newFiles]);

      // Success message
      if (newFiles.length === 1) {
        toast.success(`Uploaded ${newFiles[0].name}`);
      } else {
        toast.success(`Uploaded ${newFiles.length} files`);
      }
    }
  };

  const handleAddToTrack = (
    soundUrl: string,
    soundId: string,
    name: string,
    durationStr: string
  ) => {
    // Parse duration string (format: "1:30") to seconds
    const parts = durationStr.split(":");
    const durationInSeconds =
      parts.length === 2 ? parseInt(parts[0]) * 60 + parseInt(parts[1]) : 60; // Default to 60 seconds if parsing fails

    // Find the sound to get its metadata
    const sound = backgroundSounds.find((s) => s.id === soundId);

    const metadata: BackgroundSoundMetadata = {
      name: name,
      duration: durationInSeconds,
      category: sound?.category,
      type: sound?.type || "music",
    };

    onAddToTrack(soundUrl, trackId, metadata);
  };

  // Filter sounds based on search input and category
  const filteredSounds = backgroundSounds.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(filter.toLowerCase()) ||
      item.category.toLowerCase().includes(filter.toLowerCase());

    const matchesCategory =
      selectedCategory === "All" || item.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Get sounds by type
  const backgroundMusic = filteredSounds.filter(
    (sound) => sound.type === "music"
  );
  const soundEffects = filteredSounds.filter(
    (sound) => sound.type === "effect"
  );

  return (
    <div className="space-y-4">
      {/* Search and filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search sounds..."
            className="pl-9"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>

        <div className="relative">
          <Input
            type="file"
            className="hidden"
            id="sound-upload"
            accept="audio/*"
            multiple
            onChange={handleFileUpload}
          />
          <Button asChild variant="outline">
            <label
              htmlFor="sound-upload"
              className="cursor-pointer flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Upload Sound
            </label>
          </Button>
        </div>
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {CATEGORIES.map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(category)}
            className="whitespace-nowrap"
          >
            {category}
          </Button>
        ))}
      </div>

      <Tabs defaultValue="music" className="w-full">
        <TabsList className="grid grid-cols-2">
          <TabsTrigger value="music">
            <Music className="h-4 w-4 mr-2" />
            Background Music
          </TabsTrigger>
          <TabsTrigger value="effects">
            <GalleryHorizontal className="h-4 w-4 mr-2" />
            Sound Effects
          </TabsTrigger>
        </TabsList>

        {/* Background music tab */}
        <TabsContent
          value="music"
          className="border rounded-md p-4 min-h-[300px]"
        >
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : backgroundMusic.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No background music found matching "{filter}"
            </div>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
              {backgroundMusic.map((sound) => (
                <div
                  key={sound.id}
                  className="flex items-center justify-between p-2 rounded-md hover:bg-accent/10 group"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handlePlaySound(sound.id)}
                    >
                      {isPlaying === sound.id ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>

                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">{sound.name}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <span>{sound.duration}</span>
                        <span>•</span>
                        <span>{sound.category}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8"
                        onClick={() =>
                          handleAddToTrack(
                            `/api/audio/background/${sound.id}.mp3`,
                            sound.id,
                            sound.name,
                            sound.duration
                          )
                        }
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add to Track
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              // Preview at different point
                              handlePlaySound(sound.id);
                            }}
                          >
                            Preview from middle
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              // Add to different track
                              toast.info(
                                "Add to different track functionality coming soon"
                              );
                            }}
                          >
                            Add to different track
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Sound effects tab */}
        <TabsContent
          value="effects"
          className="border rounded-md p-4 min-h-[300px]"
        >
          {/* Similar implementation as music tab */}
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : soundEffects.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No sound effects found matching "{filter}"
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-2">
              {soundEffects.map((sound) => (
                <div
                  key={sound.id}
                  className="flex items-center p-2 rounded-md hover:bg-accent/10 group border border-border/50"
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handlePlaySound(sound.id)}
                  >
                    {isPlaying === sound.id ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>

                  <div className="min-w-0 flex-1 ml-2">
                    <div className="font-medium truncate">{sound.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {sound.duration}
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8"
                    onClick={() =>
                      handleAddToTrack(
                        `/api/audio/effects/${sound.id}.mp3`,
                        sound.id,
                        sound.name,
                        sound.duration
                      )
                    }
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Preview volume control */}
      <div className="flex items-center gap-2 pt-2 border-t">
        <Volume2 className="h-4 w-4 text-muted-foreground" />
        <div className="flex-1">
          <Slider
            value={[previewVolume]}
            max={100}
            step={1}
            onValueChange={(value) => setPreviewVolume(value[0])}
          />
        </div>
        <span className="text-xs text-muted-foreground w-8 text-right">
          {previewVolume}%
        </span>
      </div>

      {/* Uploaded files section */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2 border-t pt-4 mt-4">
          <h4 className="font-medium flex items-center">
            <Upload className="h-4 w-4 mr-2" />
            Uploaded Sounds ({uploadedFiles.length})
          </h4>
          <div className="max-h-[200px] overflow-y-auto space-y-2 pr-2">
            {uploadedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 rounded-md hover:bg-accent/10 group border border-border/30"
              >
                <div className="flex items-center gap-3 flex-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      setIsPlaying(
                        isPlaying === `upload-${index}`
                          ? null
                          : `upload-${index}`
                      );
                      setTimeout(() => setIsPlaying(null), 5000); // Auto-stop preview
                    }}
                  >
                    {isPlaying === `upload-${index}` ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                  <div>
                    <div className="font-medium truncate max-w-[150px] sm:max-w-[200px]">
                      {file.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8"
                  onClick={() =>
                    handleAddToTrack(
                      URL.createObjectURL(file),
                      `upload-${index}`,
                      file.name,
                      "1:00" // Assume 1 minute duration for uploaded files
                    )
                  }
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

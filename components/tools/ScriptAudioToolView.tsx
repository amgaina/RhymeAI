import { useState, useRef, useEffect } from "react";
import { ToolCall } from "./BaseToolView";
import { Badge } from "@/components/ui/badge";
import {
  Volume2,
  Clock,
  VolumeX,
  ChevronRight,
  X,
  Play,
  Pause,
  Info,
  BarChart2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ScriptAudioToolViewProps {
  tool: ToolCall;
}

// Define the structure of a script segment
interface ScriptSegment {
  id: string | number;
  type: string;
  content: string;
  status: string;
  timing: number;
  order: number;
  audio?: string;
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

const AudioWaveform = ({ audioUrl }: { audioUrl: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAndDrawWaveform = async () => {
      if (!canvasRef.current || !audioUrl) return;

      try {
        setIsLoading(true);
        const response = await fetch(audioUrl);
        const arrayBuffer = await response.arrayBuffer();
        const audioContext = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Draw waveform
        const data = audioBuffer.getChannelData(0);
        const step = Math.ceil(data.length / canvas.width);
        const amp = canvas.height / 2;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#10b981"; // Green color

        for (let i = 0; i < canvas.width; i++) {
          let min = 1.0;
          let max = -1.0;

          for (let j = 0; j < step; j++) {
            const datum = data[i * step + j];
            if (datum < min) min = datum;
            if (datum > max) max = datum;
          }

          ctx.fillRect(i, (1 + min) * amp, 1, Math.max(1, (max - min) * amp));
        }

        setIsLoading(false);
      } catch (error) {
        console.error("Error generating waveform:", error);
        setIsLoading(false);
      }
    };

    fetchAndDrawWaveform();
  }, [audioUrl]);

  return (
    <div className="relative h-16 w-full bg-muted/30 rounded-md overflow-hidden">
      {isLoading ? (
        <div className="flex items-center justify-center h-full">
          <div className="animate-pulse">Generating waveform...</div>
        </div>
      ) : (
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          width={500}
          height={64}
        ></canvas>
      )}
    </div>
  );
};

const SegmentPlayer = ({ segment }: { segment: ScriptSegment }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (audioRef.current && duration > 0) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickPosition = (e.clientX - rect.left) / rect.width;
      const newTime = clickPosition * duration;
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  return (
    <div className="space-y-2">
      <AudioWaveform audioUrl={segment.audio || ""} />

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={togglePlay}
        >
          {isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </Button>

        <div
          className="relative flex-1 h-2 bg-muted rounded-full cursor-pointer"
          onClick={handleProgressClick}
        >
          <Progress
            value={(currentTime / duration) * 100 || 0}
            className="h-2"
          />
        </div>

        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {formatDuration(currentTime)} /{" "}
          {formatDuration(duration || segment.timing)}
        </span>
      </div>

      <audio
        ref={audioRef}
        src={segment.audio}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        className="hidden"
      />
    </div>
  );
};

const ContinuousPlayer = ({
  segments,
  currentSegmentId,
  onSegmentChange,
}: {
  segments: ScriptSegment[];
  currentSegmentId: string | number | null;
  onSegmentChange: (segmentId: string | number) => void;
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [activeSegmentIndex, setActiveSegmentIndex] = useState(0);
  const [segmentStartTimes, setSegmentStartTimes] = useState<number[]>([]);

  useEffect(() => {
    let total = 0;
    const startTimes: number[] = [];

    segments.forEach((segment) => {
      startTimes.push(total);
      total += segment.timing || 0;
    });

    setTotalDuration(total);
    setSegmentStartTimes(startTimes);

    if (currentSegmentId) {
      const index = segments.findIndex((s) => s.id === currentSegmentId);
      if (index !== -1) {
        setActiveSegmentIndex(index);
        setCurrentTime(startTimes[index]);
      }
    }
  }, [segments, currentSegmentId]);

  useEffect(() => {
    if (currentTime > 0) {
      for (let i = segmentStartTimes.length - 1; i >= 0; i--) {
        if (currentTime >= segmentStartTimes[i]) {
          if (i !== activeSegmentIndex) {
            setActiveSegmentIndex(i);
            onSegmentChange(segments[i].id);
          }
          break;
        }
      }
    }
  }, [
    currentTime,
    segmentStartTimes,
    activeSegmentIndex,
    segments,
    onSegmentChange,
  ]);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      if (currentTime >= totalDuration) {
        setCurrentTime(0);
        setActiveSegmentIndex(0);
        if (segments.length > 0) {
          onSegmentChange(segments[0].id);
        }
      }

      if (segments[activeSegmentIndex] && segments[activeSegmentIndex].audio) {
        audioRef.current.src = segments[activeSegmentIndex].audio || "";
        audioRef.current.currentTime =
          currentTime - segmentStartTimes[activeSegmentIndex];
        audioRef.current.play();
      }
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;

    const segmentLocalTime = audioRef.current.currentTime;
    const globalTime = segmentStartTimes[activeSegmentIndex] + segmentLocalTime;
    setCurrentTime(globalTime);
  };

  const handleSegmentEnd = () => {
    if (activeSegmentIndex < segments.length - 1) {
      const nextIndex = activeSegmentIndex + 1;
      setActiveSegmentIndex(nextIndex);
      onSegmentChange(segments[nextIndex].id);

      if (isPlaying && audioRef.current && segments[nextIndex].audio) {
        audioRef.current.src = segments[nextIndex].audio || "";
        audioRef.current.play();
      }
    } else {
      setIsPlaying(false);
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || totalDuration <= 0) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickPosition = (e.clientX - rect.left) / rect.width;
    const newGlobalTime = clickPosition * totalDuration;
    setCurrentTime(newGlobalTime);

    let segmentIndex = 0;
    for (let i = 0; i < segmentStartTimes.length; i++) {
      if (i < segmentStartTimes.length - 1) {
        if (
          newGlobalTime >= segmentStartTimes[i] &&
          newGlobalTime < segmentStartTimes[i + 1]
        ) {
          segmentIndex = i;
          break;
        }
      } else if (newGlobalTime >= segmentStartTimes[i]) {
        segmentIndex = i;
      }
    }

    setActiveSegmentIndex(segmentIndex);
    onSegmentChange(segments[segmentIndex].id);

    if (isPlaying && segments[segmentIndex].audio) {
      audioRef.current.src = segments[segmentIndex].audio || "";
      audioRef.current.currentTime =
        newGlobalTime - segmentStartTimes[segmentIndex];
      audioRef.current.play();
    }
  };

  return (
    <div className="p-3 border rounded-md bg-background/90 shadow-sm">
      <h3 className="text-sm font-medium mb-3">Continuous Playback</h3>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={togglePlay}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>

          <div className="flex-1 relative">
            <div
              className="h-2 bg-muted rounded-full cursor-pointer"
              onClick={handleProgressClick}
            >
              <Progress
                value={(currentTime / totalDuration) * 100 || 0}
                className="h-2"
              />
            </div>

            <div className="absolute top-0 left-0 w-full">
              {segmentStartTimes.map((startTime, index) => (
                <div
                  key={index}
                  className="absolute top-0 h-2 w-0.5 bg-foreground/40"
                  style={{ left: `${(startTime / totalDuration) * 100}%` }}
                />
              ))}
            </div>
          </div>

          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {formatDuration(currentTime)} / {formatDuration(totalDuration)}
          </span>
        </div>

        <div className="text-xs text-muted-foreground">
          Playing segment {segments[activeSegmentIndex]?.id || ""} (
          {activeSegmentIndex + 1} of {segments.length})
        </div>
      </div>

      <audio
        ref={audioRef}
        className="hidden"
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleSegmentEnd}
      />
    </div>
  );
};

const MeetingMinimap = ({
  segments,
  totalDuration,
  selectedSegmentId,
  onSegmentClick,
}: {
  segments: ScriptSegment[];
  totalDuration: number;
  selectedSegmentId: string | number | null;
  onSegmentClick: (segment: ScriptSegment) => void;
}) => {
  const segmentTypes = [...new Set(segments.map((segment) => segment.type))];
  const typeColors: Record<string, string> = {};

  const colors = [
    "bg-blue-500",
    "bg-green-500",
    "bg-yellow-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-red-500",
    "bg-indigo-500",
  ];
  segmentTypes.forEach((type, index) => {
    typeColors[type] = colors[index % colors.length];
  });

  return (
    <div className="border rounded-md p-3">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-medium">Meeting Overview</h3>
        <span className="text-xs text-muted-foreground">
          Total: {formatDuration(totalDuration)}
        </span>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {segmentTypes.map((type) => (
          <div key={type} className="flex items-center gap-1">
            <div className={`w-3 h-3 rounded-full ${typeColors[type]}`}></div>
            <span className="text-xs capitalize">
              {type.replace(/_/g, " ")}
            </span>
          </div>
        ))}
      </div>

      <div className="h-8 flex rounded-md overflow-hidden">
        {segments.map((segment) => {
          const width = `${((segment.timing || 0) / totalDuration) * 100}%`;
          return (
            <div
              key={segment.id}
              className={`h-full ${
                typeColors[segment.type]
              } hover:brightness-110 cursor-pointer transition-all relative ${
                selectedSegmentId === segment.id
                  ? "ring-2 ring-foreground ring-inset"
                  : ""
              }`}
              style={{ width }}
              onClick={() => onSegmentClick(segment)}
              title={`${segment.type.replace(/_/g, " ")} - ${formatDuration(
                segment.timing || 0
              )}`}
            >
              {(segment.timing || 0) / totalDuration > 0.05 && (
                <div className="absolute inset-0 flex items-center justify-center text-xs text-white font-medium truncate px-1">
                  {segment.type.replace(/_/g, " ")}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-2 text-xs text-center text-muted-foreground">
        Click any segment to navigate
      </div>
    </div>
  );
};

const MeetingAnalytics = ({ segments }: { segments: ScriptSegment[] }) => {
  const segmentsByType = segments.reduce(
    (acc: { [key: string]: ScriptSegment[] }, segment) => {
      const type = segment.type;
      if (!acc[type]) acc[type] = [];
      acc[type].push(segment);
      return acc;
    },
    {}
  );

  const typeStats = Object.entries(segmentsByType)
    .map(([type, segments]) => {
      const totalTime = segments.reduce(
        (sum, segment) => sum + (segment.timing || 0),
        0
      );
      return { type, count: segments.length, totalTime };
    })
    .sort((a, b) => b.totalTime - a.totalTime);

  const totalTime = segments.reduce(
    (sum, segment) => sum + (segment.timing || 0),
    0
  );

  return (
    <div className="border rounded-md p-3">
      <h3 className="text-sm font-medium mb-3">Meeting Breakdown</h3>

      <div className="space-y-3">
        <div className="h-4 flex rounded-md overflow-hidden">
          {typeStats.map(({ type, totalTime }) => {
            const percentage = (totalTime / totalTime) * 100;
            return (
              <div
                key={type}
                className="h-full relative"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: type.includes("intro")
                    ? "#3b82f6"
                    : type.includes("outro")
                    ? "#ef4444"
                    : type.includes("agenda")
                    ? "#10b981"
                    : type.includes("present")
                    ? "#f59e0b"
                    : "#8b5cf6",
                }}
                title={`${type.replace(/_/g, " ")}: ${formatDuration(
                  totalTime
                )} (${percentage.toFixed(1)}%)`}
              ></div>
            );
          })}
        </div>

        <div className="space-y-2">
          {typeStats.map(({ type, count, totalTime }) => {
            const percentage = (totalTime / totalTime) * 100;
            return (
              <div key={type} className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{
                      backgroundColor: type.includes("intro")
                        ? "#3b82f6"
                        : type.includes("outro")
                        ? "#ef4444"
                        : type.includes("agenda")
                        ? "#10b981"
                        : type.includes("present")
                        ? "#f59e0b"
                        : "#8b5cf6",
                    }}
                  ></div>
                  <span className="text-xs capitalize">
                    {type.replace(/_/g, " ")}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatDuration(totalTime)} ({percentage.toFixed(1)}%) •{" "}
                  {count} {count === 1 ? "segment" : "segments"}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const ScriptAudioToolView = ({ tool }: ScriptAudioToolViewProps) => {
  const [selectedSegment, setSelectedSegment] = useState<ScriptSegment | null>(
    null
  );
  const [activeTab, setActiveTab] = useState("timeline");
  const timelineRef = useRef<HTMLDivElement>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedSegment || !audioSegments || audioSegments.length === 0)
        return;

      const currentIndex = audioSegments.findIndex(
        (s) => s.id === selectedSegment.id
      );

      switch (e.key) {
        case "ArrowRight":
          if (currentIndex < audioSegments.length - 1) {
            const nextSegment = audioSegments[currentIndex + 1];
            setSelectedSegment(nextSegment);
            scrollToSegment(nextSegment.id);
          }
          break;
        case "ArrowLeft":
          if (currentIndex > 0) {
            const prevSegment = audioSegments[currentIndex - 1];
            setSelectedSegment(prevSegment);
            scrollToSegment(prevSegment.id);
          }
          break;
        case " ":
          e.preventDefault();
          const audioElement = document.querySelector(
            `audio[src="${selectedSegment.audio}"]`
          ) as HTMLAudioElement;
          if (audioElement) {
            if (audioElement.paused) {
              audioElement.play();
            } else {
              audioElement.pause();
            }
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedSegment]);

  if (
    !tool ||
    !tool.result ||
    !tool.result.audioFiles ||
    !tool.result.audioFiles.event
  ) {
    return (
      <div className="mt-2 text-sm text-muted-foreground">
        No audio files available for this event
      </div>
    );
  }

  const { event } = tool.result.audioFiles;
  const scriptSegments = event.scriptSegments || [];

  const audioSegments = scriptSegments.filter(
    (segment: ScriptSegment) => segment.audio
  );

  const totalDuration = audioSegments.reduce(
    (total: number, segment: ScriptSegment) => total + (segment.timing || 0),
    0
  );

  const segmentsByType = audioSegments.reduce(
    (acc: { [key: string]: ScriptSegment[] }, segment: ScriptSegment) => {
      const type = segment.type;
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(segment);
      return acc;
    },
    {}
  );

  const scrollToSegment = (segmentId: string | number) => {
    const element = document.getElementById(`segment-${segmentId}`);
    if (element && timelineRef.current) {
      timelineRef.current.scrollTo({
        left: element.offsetLeft - 20,
        behavior: "smooth",
      });
    }
  };

  if (audioSegments.length === 0) {
    return (
      <div className="mt-2">
        <div className="text-sm mb-2 flex items-center gap-2">
          <VolumeX className="h-4 w-4 text-muted-foreground" />
          <span>No audio files found for this event</span>
        </div>
        <div className="text-xs text-muted-foreground">
          Event: {event.name} ({event.type})
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          Total segments: {scriptSegments.length} (none with audio)
        </div>
      </div>
    );
  }

  return (
    <div className="mt-2">
      <div className="flex justify-between items-center mb-3">
        <div>
          <div className="text-sm flex items-center gap-2">
            <Volume2 className="h-4 w-4 text-green-500" />
            <span>Found {audioSegments.length} audio files</span>
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Event: {event.name} ({event.type}) • Total duration:{" "}
            {formatDuration(totalDuration)}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => setShowAnalytics(!showAnalytics)}
          >
            <BarChart2 className="h-3 w-3 mr-1" />
            {showAnalytics ? "Hide Analytics" : "Show Analytics"}
          </Button>
        </div>
      </div>

      <MeetingMinimap
        segments={audioSegments}
        totalDuration={totalDuration}
        selectedSegmentId={selectedSegment?.id || null}
        onSegmentClick={setSelectedSegment}
      />

      {showAnalytics && (
        <div className="mt-3">
          <MeetingAnalytics segments={audioSegments} />
        </div>
      )}

      <div className="mt-3">
        <ContinuousPlayer
          segments={audioSegments}
          currentSegmentId={selectedSegment?.id || null}
          onSegmentChange={(segmentId) => {
            const segment = audioSegments.find((s) => s.id === segmentId);
            if (segment) {
              setSelectedSegment(segment);
              scrollToSegment(segmentId);
            }
          }}
        />
      </div>

      <div className="mt-3">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid w-[300px] grid-cols-2 mx-auto">
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="types">By Type</TabsTrigger>
          </TabsList>

          <TabsContent value="timeline" className="mt-2">>
            <div className="mb-4 pb-2 overflow-x-auto" ref={timelineRef}>
              <div className="flex items-center gap-1 min-w-max">
                {audioSegments.map((segment: ScriptSegment, index: number) => {
                  const width = Math.max(
                    80,
                    (segment.timing / totalDuration) * 800
                  );

                  return (
                    <TooltipProvider key={segment.id}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            id={`segment-${segment.id}`}
                            className={`h-12 rounded-md border flex-shrink-0 flex flex-col justify-center items-center p-1 cursor-pointer transition-all duration-200 ${
                              selectedSegment?.id === segment.id
                                ? "border-green-500 bg-green-50 dark:bg-green-950/20"
                                : "border-border bg-background hover:bg-muted/50"
                            }`}
                            style={{ width: `${width}px` }}
                            onClick={() => setSelectedSegment(segment)}
                          >
                            <span className="text-xs truncate w-full text-center">
                              {segment.type.replace(/_/g, " ")}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatDuration(segment.timing)}
                            </span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{segment.content.substring(0, 100)}...</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="types" className="mt-2">
            <div className="space-y-3">
              {Object.entries(segmentsByType).map(([type, segments]) => (
                <div key={type} className="border rounded-md p-3">
                  <div className="flex justify-between items-center mb-2">
                    <Badge variant="outline" className="capitalize">
                      {type.replace(/_/g, " ")}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {segments.length} segments
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {segments.map((segment: ScriptSegment) => (
                      <Button
                        key={segment.id}
                        variant="ghost"
                        className="h-auto justify-start p-2 text-left"
                        onClick={() => setSelectedSegment(segment)}
                      >
                        <div className="flex flex-col">
                          <span className="text-sm">Segment {segment.id}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatDuration(segment.timing)}
                          </span>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>>

      {selectedSegment && (
        <div className="mt-4 border rounded-md p-3 bg-background/80">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="capitalize">
                {selectedSegment.type.replace(/_/g, " ")}
              </Badge>
              <span className="text-sm font-medium">
                Segment {selectedSegment.id}
              </span>
            </div>

            <Badge
              variant={
                selectedSegment.status === "generated" ? "outline" : "secondary"
              }
            >
              {selectedSegment.status}
            </Badge>
          </div>

          <SegmentPlayer segment={selectedSegment} />

          <div className="mt-3 text-sm text-muted-foreground border-t pt-2">
            <div className="line-clamp-3">{selectedSegment.content}</div>
          </div>

          <div className="mt-2 flex justify-between items-center">
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => {
                const currentIndex = audioSegments.findIndex(
                  (s) => s.id === selectedSegment.id
                );
                if (currentIndex > 0) {
                  const prevSegment = audioSegments[currentIndex - 1];
                  setSelectedSegment(prevSegment);
                  scrollToSegment(prevSegment.id);
                }
              }}
              disabled={
                audioSegments.findIndex((s) => s.id === selectedSegment.id) ===
                0
              }
            >
              Previous
            </Button>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="text-xs">
                  <Info className="h-3 w-3 mr-1" /> Detailed Info
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Segment {selectedSegment.id} Details</SheetTitle>
                  <SheetDescription>
                    {selectedSegment.type.replace(/_/g, " ")} •{" "}
                    {formatDuration(selectedSegment.timing)}
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-4">
                  <div>
                    <h3 className="text-sm font-medium mb-1">Audio</h3>
                    <SegmentPlayer segment={selectedSegment} />
                  </div>

                  <div>
                    <h3 className="text-sm font-medium mb-1">Content</h3>
                    <div className="text-sm p-3 bg-muted/30 rounded-md">
                      {selectedSegment.content}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium mb-1">Status</h3>
                      <Badge
                        variant={
                          selectedSegment.status === "generated"
                            ? "outline"
                            : "secondary"
                        }
                      >
                        {selectedSegment.status}
                      </Badge>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium mb-1">Order</h3>
                      <span className="text-sm">{selectedSegment.order}</span>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium mb-1">Type</h3>
                      <Badge variant="outline" className="capitalize">
                        {selectedSegment.type.replace(/_/g, " ")}
                      </Badge>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium mb-1">Duration</h3>
                      <span className="text-sm">
                        {formatDuration(selectedSegment.timing)}
                      </span>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => {
                const currentIndex = audioSegments.findIndex(
                  (s) => s.id === selectedSegment.id
                );
                if (currentIndex < audioSegments.length - 1) {
                  const nextSegment = audioSegments[currentIndex + 1];
                  setSelectedSegment(nextSegment);
                  scrollToSegment(nextSegment.id);
                }
              }}
              disabled={
                audioSegments.findIndex((s) => s.id === selectedSegment.id) ===
                audioSegments.length - 1
              }
            >
              Next
            </Button>
          </div>

          <div className="mt-3 flex justify-center gap-4 text-xs text-muted-foreground border-t pt-2">
            <div className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-muted rounded">←</kbd>
              <span>Previous</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-muted rounded">→</kbd>
              <span>Next</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-muted rounded">Space</kbd>
              <span>Play/Pause</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScriptAudioToolView;

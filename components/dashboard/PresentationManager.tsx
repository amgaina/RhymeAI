"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Presentation,
  Upload,
  Eye,
  Edit,
  Plus,
  RefreshCcw,
  Trash2,
  ArrowRight,
  FileText,
  Image,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScriptSegment } from "@/types/event";

interface PresentationManagerProps {
  segments: ScriptSegment[];
  onGenerateSlides: () => void;
  onUpdateSlide?: (segmentId: number, slidePath: string) => void;
  onPreviewSlide?: (slidePath: string) => void;
}

export default function PresentationManager({
  segments,
  onGenerateSlides,
  onUpdateSlide,
  onPreviewSlide,
}: PresentationManagerProps) {
  const [uploadMode, setUploadMode] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Handle slide generation for all segments
  const handleGenerateSlides = () => {
    setIsGenerating(true);

    // Call the actual generation function
    onGenerateSlides();

    // For demo purposes, let's simulate the generation
    setTimeout(() => {
      setIsGenerating(false);
    }, 3000);
  };

  // Format time to MM:SS
  const formatTime = (time?: number) => {
    if (!time) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Presentation Management</CardTitle>
            <CardDescription>
              Upload or generate presentation slides from your script
            </CardDescription>
          </div>
          <Button
            disabled={isGenerating || segments.length === 0}
            onClick={handleGenerateSlides}
            className="flex items-center gap-2"
          >
            {isGenerating ? (
              <>
                <RefreshCcw className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Presentation className="h-4 w-4" />
                Generate Slides
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {segments.length === 0 ? (
          <div className="border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center">
            <Presentation className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">
              No Script Segments Available
            </h3>
            <p className="text-sm text-gray-500 text-center mb-4">
              Create script segments first to generate slides or upload a
              presentation
            </p>
          </div>
        ) : (
          <>
            {uploadMode ? (
              <div className="border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center">
                <Upload className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  Upload Presentation
                </h3>
                <p className="text-sm text-gray-500 text-center mb-4">
                  Supported formats: PowerPoint, PDF, or Google Slides
                </p>
                <div className="flex items-center gap-4 w-full max-w-md mb-4">
                  <Input type="file" className="flex-1" accept=".pptx,.pdf" />
                  <Button>Upload</Button>
                </div>
                <Button
                  variant="link"
                  onClick={() => setUploadMode(false)}
                  className="text-sm"
                >
                  Cancel and return to slides view
                </Button>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Slide Synchronization</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setUploadMode(true)}
                    className="flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Upload Presentation
                  </Button>
                </div>

                <div className="space-y-3">
                  {segments.map((segment) => (
                    <div
                      key={segment.id}
                      className="border rounded-md p-3 flex flex-col sm:flex-row sm:items-center gap-3"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium capitalize">
                            {segment.type}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {formatTime(segment.timing)}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-700 line-clamp-2">
                          {segment.content}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        {segment.presentationSlide ? (
                          <div className="flex items-center gap-2">
                            <div className="bg-primary/5 w-10 h-10 rounded flex items-center justify-center">
                              <Image className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs text-gray-500">
                                Slide
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="text-sm truncate max-w-[120px]">
                                  {segment.presentationSlide}
                                </span>
                                <div className="flex gap-1">
                                  {onPreviewSlide && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 w-6 p-0"
                                      onClick={() =>
                                        onPreviewSlide(
                                          segment.presentationSlide!
                                        )
                                      }
                                    >
                                      <Eye className="h-3 w-3" />
                                    </Button>
                                  )}
                                  {onUpdateSlide && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 w-6 p-0"
                                      onClick={() =>
                                        onUpdateSlide(segment.id, "")
                                      }
                                    >
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-xs flex items-center gap-1"
                              onClick={() => onGenerateSlides()}
                            >
                              <Plus className="h-3 w-3" />
                              Add Slide
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-4 border-t">
                  <div className="text-sm text-gray-500">
                    {segments.filter((s) => s.presentationSlide).length} of{" "}
                    {segments.length} segments have slides
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      <Eye className="h-4 w-4" />
                      Preview All
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      <FileText className="h-4 w-4" />
                      Export
                    </Button>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

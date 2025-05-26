"use client";
import { useState, useEffect } from "react";
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
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScriptSegment } from "@/types/event";

// Array of random presentation slide images from Pixabay
const PIXABAY_SLIDE_IMAGES = [
  "/slides/slide1.png",
  "/slides/slide2.png",
  "/slides/slide3.png",
  "/slides/slide4.png",
];

interface PresentationManagerProps {
  segments: ScriptSegment[];
  onGenerateSlides: () => void;
  onUpdateSlide?: (segmentId: number, slidePath: string) => void;
  onPreviewSlide?: (slidePath: string) => void;
}

export default function PresentationManager({
  segments: initialSegments,
  onGenerateSlides,
  onUpdateSlide,
  onPreviewSlide,
}: PresentationManagerProps) {
  const [uploadMode, setUploadMode] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [segments, setSegments] = useState<ScriptSegment[]>(
    initialSegments.sort((a, b) => a.order - b.order)
  );
  const [slideModal, setSlideModal] = useState<{ show: boolean; url: string }>({
    show: false,
    url: "",
  });
  const [slideshowMode, setSlideshowMode] = useState<boolean>(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [slideshowInterval, setSlideshowInterval] =
    useState<NodeJS.Timeout | null>(null);

  // Update local segments when props change
  useEffect(() => {
    setSegments(initialSegments);
  }, [initialSegments]);

  // Effect for auto-advancing slides in slideshow mode
  useEffect(() => {
    if (isPlaying && slideshowMode) {
      const interval = setInterval(() => {
        setCurrentSlideIndex((prevIndex) => {
          const slidesWithPresentations = segments.filter(
            (s) => s.presentationSlide
          );
          return (prevIndex + 1) % slidesWithPresentations.length;
        });
      }, 3000); // Change slide every 3 seconds

      setSlideshowInterval(interval);

      return () => {
        if (interval) clearInterval(interval);
      };
    } else if (slideshowInterval) {
      clearInterval(slideshowInterval);
      setSlideshowInterval(null);
    }
  }, [isPlaying, slideshowMode, segments]);

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (slideshowInterval) {
        clearInterval(slideshowInterval);
      }
    };
  }, [slideshowInterval]);

  // Get a slide image based on segment index
  const getRandomSlideImage = (segmentIndex = 0) => {
    // Use modulo to wrap around if there are fewer images than segments
    const imageIndex = segmentIndex % PIXABAY_SLIDE_IMAGES.length;
    return PIXABAY_SLIDE_IMAGES[imageIndex];
  };

  // Handle slide generation for all segments
  const handleGenerateSlides = () => {
    setIsGenerating(true);

    // Call the parent's generation function
    onGenerateSlides();

    // Assign slide images based on segment index
    const updatedSegments = segments.map((segment, index) => ({
      ...segment,
      presentationSlide: getRandomSlideImage(index),
    }));

    // For demo purposes, let's simulate the generation
    setTimeout(() => {
      setSegments(updatedSegments);
      setIsGenerating(false);
    }, 3000);
  };

  // Handle preview slide
  const handlePreviewSlide = (slidePath: string) => {
    setSlideModal({ show: true, url: slidePath });
    if (onPreviewSlide) {
      onPreviewSlide(slidePath);
    }
  };

  // Start slideshow preview of all slides
  const handleStartSlideshow = () => {
    const slidesWithPresentations = segments.filter((s) => s.presentationSlide);

    if (slidesWithPresentations.length === 0) {
      // No slides to show, generate them first
      handleGenerateSlides();
      return;
    }

    setCurrentSlideIndex(0);
    setSlideshowMode(true);
    setIsPlaying(true);
  };

  // Navigate to previous slide in slideshow
  const handlePrevSlide = () => {
    setCurrentSlideIndex((prevIndex) => {
      const slidesWithPresentations = segments.filter(
        (s) => s.presentationSlide
      );
      return (
        (prevIndex - 1 + slidesWithPresentations.length) %
        slidesWithPresentations.length
      );
    });
  };

  // Navigate to next slide in slideshow
  const handleNextSlide = () => {
    setCurrentSlideIndex((prevIndex) => {
      const slidesWithPresentations = segments.filter(
        (s) => s.presentationSlide
      );
      return (prevIndex + 1) % slidesWithPresentations.length;
    });
  };

  // Toggle play/pause of slideshow
  const togglePlayPause = () => {
    setIsPlaying((prev) => !prev);
  };

  // Format time to MM:SS
  const formatTime = (time?: number) => {
    if (!time) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  return (
    <>
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
                    <h3 className="text-lg font-medium">
                      Slide Synchronization
                    </h3>
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
                              <div className="bg-primary/5 w-10 h-10 rounded flex items-center justify-center overflow-hidden">
                                {segment.presentationSlide ? (
                                  segment.presentationSlide.startsWith(
                                    "http"
                                  ) ? (
                                    <img
                                      src={segment.presentationSlide}
                                      alt="Slide preview"
                                      className="object-cover w-full h-full"
                                    />
                                  ) : (
                                    <img
                                      src={segment.presentationSlide}
                                      alt="Slide preview"
                                      className="object-cover w-full h-full"
                                    />
                                  )
                                ) : (
                                  <Image className="h-5 w-5 text-primary" />
                                )}
                              </div>
                              <div className="flex flex-col">
                                <span className="text-xs text-gray-500">
                                  Slide
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm truncate max-w-[120px]">
                                    {segment.presentationSlide?.startsWith(
                                      "http"
                                    )
                                      ? "Online Slide"
                                      : segment.presentationSlide?.includes(
                                          "/slides/"
                                        )
                                      ? `Slide ${
                                          segment.presentationSlide
                                            .split("/slides/slide")[1]
                                            ?.split(".")[0] || ""
                                        }`
                                      : segment.presentationSlide}
                                  </span>
                                  <div className="flex gap-1">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 w-6 p-0"
                                      onClick={() =>
                                        handlePreviewSlide(
                                          segment.presentationSlide!
                                        )
                                      }
                                    >
                                      <Eye className="h-3 w-3" />
                                    </Button>
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
                                onClick={() => {
                                  // Find the index of this segment in the array
                                  const segmentIndex = segments.findIndex(
                                    (s) => s.id === segment.id
                                  );
                                  const slideImage =
                                    getRandomSlideImage(segmentIndex);

                                  setSegments((prevSegments) =>
                                    prevSegments.map((s) =>
                                      s.id === segment.id
                                        ? {
                                            ...s,
                                            presentationSlide: slideImage,
                                          }
                                        : s
                                    )
                                  );
                                }}
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
                        onClick={handleStartSlideshow}
                        disabled={
                          segments.filter((s) => s.presentationSlide).length ===
                          0
                        }
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

      {/* Modal for slide preview */}
      {slideModal.show && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSlideModal({ show: false, url: "" })}
        >
          <div
            className="bg-white rounded-lg overflow-hidden max-w-4xl max-h-[90vh] w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-medium">Slide Preview</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSlideModal({ show: false, url: "" })}
              >
                ✕
              </Button>
            </div>
            <div className="p-4 flex items-center justify-center bg-gray-100">
              <img
                src={slideModal.url}
                alt="Slide preview"
                className="max-w-full max-h-[70vh] object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {/* Slideshow Modal */}
      {slideshowMode && (
        <div className="fixed inset-0 bg-black flex flex-col z-50">
          {/* Slideshow Controls */}
          <div className="p-4 flex justify-between items-center text-white">
            <div className="flex items-center gap-2">
              <h3 className="font-medium">Presentation Slideshow</h3>
              <Badge variant="outline" className="text-white border-white">
                {currentSlideIndex + 1} /{" "}
                {segments.filter((s) => s.presentationSlide).length}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
              onClick={() => {
                setSlideshowMode(false);
                setIsPlaying(false);
              }}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Slide Content */}
          <div className="flex-1 flex items-center justify-center p-4">
            {segments.filter((s) => s.presentationSlide)[currentSlideIndex] && (
              <img
                src={
                  segments.filter((s) => s.presentationSlide)[currentSlideIndex]
                    .presentationSlide
                }
                alt={`Slide ${currentSlideIndex + 1}`}
                className="max-h-full max-w-full object-contain"
              />
            )}
          </div>

          {/* Navigation Controls */}
          <div className="p-6 flex justify-center items-center gap-6 text-white">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full h-12 w-12 bg-white/10 hover:bg-white/20 text-white"
              onClick={handlePrevSlide}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="rounded-full h-12 w-12 bg-white/10 hover:bg-white/20 text-white"
              onClick={togglePlayPause}
            >
              {isPlaying ? (
                <div className="h-6 w-6 flex items-center justify-center">
                  <div className="w-1 h-4 bg-white mx-0.5"></div>
                  <div className="w-1 h-4 bg-white mx-0.5"></div>
                </div>
              ) : (
                <div className="h-6 w-6 flex items-center justify-center">
                  <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-white border-b-[6px] border-b-transparent ml-1"></div>
                </div>
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="rounded-full h-12 w-12 bg-white/10 hover:bg-white/20 text-white"
              onClick={handleNextSlide}
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </div>

          {/* Segment Content */}
          <div className="p-4 bg-black/40">
            {segments.filter((s) => s.presentationSlide)[currentSlideIndex] && (
              <div className="text-white max-w-3xl mx-auto">
                <div className="font-medium mb-1">
                  {
                    segments.filter((s) => s.presentationSlide)[
                      currentSlideIndex
                    ].type
                  }
                </div>
                <p className="text-sm opacity-90">
                  {
                    segments.filter((s) => s.presentationSlide)[
                      currentSlideIndex
                    ].content
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

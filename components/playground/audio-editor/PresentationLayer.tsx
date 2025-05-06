"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Upload,
  Plus,
  Presentation,
  ArrowRight,
  Eye,
  Clock,
  ChevronLeft,
  ChevronRight,
  X,
  Edit,
  Trash,
  Image,
  File,
  Move,
  Check,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface PresentationSlide {
  id: number;
  title: string;
  time: number;
  imageUrl: string;
  notes?: string;
}

interface PresentationLayerProps {
  currentTime: number;
  duration: number;
  onAddSlideMarker: (time: number, slide: Partial<PresentationSlide>) => void;
  onUpdateSlide?: (slideId: number, slide: Partial<PresentationSlide>) => void;
  onRemoveSlide?: (slideId: number) => void;
}

// Mock presentation slides
const initialSlides: PresentationSlide[] = [
  {
    id: 1,
    title: "Event Introduction",
    time: 0,
    imageUrl: "https://placehold.co/800x450/4f46e5/ffffff?text=Introduction",
    notes:
      "Welcome everyone to our event. This slide introduces the main theme.",
  },
  {
    id: 2,
    title: "Agenda Overview",
    time: 15,
    imageUrl: "https://placehold.co/800x450/10b981/ffffff?text=Agenda",
    notes: "Overview of what we'll cover today.",
  },
  {
    id: 3,
    title: "Speaker Introduction",
    time: 30,
    imageUrl: "https://placehold.co/800x450/f59e0b/ffffff?text=Speakers",
    notes: "Brief introduction of our guest speakers.",
  },
  {
    id: 4,
    title: "Key Announcements",
    time: 45,
    imageUrl: "https://placehold.co/800x450/ef4444/ffffff?text=Announcements",
    notes: "Important updates and announcements.",
  },
];

export default function PresentationLayer({
  currentTime,
  duration,
  onAddSlideMarker,
  onUpdateSlide,
  onRemoveSlide,
}: PresentationLayerProps) {
  const [slides, setSlides] = useState<PresentationSlide[]>(initialSlides);
  const [uploadedSlides, setUploadedSlides] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState<number | null>(null);
  const [editingSlide, setEditingSlide] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<{
    title: string;
    notes: string;
  }>({
    title: "",
    notes: "",
  });
  const timelineRef = useRef<HTMLDivElement>(null);

  // Format time as MM:SS
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // Get active slide based on current time
  const getActiveSlide = () => {
    // Sort slides by time in descending order to find the closest one
    const sortedSlides = [...slides].sort((a, b) => b.time - a.time);
    for (const slide of sortedSlides) {
      if (currentTime >= slide.time) {
        return slide;
      }
    }
    return slides[0];
  };

  const activeSlide = getActiveSlide();

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const imageFiles = Array.from(files).filter(
        (file) =>
          file.type.startsWith("image/") ||
          file.type === "application/pdf" ||
          file.type.includes("presentation")
      );

      if (imageFiles.length > 0) {
        setUploadedSlides((prev) => [...prev, ...imageFiles]);
        toast.success(
          `${imageFiles.length} slide${
            imageFiles.length > 1 ? "s" : ""
          } uploaded`
        );
      } else {
        toast.error("Please upload images, PDFs, or presentation files");
      }
    }
  };

  // Add a slide at the current time
  const handleAddSlide = (imageUrl: string, title: string = "New Slide") => {
    const newSlide: PresentationSlide = {
      id: slides.length > 0 ? Math.max(...slides.map((s) => s.id)) + 1 : 1,
      title,
      time: currentTime,
      imageUrl,
      notes: "",
    };

    setSlides((prev) => [...prev, newSlide]);
    onAddSlideMarker(currentTime, newSlide);
    toast.success(`Added slide at ${formatTime(currentTime)}`);
  };

  // Handle slide drag for timeline positioning
  const handleDragStart = (e: React.DragEvent, slideId: number) => {
    e.dataTransfer.setData("slideId", slideId.toString());
    setIsDragging(slideId);
  };

  const handleTimelineDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleTimelineDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const slideId = Number(e.dataTransfer.getData("slideId"));
    if (!timelineRef.current) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTime = (clickX / rect.width) * duration;

    setSlides((prev) =>
      prev.map((slide) =>
        slide.id === slideId ? { ...slide, time: newTime } : slide
      )
    );

    if (onUpdateSlide) {
      onUpdateSlide(slideId, { time: newTime });
    }

    setIsDragging(null);
    toast.success(`Moved slide to ${formatTime(newTime)}`);
  };

  // Handle editing a slide
  const startEditingSlide = (slide: PresentationSlide) => {
    setEditingSlide(slide.id);
    setEditFormData({
      title: slide.title,
      notes: slide.notes || "",
    });
  };

  const saveEditingSlide = () => {
    if (editingSlide === null) return;

    setSlides((prev) =>
      prev.map((slide) =>
        slide.id === editingSlide
          ? { ...slide, title: editFormData.title, notes: editFormData.notes }
          : slide
      )
    );

    if (onUpdateSlide) {
      onUpdateSlide(editingSlide, {
        title: editFormData.title,
        notes: editFormData.notes,
      });
    }

    setEditingSlide(null);
    toast.success("Slide updated");
  };

  // Handle removing a slide
  const handleRemoveSlide = (slideId: number) => {
    setSlides((prev) => prev.filter((slide) => slide.id !== slideId));

    if (onRemoveSlide) {
      onRemoveSlide(slideId);
    }

    toast.success("Slide removed");
  };

  // Navigate to previous/next slide
  const goToPrevSlide = () => {
    if (!activeSlide) return;

    const sortedSlides = [...slides].sort((a, b) => a.time - b.time);
    const currentIndex = sortedSlides.findIndex((s) => s.id === activeSlide.id);

    if (currentIndex > 0) {
      const prevSlide = sortedSlides[currentIndex - 1];
      toast.info(`Navigating to "${prevSlide.title}"`);
    }
  };

  const goToNextSlide = () => {
    if (!activeSlide) return;

    const sortedSlides = [...slides].sort((a, b) => a.time - b.time);
    const currentIndex = sortedSlides.findIndex((s) => s.id === activeSlide.id);

    if (currentIndex < sortedSlides.length - 1) {
      const nextSlide = sortedSlides[currentIndex + 1];
      toast.info(`Navigating to "${nextSlide.title}"`);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="timeline" className="w-full">
        <TabsList className="grid grid-cols-2">
          <TabsTrigger value="timeline">Slide Timeline</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="space-y-4">
          {/* Slide timeline visualization */}
          <div
            ref={timelineRef}
            className="relative h-16 bg-muted rounded-md"
            onDragOver={handleTimelineDragOver}
            onDrop={handleTimelineDrop}
          >
            {/* Time markers */}
            {Array.from({ length: Math.ceil(duration / 10) + 1 }).map(
              (_, i) => (
                <div
                  key={i}
                  className="absolute top-0 h-full border-l border-border/30 pointer-events-none"
                  style={{
                    left: `${((i * 10) / duration) * 100}%`,
                    opacity: i % 3 === 0 ? 0.7 : 0.3,
                  }}
                >
                  {i % 3 === 0 && (
                    <div className="text-xs text-muted-foreground absolute -left-3 top-0 select-none">
                      {formatTime(i * 10)}
                    </div>
                  )}
                </div>
              )
            )}

            {slides.map((slide) => (
              <div
                key={slide.id}
                draggable
                onDragStart={(e) => handleDragStart(e, slide.id)}
                className={`absolute h-12 top-2 cursor-move rounded-md border transition-all flex items-center z-10 ${
                  slide.id === activeSlide?.id
                    ? "border-primary bg-primary/20"
                    : "border-accent bg-accent/10"
                } ${isDragging === slide.id ? "opacity-50" : "opacity-100"}`}
                style={{
                  left: `${(slide.time / duration) * 100}%`,
                  width: "120px",
                  marginLeft: "-60px", // Center the slide on the time point
                }}
                title={`${slide.title} at ${formatTime(slide.time)}`}
              >
                <div className="w-full h-full flex items-center justify-between px-2">
                  <div className="w-8 h-8 flex-shrink-0 bg-background rounded overflow-hidden">
                    <img
                      src={slide.imageUrl}
                      alt={slide.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 truncate px-1 text-xs">
                    {slide.title}
                  </div>
                  <Move className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
                </div>
              </div>
            ))}

            {/* Current time indicator */}
            <div
              className="absolute top-0 h-full w-0.5 bg-primary z-20"
              style={{ left: `${(currentTime / duration) * 100}%` }}
            />

            {/* Add slide at current position button */}
            <Button
              variant="ghost"
              size="sm"
              className="absolute bottom-1 right-2 h-6 opacity-70 hover:opacity-100 bg-background/80"
              onClick={() => {
                const defaultImage = `https://placehold.co/800x450/${Math.floor(
                  Math.random() * 999
                )}/ffffff?text=Slide`;
                handleAddSlide(defaultImage);
              }}
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Slide Here
            </Button>
          </div>

          {/* Slides list */}
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {slides.length === 0 ? (
              <div className="text-center text-muted-foreground py-8 border border-dashed rounded-md">
                No slides yet. Add your first slide by clicking "Add Slide Here"
                on the timeline.
              </div>
            ) : (
              [...slides]
                .sort((a, b) => a.time - b.time)
                .map((slide) => (
                  <div
                    key={slide.id}
                    className={`flex items-center gap-3 p-2 rounded-md ${
                      slide.id === activeSlide?.id
                        ? "bg-accent/10"
                        : "hover:bg-muted"
                    } ${
                      editingSlide === slide.id
                        ? "border-2 border-primary"
                        : "border border-border/50"
                    }`}
                  >
                    {editingSlide === slide.id ? (
                      <div className="w-full space-y-2 p-2">
                        <div className="space-y-1">
                          <Label htmlFor={`slide-title-${slide.id}`}>
                            Slide Title
                          </Label>
                          <Input
                            id={`slide-title-${slide.id}`}
                            value={editFormData.title}
                            onChange={(e) =>
                              setEditFormData((prev) => ({
                                ...prev,
                                title: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor={`slide-notes-${slide.id}`}>
                            Notes
                          </Label>
                          <Input
                            id={`slide-notes-${slide.id}`}
                            value={editFormData.notes}
                            onChange={(e) =>
                              setEditFormData((prev) => ({
                                ...prev,
                                notes: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="flex justify-end gap-2 mt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingSlide(null)}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Cancel
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={saveEditingSlide}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Save
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="w-16 h-16 flex-shrink-0 bg-muted rounded-md overflow-hidden relative group">
                          <img
                            src={slide.imageUrl}
                            alt={slide.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 bg-white/20 hover:bg-white/40 text-white"
                              onClick={() => {
                                toast.info("Slide preview clicked");
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="flex-1">
                          <div className="font-medium">{slide.title}</div>
                          <div className="flex items-center text-xs text-muted-foreground gap-2">
                            <Clock className="h-3 w-3" />
                            <span>{formatTime(slide.time)}</span>
                          </div>
                          {slide.notes && (
                            <div className="text-xs text-muted-foreground mt-1 line-clamp-1">
                              {slide.notes}
                            </div>
                          )}
                        </div>

                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => startEditingSlide(slide)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleRemoveSlide(slide.id)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))
            )}
          </div>

          <div className="flex justify-between">
            <div className="relative">
              <Input
                type="file"
                className="hidden"
                id="slide-upload"
                accept="image/*,.pptx,.ppt,.pdf"
                multiple
                onChange={handleFileUpload}
              />
              <Button asChild variant="outline">
                <label
                  htmlFor="slide-upload"
                  className="cursor-pointer flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Import Slides
                </label>
              </Button>
            </div>

            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => {
                const defaultImage = `https://placehold.co/800x450/${Math.floor(
                  Math.random() * 999
                )}/ffffff?text=Slide`;
                handleAddSlide(defaultImage);
              }}
            >
              <Plus className="h-4 w-4" />
              Add at Current Time
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          <Card>
            <CardContent className="p-6 flex flex-col items-center">
              {activeSlide ? (
                <>
                  <div className="mb-4 w-full max-w-2xl aspect-video bg-muted rounded-md overflow-hidden shadow-md">
                    <img
                      src={activeSlide.imageUrl}
                      alt={activeSlide.title}
                      className="w-full h-full object-contain bg-black"
                    />
                  </div>

                  <div className="w-full max-w-2xl space-y-2">
                    <h3 className="text-lg font-medium text-center">
                      {activeSlide.title}
                    </h3>
                    {activeSlide.notes && (
                      <p className="text-sm text-muted-foreground text-center border-t border-b py-2">
                        {activeSlide.notes}
                      </p>
                    )}
                    <Progress
                      value={(currentTime / duration) * 100}
                      className="h-1"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" size="sm" onClick={goToPrevSlide}>
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous Slide
                    </Button>
                    <Button variant="outline" size="sm" onClick={goToNextSlide}>
                      Next Slide
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </>
              ) : (
                <div className="py-12 text-center">
                  <Presentation className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No slides available</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Add slides using the timeline tab to preview your
                    presentation
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {activeSlide ? (
                <>
                  Slide {slides.findIndex((s) => s.id === activeSlide.id) + 1}{" "}
                  of {slides.length}
                </>
              ) : (
                <>No slides</>
              )}
            </span>

            <Button variant="default" className="flex items-center gap-2">
              <Presentation className="h-4 w-4" />
              Full Screen Preview
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Uploaded slides preview */}
      {uploadedSlides.length > 0 && (
        <div className="border-t pt-4">
          <h3 className="font-medium mb-2 flex items-center">
            <Image className="h-4 w-4 mr-2" />
            Uploaded Media ({uploadedSlides.length})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {uploadedSlides.map((file, index) => (
              <div
                key={index}
                className="border rounded-md p-2 hover:border-primary transition-colors cursor-pointer group"
                onClick={() => {
                  const fileUrl = URL.createObjectURL(file);
                  handleAddSlide(fileUrl, file.name.split(".")[0]);
                }}
              >
                <div className="aspect-video bg-muted rounded mb-1 overflow-hidden relative">
                  {file.type.startsWith("image/") ? (
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <File className="h-8 w-8" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Plus className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="text-xs truncate">{file.name}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

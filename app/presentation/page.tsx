"use client";

import { Button } from "@/components/ui/button";
import { Download, Eye, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import PPTXgen from "pptxgenjs";
import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogClose,
} from "@/components/ui/dialog";

export default function PresentationGenerator() {
    const { toast } = useToast();
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    const createPresentation = () => {
        const pptx = new PPTXgen();

        // Set presentation properties
        pptx.title = "TechForward 2025";
        pptx.author = "AI Event Emcee";
        pptx.company = "TechForward";
        pptx.theme = {
            bodyFontFace: "Arial",
        };

        // Slide 1: Title Slide
        const titleSlide = pptx.addSlide();
        titleSlide.background = { fill: "0056b3" };
        titleSlide.addText("TechForward 2025", {
            x: 0.5,
            y: 1,
            w: 9,
            h: 1.5,
            align: "center",
            fontSize: 44,
            bold: true,
            color: "FFFFFF",
            fontFace: "Arial"
        });
        titleSlide.addText("The Future of Technology", {
            x: 0.5,
            y: 2.5,
            w: 9,
            h: 0.8,
            align: "center",
            fontSize: 28,
            color: "FFFFFF",
            fontFace: "Arial"
        });
        titleSlide.addText("September 15, 2025 | Grand Convention Center, San Francisco", {
            x: 0.5,
            y: 4.5,
            w: 9,
            h: 0.5,
            align: "center",
            fontSize: 14,
            color: "FFFFFF",
            fontFace: "Arial"
        });

        // Slide 2: Event Overview
        const overviewSlide = pptx.addSlide();
        overviewSlide.addText("Event Overview", {
            x: 0.5,
            y: 0.5,
            w: 9,
            h: 0.8,
            fontSize: 32,
            bold: true,
            color: "0056b3"
        });

        const bulletPoints = [
            "Date: September 15, 2025",
            "Location: Grand Convention Center, San Francisco",
            "Expected attendees: 250+ professionals",
            "Format: Keynotes, panels, and breakout sessions"
        ];

        overviewSlide.addText(bulletPoints.map(point => ({ text: point, options: { bullet: true } })), {
            x: 0.5,
            y: 3,
            w: 9,
            h: 2,
            fontSize: 18,
            margin: 0.5
        });

        // Slide 3: Key Themes
        const themesSlide = pptx.addSlide();
        themesSlide.addText("Key Themes", {
            x: 0.5,
            y: 0.5,
            w: 9,
            h: 0.8,
            fontSize: 32,
            bold: true,
            color: "0056b3"
        });

        const themeItems = [
            { text: "AI Technologies", options: { bullet: true, fontSize: 20 } },
            { text: "Machine learning advancements", options: { bullet: true, level: 1 } },
            { text: "Ethical AI frameworks", options: { bullet: true, level: 1 } },
            { text: "Blockchain Innovation", options: { bullet: true, fontSize: 20 } },
            { text: "Web3 applications", options: { bullet: true, level: 1 } },
            { text: "Decentralized finance", options: { bullet: true, level: 1 } },
            { text: "Cybersecurity Trends", options: { bullet: true, fontSize: 20 } },
            { text: "Threat intelligence", options: { bullet: true, level: 1 } },
            { text: "Zero trust architectures", options: { bullet: true, level: 1 } }
        ];

        themesSlide.addText(themeItems, {
            x: 0.5,
            y: 2.5,
            w: 9,
            h: 4,
            margin: 0.3
        });

        // Slide 4: Featured Speakers
        const speakersSlide = pptx.addSlide();
        speakersSlide.addText("Featured Speakers", {
            x: 0.5,
            y: 0.5,
            w: 9,
            h: 0.8,
            fontSize: 32,
            bold: true,
            color: "0056b3"
        });

        // Speaker 1
        speakersSlide.addText("Dr. Amelia Zhang", {
            x: 0.5,
            y: 1.5,
            w: 4,
            h: 0.5,
            fontSize: 22,
            bold: true
        });
        speakersSlide.addText("Chief AI Scientist at InnovateX", {
            x: 0.5,
            y: 2,
            w: 4,
            h: 0.5,
            fontSize: 16,
            color: "555555"
        });

        // Speaker 2
        speakersSlide.addText("Mr. Jonathan Reyes", {
            x: 5,
            y: 1.5,
            w: 4,
            h: 0.5,
            fontSize: 22,
            bold: true
        });
        speakersSlide.addText("CEO of FutureBlock Solutions", {
            x: 5,
            y: 2,
            w: 4,
            h: 0.5,
            fontSize: 16,
            color: "555555"
        });

        // Speaker 3
        speakersSlide.addText("Ms. Priya Das", {
            x: 0.5,
            y: 3.5,
            w: 4,
            h: 0.5,
            fontSize: 22,
            bold: true
        });
        speakersSlide.addText("Cybersecurity Lead at SecureNet Global", {
            x: 0.5,
            y: 4,
            w: 4,
            h: 0.5,
            fontSize: 16,
            color: "555555"
        });

        // Slide 5: Event Schedule
        const scheduleSlide = pptx.addSlide();
        scheduleSlide.addText("Event Schedule", {
            x: 0.5,
            y: 0.5,
            w: 9,
            h: 0.8,
            fontSize: 32,
            bold: true,
            color: "0056b3"
        });

        const scheduleData = [
            ["Time", "Session"], // Header row
            ["9:00 AM", "Registration & Welcome Coffee"],
            ["10:00 AM", "Opening Keynote: The Future of AI"],
            ["11:30 AM", "Blockchain Innovation Panel"],
            ["1:00 PM", "Networking Lunch"],
            ["2:30 PM", "Cybersecurity Deep Dive"],
            ["4:00 PM", "Startup Showcase"],
            ["5:30 PM", "Closing Remarks & Cocktails"]
        ];

        scheduleSlide.addTable(scheduleData.map(row => row.map(cell => ({ text: cell }))), {
            x: 0.5,
            y: 1.5,
            w: 9,
            colW: [2, 7],
            fontSize: 14,
            border: { type: "solid", pt: 1, color: "cccccc" },
            rowH: [0.5, ...Array(scheduleData.length - 1).fill(0.4)], // Adjust row heights for header and body
            fill: { color: "0056b3" },
            color: "FFFFFF",
        });

        // Slide 6: Closing Slide
        const closingSlide = pptx.addSlide();
        closingSlide.background = { fill: "0056b3" };
        closingSlide.addText("Thank You!", {
            x: 0.5,
            y: 2,
            w: 9,
            h: 1.5,
            align: "center",
            fontSize: 48,
            bold: true,
            color: "FFFFFF"
        });
        closingSlide.addText("We look forward to seeing you at TechForward 2025", {
            x: 0.5,
            y: 3.5,
            w: 9,
            h: 0.8,
            align: "center",
            fontSize: 20,
            color: "FFFFFF"
        });

        return pptx;
    };

    const handleDownload = async () => {
        setIsGenerating(true);
        try {
            const pptx = createPresentation();
            pptx.writeFile({ fileName: "TechForward_2025_Presentation.pptx" });
            toast({
                title: "Presentation Downloaded!",
                description: "Your TechForward 2025 PPTX file has been downloaded.",
            });
        } catch (error) {
            console.error("Error generating presentation:", error);
            toast({
                title: "Error",
                description: "Failed to generate presentation.",
                variant: "destructive",
            });
        } finally {
            setIsGenerating(false);
        }
    };

    const handlePreview = async () => {
        setIsGenerating(true);
        try {
            const pptx = createPresentation();
            const blob = await pptx.write({ outputType: "blob" }) as Blob;
            const url = URL.createObjectURL(blob);
            setPreviewUrl(url);
            setIsOpen(true);
        } catch (error) {
            console.error("Error generating presentation:", error);
            toast({
                title: "Error",
                description: "Failed to generate presentation preview.",
                variant: "destructive",
            });
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="flex flex-col items-center py-8 gap-4">
            <div className="flex gap-4">
                <Button
                    size="lg"
                    className="bg-cta hover:bg-cta/90 text-white"
                    onClick={handleDownload}
                    disabled={isGenerating}
                >
                    {isGenerating ? (
                        "Generating..."
                    ) : (
                        <p className="flex items-center text-accent">
                            <Download className="h-5 w-5 mr-2 text-accent" />
                            Download PPTX
                        </p>
                    )}
                </Button>

                <Button
                    size="lg"
                    variant="outline"
                    onClick={handlePreview}
                    disabled={isGenerating}
                >
                    {isGenerating ? (
                        "Generating..."
                    ) : (
                        <>
                            <Eye className="h-5 w-5 mr-2" />
                            View Online
                        </>
                    )}
                </Button>
            </div>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="max-w-[90vw] h-[90vh] p-0">
                    <DialogHeader className="p-6 pb-2">
                        <div className="flex justify-between items-center">
                            <DialogTitle>TechForward 2025 Presentation</DialogTitle>
                            <DialogClose className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none">
                                <X className="h-4 w-4" />
                                <span className="sr-only">Close</span>
                            </DialogClose>
                        </div>
                    </DialogHeader>
                    <div className="h-full w-full p-6 pt-0">
                        {previewUrl && (
                            <div className="w-full h-full border rounded-lg overflow-hidden">
                                <iframe
                                    src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(previewUrl)}`}
                                    className="w-full h-full border-none"
                                    title="Presentation Preview"
                                    allowFullScreen
                                />
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
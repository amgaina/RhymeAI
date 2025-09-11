import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, CheckCircle, ChevronRight, FileText } from "lucide-react";

interface FileUploadProps {
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onContinue: () => void;
}

export default function FileUpload({
  onFileUpload,
  onContinue,
}: FileUploadProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      onFileUpload(e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-2 border-dashed border-primary/20 rounded-md p-6 flex flex-col items-center justify-center">
        <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mb-4">
          <Upload className="h-8 w-8 text-accent" />
        </div>
        <h3 className="text-lg font-medium mb-2 text-primary-foreground">
          Drag & Drop Files Here
        </h3>
        <p className="text-sm text-primary-foreground/70 text-center mb-4">
          Supported formats: PDF, DOCX, TXT, or any text-based file
        </p>
        <div className="flex items-center gap-2">
          <Label
            htmlFor="file-upload"
            className="bg-cta hover:bg-cta/90 text-white px-4 py-2 rounded-md cursor-pointer transition"
          >
            Browse Files
          </Label>
          <Input
            id="file-upload"
            type="file"
            className="hidden"
            onChange={handleFileChange}
            accept=".pdf,.docx,.txt,.md"
          />
          <Button variant="outline" className="text-primary-foreground">
            Use Template
          </Button>
        </div>
      </div>

      {uploadedFile && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-md p-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <div>
              <p className="font-medium text-primary-foreground">
                {uploadedFile.name}
              </p>
              <p className="text-xs text-primary-foreground/70">
                {Math.round(uploadedFile.size / 1024)} KB
              </p>
            </div>
          </div>
          <Button
            className="bg-cta hover:bg-cta/90 text-white gap-1"
            onClick={onContinue}
          >
            <ChevronRight className="h-4 w-4" />
            Continue
          </Button>
        </div>
      )}

      <div className="space-y-4 pt-4 border-t border-primary/10">
        <h3 className="text-sm font-medium text-primary-foreground">
          What we'll extract from your document:
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-2">
            <div className="w-5 h-5 rounded-full bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
              <CheckCircle className="h-3 w-3 text-accent" />
            </div>
            <div>
              <p className="font-medium text-sm text-primary-foreground">
                Event Structure
              </p>
              <p className="text-xs text-primary-foreground/70">
                Agenda, timeline, and session details
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-5 h-5 rounded-full bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
              <CheckCircle className="h-3 w-3 text-accent" />
            </div>
            <div>
              <p className="font-medium text-sm text-primary-foreground">
                Speaker Information
              </p>
              <p className="text-xs text-primary-foreground/70">
                Names, titles, and presentation topics
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-5 h-5 rounded-full bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
              <CheckCircle className="h-3 w-3 text-accent" />
            </div>
            <div>
              <p className="font-medium text-sm text-primary-foreground">
                Event Details
              </p>
              <p className="text-xs text-primary-foreground/70">
                Name, date, venue, and description
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-5 h-5 rounded-full bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
              <CheckCircle className="h-3 w-3 text-accent" />
            </div>
            <div>
              <p className="font-medium text-sm text-primary-foreground">
                Special Instructions
              </p>
              <p className="text-xs text-primary-foreground/70">
                Any specific guidance for the AI host
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

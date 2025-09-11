"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Play, 
  Pause, 
  Edit, 
  Save, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Wand2, 
  Plus, 
  Trash2, 
  RefreshCw,
  FileText,
  Mic
} from "lucide-react";
import { ScriptSegment, VoiceSettings } from "@/types/event";

interface ScriptSegmentManagerProps {
  segments: ScriptSegment[];
  selectedSegmentId: number | null;
  onSegmentSelect: (segmentId: number) => void;
  onUpdateSegment: (segmentId: number, content: string) => void;
  onGenerateAudio: (segmentId: number) => void;
  voiceSettings: VoiceSettings;
}

export default function ScriptSegmentManager({
  segments,
  selectedSegmentId,
  onSegmentSelect,
  onUpdateSegment,
  onGenerateAudio,
  voiceSettings
}: ScriptSegmentManagerProps) {
  const [editMode, setEditMode] = useState(false);
  const [editingContent, setEditingContent] = useState("");
  const [newSegmentContent, setNewSegmentContent] = useState("");
  const [newSegmentType, setNewSegmentType] = useState("introduction");
  
  // Get selected segment
  const selectedSegment = segments.find(s => s.id === selectedSegmentId);
  
  // Format time as MM:SS
  const formatTime = (time?: number) => {
    if (!time) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "generated":
        return <Badge variant="outline" className="bg-green-100 text-green-700">Generated</Badge>;
      case "generating":
        return <Badge variant="outline" className="bg-blue-100 text-blue-700">Generating...</Badge>;
      case "failed":
        return <Badge variant="outline" className="bg-red-100 text-red-700">Failed</Badge>;
      case "editing":
        return <Badge variant="outline" className="bg-amber-100 text-amber-700">Edited</Badge>;
      default:
        return <Badge variant="outline" className="bg-gray-100 text-gray-700">Draft</Badge>;
    }
  };
  
  // Handle edit button click
  const handleEditClick = (segment: ScriptSegment) => {
    setEditMode(true);
    setEditingContent(segment.content);
  };
  
  // Handle save button click
  const handleSaveClick = () => {
    if (selectedSegmentId) {
      onUpdateSegment(selectedSegmentId, editingContent);
      setEditMode(false);
    }
  };
  
  // Handle cancel button click
  const handleCancelClick = () => {
    setEditMode(false);
    setEditingContent("");
  };
  
  // Handle add new segment
  const handleAddSegment = () => {
    // This would be implemented to add a new segment
    console.log("Add new segment:", newSegmentType, newSegmentContent);
  };
  
  // Get voice settings summary
  const getVoiceSettingsSummary = () => {
    const parts = [];
    
    if (voiceSettings.gender) {
      parts.push(voiceSettings.gender);
    }
    
    if (voiceSettings.accent) {
      parts.push(voiceSettings.accent);
    }
    
    if (voiceSettings.tone) {
      parts.push(voiceSettings.tone);
    }
    
    return parts.join(", ");
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Segment list */}
      <div className="md:col-span-1">
        <Card className="h-full">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Script Segments
            </CardTitle>
            <CardDescription>
              Select a segment to edit or generate audio
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[400px] overflow-y-auto">
              {segments.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  No script segments available
                </div>
              ) : (
                <div className="divide-y">
                  {segments.map(segment => (
                    <div 
                      key={segment.id}
                      className={`p-3 cursor-pointer transition-colors ${
                        selectedSegmentId === segment.id 
                          ? 'bg-primary/5 border-l-2 border-primary' 
                          : 'hover:bg-muted/50 border-l-2 border-transparent'
                      }`}
                      onClick={() => onSegmentSelect(segment.id)}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium capitalize">
                            {segment.type.replace(/_/g, " ")}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatTime(segment.timing)}
                          </span>
                        </div>
                        <div>
                          {getStatusBadge(segment.status)}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {segment.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="p-3 border-t">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full flex items-center gap-1"
              onClick={() => {
                // Open add segment form
              }}
            >
              <Plus className="h-3.5 w-3.5" />
              Add Segment
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      {/* Segment editor */}
      <div className="md:col-span-2">
        {selectedSegment ? (
          <Card className="h-full">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-base capitalize">
                    {selectedSegment.type.replace(/_/g, " ")}
                  </CardTitle>
                  <CardDescription>
                    Segment #{selectedSegment.order} • {formatTime(selectedSegment.timing)}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {!editMode && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEditClick(selectedSegment)}
                    >
                      <Edit className="h-3.5 w-3.5 mr-1" />
                      Edit
                    </Button>
                  )}
                  {selectedSegment.audio && (
                    <Button 
                      variant="outline" 
                      size="sm"
                    >
                      <Play className="h-3.5 w-3.5 mr-1" />
                      Play
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {editMode ? (
                <div className="space-y-4">
                  <Textarea
                    value={editingContent}
                    onChange={(e) => setEditingContent(e.target.value)}
                    className="min-h-[200px] text-sm"
                  />
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleCancelClick}
                    >
                      Cancel
                    </Button>
                    <Button 
                      variant="default" 
                      size="sm"
                      onClick={handleSaveClick}
                    >
                      <Save className="h-3.5 w-3.5 mr-1" />
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="border rounded-md p-3 min-h-[200px] text-sm whitespace-pre-wrap">
                    {selectedSegment.content}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mic className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Voice: {getVoiceSettingsSummary()}
                      </span>
                    </div>
                    
                    <Button 
                      variant={selectedSegment.status === "generated" ? "outline" : "default"}
                      size="sm"
                      onClick={() => onGenerateAudio(selectedSegment.id)}
                      disabled={selectedSegment.status === "generating"}
                    >
                      {selectedSegment.status === "generating" ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5 mr-1 animate-spin" />
                          Generating...
                        </>
                      ) : selectedSegment.status === "generated" ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5 mr-1" />
                          Regenerate Audio
                        </>
                      ) : (
                        <>
                          <Wand2 className="h-3.5 w-3.5 mr-1" />
                          Generate Audio
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="h-full flex items-center justify-center">
            <div className="text-center p-6">
              <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Segment Selected</h3>
              <p className="text-muted-foreground mb-4">
                Select a script segment from the list to edit or generate audio
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

"use client";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Camera,
  Mic2,
  MonitorSpeaker,
  Presentation,
  Cast,
  RefreshCcw,
  PlusCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

interface DeviceType {
  id: string;
  name: string;
  type: "video" | "audio" | "output" | "display";
  connected: boolean;
  streaming: boolean;
}

interface StreamDestinationType {
  id: string;
  name: string;
  connected: boolean;
}

interface DeviceManagerProps {
  recordingDevices: DeviceType[];
  streamDestinations: StreamDestinationType[];
  isEventRunning: boolean;
  onToggleDevice: (deviceId: string) => void;
  onToggleDestination: (destinationId: string) => void;
  onStartRecording?: () => void;
  onRefreshDevices?: () => void;
  onAddDevice?: () => void;
}

export default function DeviceManager({
  recordingDevices,
  streamDestinations,
  isEventRunning,
  onToggleDevice,
  onToggleDestination,
  onStartRecording,
  onRefreshDevices,
  onAddDevice,
}: DeviceManagerProps) {
  const [isRecording, setIsRecording] = useState<boolean>(false);

  const handleStartRecording = () => {
    setIsRecording(!isRecording);
    if (onStartRecording) {
      onStartRecording();
    }
  };

  const getDeviceIcon = (type: DeviceType["type"]) => {
    switch (type) {
      case "video":
        return <Camera className="h-4 w-4 text-primary" />;
      case "audio":
        return <Mic2 className="h-4 w-4 text-primary" />;
      case "output":
        return <MonitorSpeaker className="h-4 w-4 text-primary" />;
      case "display":
        return <Presentation className="h-4 w-4 text-primary" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Recording & Streaming</CardTitle>
            <CardDescription>
              Configure your event recording and streaming
            </CardDescription>
          </div>
          {onRefreshDevices && (
            <Button
              variant="outline"
              size="icon"
              onClick={onRefreshDevices}
              className="h-8 w-8"
            >
              <RefreshCcw className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium">Recording Devices</h3>
            {onAddDevice && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onAddDevice}
                className="h-7 px-2 text-xs flex items-center gap-1"
              >
                <PlusCircle className="h-3 w-3" />
                Add Device
              </Button>
            )}
          </div>

          <div className="space-y-2">
            {recordingDevices.map((device) => (
              <div
                key={device.id}
                className="flex items-center justify-between p-2 border rounded-md"
              >
                <div className="flex items-center gap-2">
                  {getDeviceIcon(device.type)}
                  <span className="text-sm">{device.name}</span>
                  <Badge
                    variant={device.connected ? "default" : "destructive"}
                    className="text-xs"
                  >
                    {device.connected ? "Connected" : "Disconnected"}
                  </Badge>
                </div>
                <Switch
                  checked={device.streaming}
                  onCheckedChange={() => onToggleDevice(device.id)}
                  disabled={!device.connected || !isEventRunning}
                />
              </div>
            ))}

            {recordingDevices.length === 0 && (
              <div className="text-center p-4 border border-dashed rounded-md">
                <p className="text-sm text-muted-foreground">
                  No devices connected
                </p>
                {onAddDevice && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onAddDevice}
                    className="mt-2"
                  >
                    Add Device
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium mb-2">Streaming Destinations</h3>
          <div className="space-y-2">
            {streamDestinations.map((destination) => (
              <div
                key={destination.id}
                className="flex items-center justify-between p-2 border rounded-md"
              >
                <div className="flex items-center gap-2">
                  <Cast className="h-4 w-4 text-primary" />
                  <span className="text-sm">{destination.name}</span>
                </div>
                <Switch
                  checked={destination.connected}
                  onCheckedChange={() => onToggleDestination(destination.id)}
                  disabled={!isEventRunning}
                />
              </div>
            ))}

            {streamDestinations.length === 0 && (
              <div className="text-center p-4 border border-dashed rounded-md">
                <p className="text-sm text-muted-foreground">
                  No streaming destinations added
                </p>
              </div>
            )}
          </div>
        </div>

        <Button
          className={`w-full ${
            isRecording ? "bg-red-500 hover:bg-red-600" : ""
          }`}
          disabled={
            !isEventRunning ||
            recordingDevices.filter((d) => d.connected && d.streaming)
              .length === 0
          }
          onClick={handleStartRecording}
        >
          {isRecording ? "Stop Recording" : "Start Recording"}
        </Button>
      </CardContent>
    </Card>
  );
}

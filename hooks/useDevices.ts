import { useState } from "react";

export type RecordingDevice = {
  id: string;
  name: string;
  type: "video" | "audio" | "output" | "display";
  connected: boolean;
  streaming: boolean;
};

export type StreamDestination = {
  id: string;
  name: string;
  connected: boolean;
};

export function useDevices() {
  const [recordingDevices, setRecordingDevices] = useState<RecordingDevice[]>([
    {
      id: "camera1",
      name: "Main Camera",
      type: "video",
      connected: true,
      streaming: false,
    },
    {
      id: "mic1",
      name: "Room Microphone",
      type: "audio",
      connected: true,
      streaming: false,
    },
    {
      id: "speaker1",
      name: "Main Speakers",
      type: "output",
      connected: true,
      streaming: false,
    },
    {
      id: "screen1",
      name: "Presentation Screen",
      type: "display",
      connected: true,
      streaming: false,
    },
  ]);

  const [streamDestinations, setStreamDestinations] = useState<
    StreamDestination[]
  >([
    { id: "youtube", name: "YouTube", connected: false },
    { id: "facebook", name: "Facebook", connected: false },
    { id: "zoom", name: "Zoom Meeting", connected: true },
    { id: "custom", name: "Custom RTMP", connected: false },
  ]);

  const toggleDeviceStreaming = (deviceId: string) => {
    setRecordingDevices((devices) =>
      devices.map((device) =>
        device.id === deviceId
          ? { ...device, streaming: !device.streaming }
          : device
      )
    );
  };

  const toggleStreamDestination = (destId: string) => {
    setStreamDestinations((destinations) =>
      destinations.map((dest) =>
        dest.id === destId ? { ...dest, connected: !dest.connected } : dest
      )
    );
  };

  return {
    recordingDevices,
    streamDestinations,
    toggleDeviceStreaming,
    toggleStreamDestination,
  };
}

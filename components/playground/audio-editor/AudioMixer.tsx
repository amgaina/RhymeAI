"use client";

import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import {
  Volume2,
  VolumeX,
  Mic,
  Music,
  Headphones,
  ArrowLeftRight,
  Sliders,
} from "lucide-react";

interface Channel {
  id: string;
  name: string;
  volume: number;
  pan: number;
  muted: boolean;
  solo: boolean;
  color: string;
}

interface AudioMixerProps {
  channels: Channel[];
  onVolumeChange: (channelId: string, volume: number) => void;
  onPanChange: (channelId: string, pan: number) => void;
  onMuteToggle: (channelId: string) => void;
  onSoloToggle: (channelId: string) => void;
}

export default function AudioMixer({
  channels,
  onVolumeChange,
  onPanChange,
  onMuteToggle,
  onSoloToggle,
}: AudioMixerProps) {
  const [masterVolume, setMasterVolume] = useState(100);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activeTab, setActiveTab] = useState<"fader" | "eq" | "effects">(
    "fader"
  );

  // Get channel icon
  const getChannelIcon = (channelId: string) => {
    switch (channelId) {
      case "emcee":
        return <Mic className="h-4 w-4" />;
      case "music":
        return <Music className="h-4 w-4" />;
      case "effects":
        return <Headphones className="h-4 w-4" />;
      default:
        return <Volume2 className="h-4 w-4" />;
    }
  };

  // Format pan value
  const formatPan = (pan: number) => {
    if (pan === 0) return "C";
    return pan < 0 ? `L${Math.abs(pan)}` : `R${pan}`;
  };

  // Simulate VU meter level - in a real app, this would come from actual audio analysis
  const getVULevel = (volume: number) => {
    return Math.min(100, Math.max(0, volume + Math.random() * 10 - 5));
  };

  return (
    <div className="bg-[#1a1a1a] rounded-lg overflow-hidden border border-[#333333]">
      {/* Header - more professional with subtle gradient */}
      <div className="bg-gradient-to-r from-[#2a2a2a] to-[#222222] p-2 flex justify-between items-center border-b border-[#333333]">
        <h3 className="text-sm font-medium text-zinc-100 flex items-center gap-2">
          <Sliders className="h-4 w-4 text-yellow-500" />
          Audio Mixer
        </h3>
        <div className="flex items-center gap-2">
          {/* Professional toggle button that looks like audio software */}
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs px-2 bg-[#2d2d2d] border-[#444] hover:bg-[#3a3a3a] text-zinc-200"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? "Basic View" : "Advanced View"}
          </Button>
        </div>
      </div>

      {/* Improved tabs design for advanced mode */}
      {showAdvanced && (
        <div className="bg-[#252525] border-b border-[#333333] px-2 pt-1">
          <div className="flex">
            {["fader", "eq", "effects"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-3 py-1 text-xs font-medium rounded-t-md mr-1 ${
                  activeTab === tab
                    ? "bg-[#1a1a1a] text-yellow-500 border-t border-l border-r border-[#444]"
                    : "bg-[#303030] text-zinc-400 hover:bg-[#353535]"
                }`}
              >
                {tab === "fader" ? "Levels" : tab === "eq" ? "EQ" : "Effects"}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main mixer content area */}
      <div className="bg-[#1a1a1a] p-2">
        {showAdvanced ? (
          /* Advanced mode with tabbed interface */
          <div>
            {activeTab === "fader" && (
              <div className="flex">
                {/* Left legend column */}
                <div className="w-[80px] flex-shrink-0 pr-2">
                  {/* Level indicators */}
                  <div className="relative h-[140px] flex flex-col justify-between items-end text-[10px] text-zinc-500 pr-1">
                    <div>0 dB</div>
                    <div>-3</div>
                    <div>-6</div>
                    <div>-12</div>
                    <div>-24</div>
                    <div>-∞</div>
                  </div>

                  {/* Pan label */}
                  <div className="mt-3 text-[10px] text-zinc-500 text-right">
                    Pan
                  </div>
                </div>

                {/* Channel strips */}
                <div className="flex-1 flex gap-1 overflow-x-auto">
                  {channels.map((channel) => (
                    <div
                      key={channel.id}
                      className="flex flex-col min-w-[60px] px-1"
                    >
                      {/* Channel name */}
                      <div
                        className="text-center pb-1 flex flex-col items-center"
                        style={{ borderTop: `2px solid ${channel.color}` }}
                      >
                        {getChannelIcon(channel.id)}
                        <span className="text-[11px] font-medium text-zinc-300 truncate max-w-full">
                          {channel.name}
                        </span>
                      </div>

                      {/* VU meter and fader */}
                      <div className="flex items-center justify-center space-x-1 h-[140px]">
                        {/* VU meter with professional look */}
                        <div className="w-2 h-full bg-[#252525] rounded-sm overflow-hidden relative">
                          <div
                            className="absolute bottom-0 w-full"
                            style={{
                              height: `${getVULevel(channel.volume)}%`,
                              background:
                                "linear-gradient(to top, #4ade80 70%, #facc15 85%, #ef4444 95%)",
                            }}
                          ></div>
                          <div className="absolute bottom-0 w-full h-full opacity-20 bg-gradient-to-b from-white/5 to-transparent"></div>
                        </div>

                        {/* Slider track with tick marks */}
                        <div className="relative w-4 h-full">
                          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-[#333] -translate-x-1/2"></div>

                          {/* Tick marks */}
                          {[0, 20, 40, 60, 80].map((tick) => (
                            <div
                              key={tick}
                              className="absolute left-0 w-1 h-px bg-[#555]"
                              style={{ bottom: `${tick}%` }}
                            ></div>
                          ))}

                          <Slider
                            orientation="vertical"
                            value={[channel.volume]}
                            max={100}
                            step={1}
                            onValueChange={(value) =>
                              onVolumeChange(channel.id, value[0])
                            }
                            className="h-full z-10"
                          />
                        </div>
                      </div>

                      {/* Volume display */}
                      <div className="text-center py-1 text-[10px] font-mono text-zinc-300">
                        {channel.volume}
                      </div>

                      {/* Pan control */}
                      <div className="mt-1">
                        <Slider
                          value={[channel.pan]}
                          min={-100}
                          max={100}
                          step={1}
                          onValueChange={(value) =>
                            onPanChange(channel.id, value[0])
                          }
                          className="h-1.5"
                        />
                        <div className="text-center text-[10px] font-mono text-zinc-400 mt-1">
                          {formatPan(channel.pan)}
                        </div>
                      </div>

                      {/* Controls */}
                      <div className="flex justify-center gap-1 mt-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className={`h-6 w-6 p-0 rounded-sm ${
                            channel.muted
                              ? "bg-red-900/60 hover:bg-red-900/80 border-red-900 text-red-200"
                              : "bg-[#252525] hover:bg-[#303030] border-[#444]"
                          }`}
                          onClick={() => onMuteToggle(channel.id)}
                        >
                          <span className="text-[9px] font-bold">M</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className={`h-6 w-6 p-0 rounded-sm ${
                            channel.solo
                              ? "bg-yellow-900/60 hover:bg-yellow-900/80 border-yellow-900 text-yellow-200"
                              : "bg-[#252525] hover:bg-[#303030] border-[#444]"
                          }`}
                          onClick={() => onSoloToggle(channel.id)}
                        >
                          <span className="text-[9px] font-bold">S</span>
                        </Button>
                      </div>
                    </div>
                  ))}

                  {/* Master channel - visually distinct */}
                  <div className="flex flex-col min-w-[65px] px-2 bg-[#252525] rounded-t-md">
                    {/* Master channel name */}
                    <div className="text-center pb-1 flex flex-col items-center">
                      <Volume2 className="h-4 w-4 text-yellow-500" />
                      <span className="text-[11px] font-medium text-yellow-100 truncate max-w-full">
                        Master
                      </span>
                    </div>

                    {/* Master VU meter and fader */}
                    <div className="flex items-center justify-center space-x-1 h-[140px]">
                      {/* VU meter */}
                      <div className="w-2 h-full bg-[#1a1a1a] rounded-sm overflow-hidden relative">
                        <div
                          className="absolute bottom-0 w-full"
                          style={{
                            height: `${getVULevel(masterVolume)}%`,
                            background:
                              "linear-gradient(to top, #4ade80 70%, #facc15 85%, #ef4444 95%)",
                          }}
                        ></div>
                        <div className="absolute bottom-0 w-full h-full opacity-20 bg-gradient-to-b from-white/5 to-transparent"></div>
                      </div>

                      {/* Slider track with tick marks */}
                      <div className="relative w-4 h-full">
                        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-[#333] -translate-x-1/2"></div>

                        {/* Tick marks */}
                        {[0, 20, 40, 60, 80].map((tick) => (
                          <div
                            key={tick}
                            className="absolute left-0 w-1 h-px bg-[#555]"
                            style={{ bottom: `${tick}%` }}
                          ></div>
                        ))}

                        <Slider
                          orientation="vertical"
                          value={[masterVolume]}
                          max={100}
                          step={1}
                          onValueChange={(value) => setMasterVolume(value[0])}
                          className="h-full z-10"
                        />
                      </div>
                    </div>

                    {/* Volume display */}
                    <div className="text-center py-1 text-[10px] font-mono text-zinc-300">
                      {masterVolume}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* EQ Tab */}
            {activeTab === "eq" && (
              <div className="grid grid-cols-[70px_1fr] gap-2">
                <div className="text-[11px] text-zinc-400">
                  <div className="mb-2">Equalizer</div>
                  <div className="grid gap-y-1">
                    <div>Low: 80 Hz</div>
                    <div>Mid: 1 kHz</div>
                    <div>High: 8 kHz</div>
                  </div>
                </div>

                <div className="flex flex-1 gap-1">
                  {channels.map((channel) => (
                    <div
                      key={`eq-${channel.id}`}
                      className="flex-1 min-w-[100px] border border-[#333] rounded p-2"
                    >
                      <div className="text-[11px] font-medium text-zinc-300 mb-2">
                        {channel.name}
                      </div>

                      {/* Professional EQ curve visualization */}
                      <div className="h-24 bg-[#1d1d1d] rounded border border-[#333] overflow-hidden">
                        <svg
                          width="100%"
                          height="100%"
                          viewBox="0 0 100 60"
                          preserveAspectRatio="none"
                        >
                          <rect
                            x="0"
                            y="0"
                            width="100"
                            height="60"
                            fill="#1d1d1d"
                          />

                          {/* Grid lines */}
                          {[0, 20, 40, 60, 80, 100].map((x) => (
                            <line
                              key={`x-${x}`}
                              x1={x}
                              y1="0"
                              x2={x}
                              y2="60"
                              stroke="#333"
                              strokeWidth="0.5"
                            />
                          ))}
                          {[0, 15, 30, 45, 60].map((y) => (
                            <line
                              key={`y-${y}`}
                              x1="0"
                              y1={y}
                              x2="100"
                              y2={y}
                              stroke="#333"
                              strokeWidth="0.5"
                            />
                          ))}

                          {/* EQ curve */}
                          <path
                            d="M0,30 C15,20 30,25 50,30 S85,35 100,20"
                            stroke={channel.color}
                            strokeWidth="1.5"
                            fill="none"
                          />
                        </svg>
                      </div>

                      {/* EQ controls */}
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        {["Low", "Mid", "High"].map((band) => (
                          <div key={band} className="space-y-1">
                            <div className="text-[10px] text-zinc-400">
                              {band}
                            </div>
                            <Slider
                              value={[0]}
                              max={100}
                              className="h-1"
                              disabled
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Effects Tab */}
            {activeTab === "effects" && (
              <div className="grid grid-cols-[70px_1fr] gap-2">
                <div className="text-[11px] text-zinc-400">
                  <div className="mb-2">Effects</div>
                  <div className="grid gap-y-1">
                    <div>Reverb</div>
                    <div>Delay</div>
                    <div>Compression</div>
                  </div>
                </div>

                <div className="flex flex-1 gap-1">
                  {channels.map((channel) => (
                    <div
                      key={`fx-${channel.id}`}
                      className="flex-1 min-w-[100px] border border-[#333] rounded p-2"
                    >
                      <div className="text-[11px] font-medium text-zinc-300 mb-2">
                        {channel.name}
                      </div>

                      {/* Effects controls */}
                      <div className="space-y-3">
                        {["Reverb", "Delay", "Compression"].map((effect) => (
                          <div key={effect} className="space-y-1">
                            <div className="flex justify-between text-[10px]">
                              <span className="text-zinc-400">{effect}</span>
                              <span className="text-zinc-500">0%</span>
                            </div>
                            <Slider
                              value={[0]}
                              max={100}
                              className="h-1"
                              disabled
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Basic mode - still professional but simplified */
          <div className="space-y-1">
            {channels.map((channel) => (
              <div
                key={channel.id}
                className="flex items-center gap-2 p-2 rounded bg-[#252525] border border-[#333]"
                style={{
                  borderLeft: `3px solid ${channel.color}`,
                }}
              >
                {/* Channel identity */}
                <div className="flex items-center gap-1.5 w-24">
                  <div className="bg-[#1a1a1a] p-1 rounded">
                    {getChannelIcon(channel.id)}
                  </div>
                  <span className="text-xs font-medium text-zinc-300 truncate">
                    {channel.name}
                  </span>
                </div>

                {/* Volume control and meter */}
                <div className="flex-grow flex items-center gap-2">
                  {/* Compact VU Meter */}
                  <div className="w-1 h-5 bg-[#1a1a1a] rounded-sm overflow-hidden relative">
                    <div
                      className="absolute bottom-0 w-full"
                      style={{
                        height: `${getVULevel(channel.volume)}%`,
                        background:
                          "linear-gradient(to top, #4ade80 70%, #facc15 85%, #ef4444 95%)",
                      }}
                    ></div>
                  </div>

                  {/* Volume slider */}
                  <Slider
                    value={[channel.volume]}
                    max={100}
                    step={1}
                    onValueChange={(value) =>
                      onVolumeChange(channel.id, value[0])
                    }
                    className="flex-1"
                  />

                  {/* Volume number */}
                  <div className="w-8 text-right">
                    <span className="text-xs font-mono text-zinc-300">
                      {channel.volume}
                    </span>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className={`h-7 w-7 p-0 ${
                      channel.muted
                        ? "bg-red-900/60 hover:bg-red-900/80 border-red-900 text-red-200"
                        : "bg-[#1a1a1a] hover:bg-[#252525] border-[#444]"
                    }`}
                    onClick={() => onMuteToggle(channel.id)}
                  >
                    <VolumeX
                      className={`h-3.5 w-3.5 ${
                        channel.muted ? "" : "opacity-60"
                      }`}
                    />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`h-7 w-7 p-0 ${
                      channel.solo
                        ? "bg-yellow-900/60 hover:bg-yellow-900/80 border-yellow-900 text-yellow-200"
                        : "bg-[#1a1a1a] hover:bg-[#252525] border-[#444]"
                    }`}
                    onClick={() => onSoloToggle(channel.id)}
                  >
                    <span
                      className={`text-xs font-bold ${
                        channel.solo ? "" : "opacity-60"
                      }`}
                    >
                      S
                    </span>
                  </Button>
                </div>
              </div>
            ))}

            {/* Master channel */}
            <div className="flex items-center gap-2 p-2 rounded bg-[#252525] border border-[#333] mt-2">
              <div className="flex items-center gap-1.5 w-24">
                <div className="bg-[#1a1a1a] p-1 rounded">
                  <Volume2 className="h-4 w-4 text-yellow-500" />
                </div>
                <span className="text-xs font-medium text-yellow-100">
                  Master
                </span>
              </div>

              <div className="flex-grow flex items-center gap-2">
                {/* Compact VU Meter */}
                <div className="w-1 h-5 bg-[#1a1a1a] rounded-sm overflow-hidden relative">
                  <div
                    className="absolute bottom-0 w-full"
                    style={{
                      height: `${getVULevel(masterVolume)}%`,
                      background:
                        "linear-gradient(to top, #4ade80 70%, #facc15 85%, #ef4444 95%)",
                    }}
                  ></div>
                </div>

                <Slider
                  value={[masterVolume]}
                  max={100}
                  step={1}
                  onValueChange={(value) => setMasterVolume(value[0])}
                  className="flex-1"
                />

                <div className="w-8 text-right">
                  <span className="text-xs font-mono text-zinc-300">
                    {masterVolume}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";
import { useEffect, useRef } from "react";

interface WaveformProps {
  duration: number;
  currentTime: number;
}

export function Waveform({ duration, currentTime }: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Generate a random waveform pattern on component mount
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Get canvas dimensions
    const width = canvas.width;
    const height = canvas.height;

    // Clear the canvas
    ctx.clearRect(0, 0, width, height);

    // Generate random waveform data
    const points = 100;
    const waveData = Array.from(
      { length: points },
      () => Math.random() * 0.5 + 0.2 // Random values between 0.2 and 0.7
    );

    // Draw the waveform
    const drawWaveform = () => {
      const segmentWidth = width / points;

      // Calculate progress position
      const progress = duration > 0 ? currentTime / duration : 0;
      const progressX = width * progress;

      // Draw waveform
      for (let i = 0; i < points; i++) {
        const x = i * segmentWidth;
        const amplitude = waveData[i] * height;
        const y = (height - amplitude) / 2;

        // Set color based on playback position
        if (x <= progressX) {
          ctx.fillStyle = "rgb(99, 102, 241)"; // Primary color for played portion
        } else {
          ctx.fillStyle = "rgb(99, 102, 241, 0.3)"; // Lighter shade for unplayed portion
        }

        // Draw bar
        ctx.fillRect(x, y, segmentWidth * 0.8, amplitude);
      }
    };

    drawWaveform();

    // Redraw waveform when currentTime changes
    return () => {
      // Cleanup if needed
    };
  }, [duration, currentTime]);

  return (
    <canvas ref={canvasRef} width={500} height={40} className="w-full h-10" />
  );
}

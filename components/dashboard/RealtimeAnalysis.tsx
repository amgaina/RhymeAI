import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  ReferenceLine,
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";

interface EmotionData {
  name: string;
  value: number;
  color: string;
}

interface TimeSeriesData {
  time: string;
  timestamp: number;
  happy: number;
  neutral: number;
  surprised: number;
  angry: number;
  engagement: number;
}

interface DetectedFace {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  emotion: string;
  confidence: number;
  landmarks: { x: number; y: number }[];
  tracking: boolean;
}

export function RealtimeAnalysis() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState("neutral");
  const [emotionConfidence, setEmotionConfidence] = useState(85);
  const [showDetection, setShowDetection] = useState(true);
  const [attendeeCount, setAttendeeCount] = useState(1);
  const [processingFPS, setProcessingFPS] = useState(24);
  const [connectionStatus, setConnectionStatus] = useState<
    "connected" | "processing" | "reconnecting"
  >("connected");
  const [lastInsightTime, setLastInsightTime] = useState<Date | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [faceTracking, setFaceTracking] = useState<DetectedFace[]>([
    {
      id: 1,
      x: 0.5,
      y: 0.4,
      width: 0.3,
      height: 0.4,
      emotion: "neutral",
      confidence: 85,
      landmarks: [
        { x: 0.45, y: 0.38 }, // left eye
        { x: 0.55, y: 0.38 }, // right eye
        { x: 0.5, y: 0.42 }, // nose
        { x: 0.5, y: 0.46 }, // mouth
      ],
      tracking: true,
    },
  ]);

  const [emotionData, setEmotionData] = useState<EmotionData[]>([
    { name: "Happy", value: 45, color: "#4CAF50" },
    { name: "Neutral", value: 30, color: "#2196F3" },
    { name: "Surprised", value: 15, color: "#FF9800" },
    { name: "Angry", value: 10, color: "#F44336" },
  ]);

  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [insights, setInsights] = useState<
    {
      id: number;
      type: "positive" | "neutral" | "warning";
      title: string;
      description: string;
      timestamp: Date;
    }[]
  >([]);

  // Initialize time series data with current timestamps
  useEffect(() => {
    if (timeSeriesData.length === 0) {
      const initialData: TimeSeriesData[] = [];
      const now = new Date();

      for (let i = 0; i < 10; i++) {
        const timeOffset = now.getTime() - (10 - i) * 2000; // 2 seconds apart
        const timePoint = new Date(timeOffset);

        initialData.push({
          time: timePoint.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }),
          timestamp: timeOffset,
          happy: Math.floor(Math.random() * 30) + 30,
          neutral: Math.floor(Math.random() * 30) + 30,
          surprised: Math.floor(Math.random() * 15) + 5,
          angry: Math.floor(Math.random() * 10) + 5,
          engagement: Math.floor(Math.random() * 30) + 60,
        });
      }

      setTimeSeriesData(initialData);
    }
  }, [timeSeriesData.length]);

  // Real-time clock update
  useEffect(() => {
    const clockInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(clockInterval);
  }, []);

  // Simulation of real-time data updates
  useEffect(() => {
    if (!isAnalyzing) return;

    // Occasionally simulate connection status changes
    const connectionInterval = setInterval(() => {
      if (Math.random() > 0.95) {
        setConnectionStatus("reconnecting");
        setTimeout(() => {
          setConnectionStatus("connected");
          // Random FPS fluctuation
          setProcessingFPS(Math.floor(Math.random() * 6) + 22);
        }, 1500);
      } else if (Math.random() > 0.7) {
        setProcessingFPS((prev) =>
          Math.max(20, Math.min(30, prev + (Math.random() * 2 - 1)))
        );
      }
    }, 5000);

    // Emotion update interval - more frequent for realtime feel
    const emotionInterval = setInterval(() => {
      // Update current emotion more realistically with probability weights
      if (Math.random() > 0.6) {
        const emotions = ["happy", "neutral", "surprised", "angry"];
        const weights = [0.4, 0.4, 0.15, 0.05]; // More likely to be happy or neutral

        let random = Math.random();
        let selectedIndex = 0;
        let sum = 0;

        for (let i = 0; i < weights.length; i++) {
          sum += weights[i];
          if (random <= sum) {
            selectedIndex = i;
            break;
          }
        }

        const newEmotion = emotions[selectedIndex];

        // Only change if it's different or by random chance (for realism)
        if (newEmotion !== currentEmotion || Math.random() > 0.7) {
          setCurrentEmotion(newEmotion);
          setEmotionConfidence(Math.floor(Math.random() * 20) + 75); // 75-95%

          // Update face tracking data
          setFaceTracking((prev) =>
            prev.map((face) => ({
              ...face,
              emotion: newEmotion,
              confidence: Math.floor(Math.random() * 20) + 75,
              // Slight movement for realism
              x: face.x + (Math.random() * 0.02 - 0.01),
              y: face.y + (Math.random() * 0.02 - 0.01),
            }))
          );
        }
      }

      // Smooth, incremental emotion data updates
      setEmotionData((prev) => {
        let total = 0;
        const updated = prev.map((item) => {
          let targetValue =
            item.name.toLowerCase() === currentEmotion
              ? Math.random() * 30 + 50 // 50-80 for current emotion
              : Math.random() * 20 + 10; // 10-30 for others

          // Move current value 10% toward target for smooth transition
          let newValue = item.value + (targetValue - item.value) * 0.1;
          newValue = Math.max(5, Math.min(80, newValue));
          total += newValue;

          return {
            ...item,
            value: newValue,
          };
        });

        // Normalize so total is always 100
        return updated.map((item) => ({
          ...item,
          value: Math.round((item.value / total) * 100),
        }));
      });

      // Occasionally change number of faces detected
      if (Math.random() > 0.9) {
        const newCount = Math.min(
          3,
          Math.max(1, attendeeCount + (Math.random() > 0.5 ? 1 : -1))
        );
        if (newCount !== attendeeCount) {
          setAttendeeCount(newCount);

          // If increasing, add a face
          if (newCount > attendeeCount) {
            setFaceTracking((prev) => [
              ...prev,
              {
                id: prev.length + 1,
                x: 0.3 + Math.random() * 0.4,
                y: 0.3 + Math.random() * 0.3,
                width: 0.2 + Math.random() * 0.1,
                height: 0.3 + Math.random() * 0.1,
                emotion: ["happy", "neutral"][Math.floor(Math.random() * 2)],
                confidence: Math.floor(Math.random() * 20) + 70,
                landmarks: [
                  { x: 0, y: 0 },
                  { x: 0, y: 0 },
                  { x: 0, y: 0 },
                  { x: 0, y: 0 },
                ],
                tracking: true,
              },
            ]);
          } else {
            // If decreasing, remove a face
            setFaceTracking((prev) => prev.slice(0, -1));
          }
        }
      }
    }, 500); // More frequent updates for smoother transitions

    // Add new data point to time series every 2 seconds
    const timeSeriesInterval = setInterval(() => {
      const now = new Date();

      // Generate new data point
      setTimeSeriesData((prev) => {
        const newPoint = {
          time: now.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }),
          timestamp: now.getTime(),
          happy: Math.max(
            5,
            Math.min(90, prev[prev.length - 1].happy + (Math.random() * 10 - 5))
          ),
          neutral: Math.max(
            5,
            Math.min(
              90,
              prev[prev.length - 1].neutral + (Math.random() * 10 - 5)
            )
          ),
          surprised: Math.max(
            1,
            Math.min(
              30,
              prev[prev.length - 1].surprised + (Math.random() * 6 - 3)
            )
          ),
          angry: Math.max(
            1,
            Math.min(30, prev[prev.length - 1].angry + (Math.random() * 6 - 3))
          ),
          engagement: Math.max(
            40,
            Math.min(
              95,
              prev[prev.length - 1].engagement + (Math.random() * 8 - 4)
            )
          ),
        };

        // Influence data based on current emotion
        if (currentEmotion === "happy") newPoint.happy += 5;
        else if (currentEmotion === "neutral") newPoint.neutral += 5;
        else if (currentEmotion === "surprised") newPoint.surprised += 5;
        else if (currentEmotion === "angry") newPoint.angry += 5;

        const newData = [...prev, newPoint];
        if (newData.length > 30) {
          // Keep 1 minute of data (30 points at 2s)
          return newData.slice(-30);
        }
        return newData;
      });

      // Occasionally generate new insights
      if (
        Math.random() > 0.8 ||
        !lastInsightTime ||
        now.getTime() - lastInsightTime.getTime() > 15000
      ) {
        const insightTypes = ["positive", "neutral", "warning"] as const;
        const type =
          insightTypes[Math.floor(Math.random() * insightTypes.length)];

        let title = "";
        let description = "";

        if (type === "positive") {
          title =
            Math.random() > 0.5
              ? "Engagement Peak Detected"
              : "Strong Positive Reaction";
          description =
            Math.random() > 0.5
              ? `Audience showed significant positive response at ${now.toLocaleTimeString(
                  [],
                  { hour: "2-digit", minute: "2-digit" }
                )}. Consider emphasizing this point in future presentations.`
              : `Engagement increased by ${
                  Math.floor(Math.random() * 15) + 10
                }% during this segment. This content resonates well with your audience.`;
        } else if (type === "warning") {
          title =
            Math.random() > 0.5
              ? "Potential Confusion Detected"
              : "Engagement Drop";
          description =
            Math.random() > 0.5
              ? `A brief increase in negative emotions was observed. Consider clarifying this content or adjusting delivery.`
              : `Audience attention appears to be declining. Consider introducing an interactive element or changing pace.`;
        } else {
          title = "Content Milestone";
          description = `You've reached the halfway point of your presentation. Overall audience sentiment remains positive.`;
        }

        setInsights((prev) => [
          {
            id: Date.now(),
            type,
            title,
            description,
            timestamp: new Date(),
          },
          ...prev.slice(0, 4), // Keep only 5 most recent insights
        ]);

        setLastInsightTime(now);
      }
    }, 2000);

    return () => {
      clearInterval(emotionInterval);
      clearInterval(timeSeriesInterval);
      clearInterval(connectionInterval);
    };
  }, [isAnalyzing, currentEmotion, attendeeCount, lastInsightTime]);

  // Animate the canvas for face detection
  useEffect(() => {
    if (!isAnalyzing || !showDetection) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }

    const drawDetection = () => {
      if (!canvasRef.current || !videoRef.current) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Add scan lines effect for realism
      if (Math.random() > 0.5) {
        const scanLineY = Math.random() * canvas.height;
        ctx.fillStyle = "rgba(120, 255, 190, 0.1)";
        ctx.fillRect(0, scanLineY, canvas.width, 2);
      }

      // Processing indicators
      if (isAnalyzing) {
        ctx.fillStyle = "rgba(0, 255, 120, 0.1)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Grid pattern
        ctx.strokeStyle = "rgba(0, 200, 100, 0.1)";
        ctx.lineWidth = 1;
        const gridSize = 40;

        for (let x = 0; x < canvas.width; x += gridSize) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, canvas.height);
          ctx.stroke();
        }

        for (let y = 0; y < canvas.height; y += gridSize) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(canvas.width, y);
          ctx.stroke();
        }
      }

      // Draw face boxes for each detected face
      faceTracking.forEach((face) => {
        const centerX = face.x * canvas.width;
        const centerY = face.y * canvas.height;
        const boxWidth = face.width * canvas.width;
        const boxHeight = face.height * canvas.height;

        // Add subtle movement to simulate tracking
        const jitterX = (Math.random() * 2 - 1) * 2;
        const jitterY = (Math.random() * 2 - 1) * 2;

        // Tracking box
        ctx.strokeStyle =
          face.emotion === "happy"
            ? "#4CAF50"
            : face.emotion === "neutral"
            ? "#2196F3"
            : face.emotion === "surprised"
            ? "#FF9800"
            : "#F44336";

        ctx.lineWidth = 2;

        // Draw dashed box for realtime effect
        ctx.setLineDash([5, 3]);
        ctx.strokeRect(
          centerX - boxWidth / 2 + jitterX,
          centerY - boxHeight / 2 + jitterY,
          boxWidth,
          boxHeight
        );
        ctx.setLineDash([]);

        // Draw corners for more professional look
        const cornerSize = 10;
        ctx.beginPath();
        // Top left
        ctx.moveTo(
          centerX - boxWidth / 2,
          centerY - boxHeight / 2 + cornerSize
        );
        ctx.lineTo(centerX - boxWidth / 2, centerY - boxHeight / 2);
        ctx.lineTo(
          centerX - boxWidth / 2 + cornerSize,
          centerY - boxHeight / 2
        );
        // Top right
        ctx.moveTo(
          centerX + boxWidth / 2 - cornerSize,
          centerY - boxHeight / 2
        );
        ctx.lineTo(centerX + boxWidth / 2, centerY - boxHeight / 2);
        ctx.lineTo(
          centerX + boxWidth / 2,
          centerY - boxHeight / 2 + cornerSize
        );
        // Bottom right
        ctx.moveTo(
          centerX + boxWidth / 2,
          centerY + boxHeight / 2 - cornerSize
        );
        ctx.lineTo(centerX + boxWidth / 2, centerY + boxHeight / 2);
        ctx.lineTo(
          centerX + boxWidth / 2 - cornerSize,
          centerY + boxHeight / 2
        );
        // Bottom left
        ctx.moveTo(
          centerX - boxWidth / 2 + cornerSize,
          centerY + boxHeight / 2
        );
        ctx.lineTo(centerX - boxWidth / 2, centerY + boxHeight / 2);
        ctx.lineTo(
          centerX - boxWidth / 2,
          centerY + boxHeight / 2 - cornerSize
        );
        ctx.stroke();

        // Tracking ID and data
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(
          centerX - boxWidth / 2,
          centerY - boxHeight / 2 - 25,
          160,
          25
        );
        ctx.fillStyle = "white";
        ctx.font = "12px monospace";
        ctx.fillText(
          `ID:${face.id} | ${face.emotion.toUpperCase()} (${face.confidence}%)`,
          centerX - boxWidth / 2 + 10,
          centerY - boxHeight / 2 - 8
        );

        // Add face landmarks with some jitter for realtime effect
        ctx.fillStyle = ctx.strokeStyle;

        // Calculate landmark positions based on face dimensions
        const landmarks = [
          {
            x: centerX - boxWidth / 5 + jitterX / 2,
            y: centerY - boxHeight / 8 + jitterY / 2,
          }, // left eye
          {
            x: centerX + boxWidth / 5 + jitterX / 2,
            y: centerY - boxHeight / 8 + jitterY / 2,
          }, // right eye
          { x: centerX + jitterX / 2, y: centerY + jitterY / 2 }, // nose
        ];

        // Draw landmarks
        landmarks.forEach((point) => {
          ctx.beginPath();
          ctx.arc(point.x, point.y, 2, 0, 2 * Math.PI);
          ctx.fill();
        });

        // Draw mouth based on emotion
        ctx.beginPath();
        if (face.emotion === "happy") {
          ctx.arc(
            centerX + jitterX / 2,
            centerY + boxHeight / 6 + jitterY / 2,
            boxWidth / 7,
            0,
            Math.PI,
            false
          );
        } else if (face.emotion === "surprised") {
          ctx.arc(
            centerX + jitterX / 2,
            centerY + boxHeight / 6 + jitterY / 2,
            boxWidth / 10,
            0,
            2 * Math.PI
          );
        } else if (face.emotion === "angry") {
          ctx.arc(
            centerX + jitterX / 2,
            centerY + boxHeight / 6 + jitterY / 2,
            boxWidth / 7,
            Math.PI,
            2 * Math.PI,
            false
          );
        } else {
          ctx.moveTo(
            centerX - boxWidth / 8 + jitterX / 2,
            centerY + boxHeight / 6 + jitterY / 2
          );
          ctx.lineTo(
            centerX + boxWidth / 8 + jitterX / 2,
            centerY + boxHeight / 6 + jitterY / 2
          );
        }
        ctx.stroke();

        // Draw connections between landmarks for more realistic tracking
        ctx.beginPath();
        ctx.moveTo(landmarks[0].x, landmarks[0].y);
        ctx.lineTo(landmarks[2].x, landmarks[2].y);
        ctx.lineTo(landmarks[1].x, landmarks[1].y);
        ctx.strokeStyle = "rgba(255,255,255,0.3)";
        ctx.stroke();
      });

      // Add real-time tracking text
      if (isAnalyzing) {
        // Timestamp
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(5, 5, 180, 22);
        ctx.fillStyle = "#fff";
        ctx.font = "12px monospace";
        ctx.fillText(`TIME: ${currentTime.toLocaleTimeString()}`, 10, 20);

        // Status indicators
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(canvas.width - 160, 5, 155, 48);

        ctx.fillStyle = "#fff";
        ctx.font = "11px monospace";
        ctx.fillText(`STATUS: `, canvas.width - 155, 20);

        ctx.fillStyle =
          connectionStatus === "connected"
            ? "#4CAF50"
            : connectionStatus === "processing"
            ? "#FF9800"
            : "#F44336";
        ctx.fillText(connectionStatus.toUpperCase(), canvas.width - 100, 20);

        ctx.fillStyle = "#fff";
        ctx.fillText(
          `FPS: ${processingFPS.toFixed(1)}`,
          canvas.width - 155,
          38
        );
        ctx.fillText(`FACES: ${attendeeCount}`, canvas.width - 100, 38);

        // Processing indicators at bottom
        if (
          connectionStatus === "processing" ||
          connectionStatus === "reconnecting"
        ) {
          const dotCount = Math.floor(Date.now() / 500) % 4;
          let dots = "";
          for (let i = 0; i < dotCount; i++) dots += ".";

          ctx.fillStyle = "rgba(0,0,0,0.6)";
          ctx.fillRect(canvas.width / 2 - 100, canvas.height - 30, 200, 25);
          ctx.fillStyle =
            connectionStatus === "processing" ? "#FF9800" : "#F44336";
          ctx.font = "14px monospace";
          ctx.fillText(
            `${connectionStatus.toUpperCase()}${dots}`,
            canvas.width / 2 - 80,
            canvas.height - 12
          );
        }
      }

      animationRef.current = requestAnimationFrame(drawDetection);
    };

    animationRef.current = requestAnimationFrame(drawDetection);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [
    isAnalyzing,
    showDetection,
    faceTracking,
    currentTime,
    connectionStatus,
    processingFPS,
    attendeeCount,
  ]);

  // Initialize video feed
  useEffect(() => {
    if (
      videoRef.current &&
      navigator.mediaDevices &&
      navigator.mediaDevices.getUserMedia
    ) {
      // For demo purposes, use a mock video feed
      videoRef.current.srcObject = null;
      videoRef.current.poster =
        "https://placehold.co/640x480/333/white?text=Camera+Feed";

      // Set up canvas dimensions to match video
      if (canvasRef.current) {
        canvasRef.current.width = 640;
        canvasRef.current.height = 480;
      }
    }
  }, []);

  // Handle start/stop analysis
  const handleToggleAnalysis = () => {
    if (!isAnalyzing) {
      // Starting analysis
      setConnectionStatus("processing");
      setTimeout(() => {
        setConnectionStatus("connected");
        setIsAnalyzing(true);
      }, 1500);
    } else {
      // Stopping analysis
      setIsAnalyzing(false);
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              Realtime Audience Analysis
              {isAnalyzing && (
                <Badge
                  variant={
                    connectionStatus === "connected" ? "default" : "outline"
                  }
                  className="ml-2 animate-pulse"
                >
                  {connectionStatus === "connected"
                    ? "LIVE"
                    : connectionStatus.toUpperCase()}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Track and analyze audience emotions and engagement in real time
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDetection(!showDetection)}
              className="h-8"
              disabled={!isAnalyzing}
            >
              {showDetection ? "Hide Detection" : "Show Detection"}
            </Button>
            <Button
              variant={isAnalyzing ? "destructive" : "default"}
              size="sm"
              onClick={handleToggleAnalysis}
              className="h-8"
            >
              {isAnalyzing ? "Stop Analysis" : "Start Analysis"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <div className="relative w-full aspect-video bg-black rounded-md overflow-hidden">
              <video
                ref={videoRef}
                className="w-full h-full object-contain"
                autoPlay
                muted
                playsInline
              />
              <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 w-full h-full pointer-events-none"
              />
              {isAnalyzing && (
                <div className="absolute top-2 left-2 flex items-center gap-2">
                  <div className="bg-red-500 h-3 w-3 rounded-full animate-pulse"></div>
                  <span className="text-xs text-white bg-black/70 px-2 py-1 rounded">
                    REC{" "}
                    {currentTime.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              )}

              {/* Camera controls overlay */}
              <div className="absolute bottom-2 right-2 flex items-center gap-2">
                <div className="bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-3 h-3"
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                  Cam 1
                </div>
                <div className="bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-3 h-3"
                  >
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                  </svg>
                  Main Feed
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="bg-muted p-4 rounded-md h-1/2 relative">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-medium">Emotion Distribution</h3>
                <div className="text-xs text-muted-foreground animate-pulse">
                  Updating live
                </div>
              </div>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={emotionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip
                      formatter={(value) => [`${value}%`, "Proportion"]}
                    />
                    <Bar
                      dataKey="value"
                      fill="#8884d8"
                      radius={[4, 4, 0, 0]}
                      isAnimationActive={true}
                      animationDuration={500}
                    >
                      {emotionData.map((entry, index) => (
                        <Bar key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              {/* Processing overlay when reconnecting */}
              {connectionStatus === "reconnecting" && (
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center rounded-md">
                  <div className="bg-black/80 text-white text-sm px-4 py-2 rounded flex items-center gap-2">
                    <svg
                      className="animate-spin h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Reconnecting...
                  </div>
                </div>
              )}
            </div>

            <div className="bg-primary/5 p-4 rounded-md h-1/2">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-medium">Detected Mood</h3>
                <div className="flex items-center gap-1">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      isAnalyzing ? "bg-green-500 animate-pulse" : "bg-gray-300"
                    }`}
                  ></span>
                  <span className="text-xs text-muted-foreground">
                    Confidence: {emotionConfidence}%
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-center h-[160px]">
                <div className="text-center">
                  <div
                    className={`text-5xl mb-2 ${
                      currentEmotion === "happy"
                        ? "text-green-500"
                        : currentEmotion === "neutral"
                        ? "text-blue-500"
                        : currentEmotion === "surprised"
                        ? "text-amber-500"
                        : "text-red-500"
                    }`}
                  >
                    {currentEmotion === "happy"
                      ? "😊"
                      : currentEmotion === "neutral"
                      ? "😐"
                      : currentEmotion === "surprised"
                      ? "😮"
                      : "😠"}
                  </div>
                  <h4 className="text-xl font-semibold capitalize">
                    {currentEmotion}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-2">
                    {currentEmotion === "happy"
                      ? "Audience is engaged and enjoying the content"
                      : currentEmotion === "neutral"
                      ? "Audience is attentive but not strongly reacting"
                      : currentEmotion === "surprised"
                      ? "Something unexpected caught their attention"
                      : "The audience might be frustrated or confused"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="timeline">
          <TabsList>
            <TabsTrigger value="timeline">Emotion Timeline</TabsTrigger>
            <TabsTrigger value="insights">AI Insights</TabsTrigger>
          </TabsList>
          <TabsContent value="timeline" className="p-4 border rounded-md mt-2">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-medium">Emotion Trends Over Time</h3>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <span
                  className={`h-2 w-2 rounded-full ${
                    isAnalyzing ? "bg-green-500 animate-pulse" : "bg-gray-300"
                  }`}
                ></span>
                {isAnalyzing ? "Updating live" : "Analysis paused"}
              </div>
            </div>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeSeriesData} syncId="timelines">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" padding={{ left: 0, right: 0 }} />
                  <YAxis domain={[0, 100]} />
                  <Tooltip
                    formatter={(value) => [`${value.toFixed(1)}%`, ""]}
                    labelFormatter={(label) => `Time: ${label}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="happy"
                    name="Happy"
                    stroke="#4CAF50"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={true}
                    animationDuration={300}
                  />
                  <Line
                    type="monotone"
                    dataKey="neutral"
                    name="Neutral"
                    stroke="#2196F3"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={true}
                    animationDuration={300}
                  />
                  <Line
                    type="monotone"
                    dataKey="surprised"
                    name="Surprised"
                    stroke="#FF9800"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={true}
                    animationDuration={300}
                  />
                  <Line
                    type="monotone"
                    dataKey="angry"
                    name="Angry"
                    stroke="#F44336"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={true}
                    animationDuration={300}
                  />
                  <ReferenceLine
                    y={70}
                    stroke="rgba(0,0,0,0.3)"
                    strokeDasharray="3 3"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4">
              <h3 className="text-sm font-medium mb-2">
                Audience Engagement Score
              </h3>
              <div className="h-[100px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timeSeriesData} syncId="timelines">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" padding={{ left: 0, right: 0 }} />
                    <YAxis domain={[0, 100]} />
                    <Tooltip
                      formatter={(value) => [
                        `${value.toFixed(1)}%`,
                        "Engagement",
                      ]}
                      labelFormatter={(label) => `Time: ${label}`}
                    />
                    <ReferenceLine
                      y={60}
                      stroke="rgba(0,0,0,0.2)"
                      strokeDasharray="3 3"
                    />
                    <ReferenceLine
                      y={80}
                      stroke="rgba(0,0,0,0.2)"
                      strokeDasharray="3 3"
                    />
                    <Line
                      type="monotone"
                      dataKey="engagement"
                      name="Engagement Score"
                      stroke="#9c27b0"
                      fill="url(#colorEngagement)"
                      strokeWidth={3}
                      dot={false}
                      isAnimationActive={true}
                      animationDuration={300}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="insights" className="p-4 border rounded-md mt-2">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-medium">AI-Generated Insights</h3>
              {lastInsightTime && (
                <div className="text-xs text-muted-foreground">
                  Last updated:{" "}
                  {lastInsightTime.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </div>
              )}
            </div>

            {insights.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground text-sm">
                {isAnalyzing ? (
                  <div className="flex flex-col items-center gap-2">
                    <svg
                      className="animate-spin h-8 w-8 text-primary/70"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <p>Analyzing audience reactions...</p>
                    <p className="text-xs">
                      Insights will appear as patterns are detected
                    </p>
                  </div>
                ) : (
                  <p>Start analysis to generate insights</p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {insights.map((insight) => (
                  <div
                    key={insight.id}
                    className="flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300"
                  >
                    <div
                      className={`${
                        insight.type === "positive"
                          ? "bg-green-100"
                          : insight.type === "warning"
                          ? "bg-amber-100"
                          : "bg-primary/10"
                      } p-2 rounded-full h-8 w-8 flex items-center justify-center`}
                    >
                      {insight.type === "positive" ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-4 w-4 text-green-600"
                        >
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      ) : insight.type === "warning" ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-4 w-4 text-amber-600"
                        >
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="12" y1="8" x2="12" y2="12"></line>
                          <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-4 w-4 text-primary"
                        >
                          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                          <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                          <line x1="12" y1="22.08" x2="12" y2="12"></line>
                        </svg>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-medium">{insight.title}</h4>
                        <span className="text-xs text-muted-foreground">
                          {insight.timestamp.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {insight.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

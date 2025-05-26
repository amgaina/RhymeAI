import { useState } from "react";
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
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "../ui/card";
import { Button } from "../ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "../ui/badge";
import {
  CalendarDays,
  Clock,
  Download,
  FileText,
  Share2,
  Users,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Star,
  Bookmark,
} from "lucide-react";

interface EventReportProps {
  eventId: string;
  eventName: string;
  eventDate: Date;
  duration: number; // in minutes
  attendeeCount: number;
  averageEngagement: number;
  engagementTrend: "up" | "down" | "stable";
  emotionData: {
    happy: number;
    neutral: number;
    surprised: number;
    angry: number;
  };
  timeSeriesData: {
    time: string;
    engagement: number;
    happy: number;
    neutral: number;
    surprised: number;
    angry: number;
  }[];
  keyMoments: {
    id: number;
    timestamp: string;
    title: string;
    description: string;
    emotionChange: string;
    engagementLevel: number;
  }[];
  audienceSegmentation: {
    name: string;
    value: number;
    color: string;
  }[];
}

export function PostEventReport({
  eventId,
  eventName,
  eventDate,
  duration,
  attendeeCount,
  averageEngagement,
  engagementTrend,
  emotionData,
  timeSeriesData,
  keyMoments,
  audienceSegmentation,
}: EventReportProps) {
  const [selectedReport, setSelectedReport] = useState<
    "summary" | "detailed" | "insights"
  >("summary");

  // Format data for pie chart
  const emotionPieData = [
    { name: "Happy", value: emotionData.happy, color: "#4CAF50" },
    { name: "Neutral", value: emotionData.neutral, color: "#2196F3" },
    { name: "Surprised", value: emotionData.surprised, color: "#FF9800" },
    { name: "Angry", value: emotionData.angry, color: "#F44336" },
  ];

  // Additional statistic calculations
  const highestEngagementPoint = Math.max(
    ...timeSeriesData.map((item) => item.engagement)
  );
  const dominantEmotion = emotionPieData.reduce((prev, current) =>
    prev.value > current.value ? prev : current
  );

  // Format date for display
  const formattedDate = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(eventDate);

  // Handle export report
  const handleExportReport = () => {
    alert("Exporting report...");
    // In a real implementation, this would generate a PDF or other export format
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">
            {eventName} - Post-Event Analysis
          </h1>
          <p className="text-muted-foreground">Event analytics and insights</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
          >
            <Share2 className="h-4 w-4" />
            Share
          </Button>
          <Button
            size="sm"
            onClick={handleExportReport}
            className="flex items-center gap-1"
          >
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Event Duration</p>
                <p className="text-2xl font-semibold">{duration} min</p>
              </div>
              <div className="bg-primary/10 p-2 rounded-full">
                <Clock className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="mt-3 text-xs text-muted-foreground">
              {Math.floor(duration / 60) > 0 &&
                `${Math.floor(duration / 60)}h `}
              {duration % 60}m total runtime
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Audience Size</p>
                <p className="text-2xl font-semibold">{attendeeCount}</p>
              </div>
              <div className="bg-primary/10 p-2 rounded-full">
                <Users className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="mt-3 text-xs text-muted-foreground">
              Peak participation during the event
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Avg. Engagement</p>
                <p className="text-2xl font-semibold">{averageEngagement}%</p>
              </div>
              <div className="bg-primary/10 p-2 rounded-full">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="mt-3 text-xs flex items-center">
              {engagementTrend === "up" ? (
                <>
                  <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                  <span className="text-green-500">
                    +12% from previous events
                  </span>
                </>
              ) : engagementTrend === "down" ? (
                <>
                  <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
                  <span className="text-red-500">-8% from previous events</span>
                </>
              ) : (
                <span className="text-muted-foreground">
                  Consistent with previous events
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Dominant Mood</p>
                <p className="text-2xl font-semibold capitalize">
                  {dominantEmotion.name}
                </p>
              </div>
              <div className="bg-primary/10 p-2 rounded-full">
                <div
                  className="h-5 w-5 rounded-full"
                  style={{ backgroundColor: dominantEmotion.color }}
                />
              </div>
            </div>
            <div className="mt-3 text-xs text-muted-foreground">
              {dominantEmotion.value.toFixed(1)}% of audience reactions
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="summary" className="mt-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger
            value="summary"
            onClick={() => setSelectedReport("summary")}
          >
            Summary
          </TabsTrigger>
          <TabsTrigger
            value="detailed"
            onClick={() => setSelectedReport("detailed")}
          >
            Detailed Analysis
          </TabsTrigger>
          <TabsTrigger
            value="insights"
            onClick={() => setSelectedReport("insights")}
          >
            Key Insights
          </TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-4">
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Emotion Distribution
                </CardTitle>
                <CardDescription>
                  Overall audience mood during the event
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={emotionPieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) =>
                          `${name} ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {emotionPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Engagement Over Time
                </CardTitle>
                <CardDescription>
                  Audience engagement throughout the event duration
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={timeSeriesData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
                      <Area
                        type="monotone"
                        dataKey="engagement"
                        stroke="#8884d8"
                        fill="url(#colorEngagement)"
                        fillOpacity={0.3}
                        strokeWidth={2}
                      />
                      <defs>
                        <linearGradient
                          id="colorEngagement"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#8884d8"
                            stopOpacity={0.8}
                          />
                          <stop
                            offset="95%"
                            stopColor="#8884d8"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Event Highlights</CardTitle>
              <CardDescription>
                Key moments and notable audience reactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {keyMoments.slice(0, 3).map((moment) => (
                  <div
                    key={moment.id}
                    className="flex gap-4 p-3 border rounded-lg"
                  >
                    <div className="flex-shrink-0">
                      <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center">
                        <Star className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{moment.title}</h3>
                        <Badge variant="outline" className="text-xs">
                          {moment.timestamp}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {moment.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" className="text-xs">
                          {moment.emotionChange}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Engagement: {moment.engagementLevel}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="link" className="w-full">
                View all {keyMoments.length} key moments
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="detailed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Emotion Trends</CardTitle>
              <CardDescription>
                Changes in audience emotion throughout the event
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="happy"
                      name="Happy"
                      stroke="#4CAF50"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="neutral"
                      name="Neutral"
                      stroke="#2196F3"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="surprised"
                      name="Surprised"
                      stroke="#FF9800"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="angry"
                      name="Angry"
                      stroke="#F44336"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Audience Segmentation
                </CardTitle>
                <CardDescription>
                  Breakdown of audience demographics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={audienceSegmentation}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => `${value}%`} />
                      <Bar dataKey="value" fill="#8884d8" radius={[4, 4, 0, 0]}>
                        {audienceSegmentation.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Event Information</CardTitle>
                <CardDescription>
                  Detailed event metadata and statistics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <CalendarDays className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Event Date</p>
                      <p className="text-sm text-muted-foreground">
                        {formattedDate}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <Clock className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Duration</p>
                      <p className="text-sm text-muted-foreground">
                        {duration} minutes ({Math.floor(duration / 60)}h{" "}
                        {duration % 60}m)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Audience</p>
                      <p className="text-sm text-muted-foreground">
                        {attendeeCount} participants
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <BarChart3 className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Peak Engagement</p>
                      <p className="text-sm text-muted-foreground">
                        {highestEngagementPoint}% at{" "}
                        {
                          timeSeriesData.find(
                            (item) => item.engagement === highestEngagementPoint
                          )?.time
                        }
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Event ID</p>
                      <p className="text-sm text-muted-foreground">{eventId}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">AI-Generated Insights</CardTitle>
              <CardDescription>
                Key takeaways and actionable recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-5">
                <div className="border rounded-lg p-4 bg-green-50">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="bg-green-100 p-2 rounded-full">
                      <ArrowUpRight className="h-4 w-4 text-green-600" />
                    </div>
                    <h3 className="font-medium">High Engagement Points</h3>
                  </div>
                  <p className="text-sm">
                    Your audience showed the highest engagement during
                    discussion of product features and demo sections. Consider
                    expanding these segments in future presentations.
                  </p>
                  <div className="mt-3">
                    <Badge variant="outline" className="bg-white mr-2">
                      15:32 - Product Demo
                    </Badge>
                    <Badge variant="outline" className="bg-white mr-2">
                      23:45 - Use Cases
                    </Badge>
                  </div>
                </div>

                <div className="border rounded-lg p-4 bg-amber-50">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="bg-amber-100 p-2 rounded-full">
                      <ArrowDownRight className="h-4 w-4 text-amber-600" />
                    </div>
                    <h3 className="font-medium">Areas for Improvement</h3>
                  </div>
                  <p className="text-sm">
                    Engagement dipped during technical explanations. Consider
                    simplifying complex topics or adding more visual aids to
                    maintain audience interest.
                  </p>
                  <div className="mt-3">
                    <Badge variant="outline" className="bg-white mr-2">
                      08:15 - Technical Overview
                    </Badge>
                    <Badge variant="outline" className="bg-white mr-2">
                      33:27 - Integration Details
                    </Badge>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <Star className="h-4 w-4 text-primary" />
                    </div>
                    <h3 className="font-medium">Audience Response Patterns</h3>
                  </div>
                  <p className="text-sm">
                    Your audience responded particularly well to interactive
                    elements and storytelling. The emotional response was
                    predominantly positive (happy: {emotionData.happy}%) with
                    spikes of surprise during reveal moments.
                  </p>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <Bookmark className="h-4 w-4 text-primary" />
                    </div>
                    <h3 className="font-medium">Recommendations</h3>
                  </div>
                  <ul className="text-sm space-y-2 ml-5 list-disc">
                    <li>
                      Increase interactive segments to maintain high engagement
                    </li>
                    <li>
                      Simplify technical explanations with more visual
                      references
                    </li>
                    <li>
                      Consider shorter overall duration - engagement tapered
                      after 45 minutes
                    </li>
                    <li>
                      Incorporate more "surprise" elements that generated
                      positive reactions
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Comparative Analysis</CardTitle>
              <CardDescription>
                How this event performed against previous events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      {
                        name: "Previous",
                        engagement: 72,
                        attendees: 85,
                        positive: 65,
                      },
                      {
                        name: "Current",
                        engagement: averageEngagement,
                        attendees: 100,
                        positive: emotionData.happy + emotionData.surprised,
                      },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip formatter={(value) => `${value}%`} />
                    <Legend />
                    <Bar
                      name="Engagement"
                      dataKey="engagement"
                      fill="#8884d8"
                    />
                    <Bar
                      name="Attendance (relative)"
                      dataKey="attendees"
                      fill="#82ca9d"
                    />
                    <Bar
                      name="Positive Emotions"
                      dataKey="positive"
                      fill="#ffc658"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
            <CardFooter>
              <p className="text-sm text-muted-foreground">
                This event showed{" "}
                {engagementTrend === "up"
                  ? "improved"
                  : engagementTrend === "down"
                  ? "decreased"
                  : "similar"}{" "}
                performance compared to your previous events.
              </p>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

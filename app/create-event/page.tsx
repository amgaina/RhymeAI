import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Calendar, Mic2, Clock, Save, Play, Plus, Users } from "lucide-react"
import Link from "next/link"

export default function CreateEvent() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-[#333333] text-white">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Mic2 className="h-6 w-6 text-[#FF6D00]" />
            <span className="text-xl font-bold">AI Emcee</span>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" className="text-white hover:text-[#008080]">
              <Save className="h-5 w-5 mr-2" />
              Save Draft
            </Button>
            <div className="w-10 h-10 rounded-full bg-[#008080] flex items-center justify-center text-white font-bold">
              JD
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 animate-slide-up">
          <Link href="/dashboard" className="text-[#333333] hover:text-[#008080] inline-flex items-center">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-[#333333] mt-4">Create New Event</h1>
          <p className="text-gray-600">Set up your AI emcee for your upcoming event</p>
        </div>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid grid-cols-4 mb-8">
            <TabsTrigger value="details" className="data-[state=active]:bg-[#008080] data-[state=active]:text-white">
              Event Details
            </TabsTrigger>
            <TabsTrigger value="voice" className="data-[state=active]:bg-[#008080] data-[state=active]:text-white">
              Voice Settings
            </TabsTrigger>
            <TabsTrigger value="script" className="data-[state=active]:bg-[#008080] data-[state=active]:text-white">
              Script
            </TabsTrigger>
            <TabsTrigger value="preview" className="data-[state=active]:bg-[#008080] data-[state=active]:text-white">
              Preview
            </TabsTrigger>
          </TabsList>

          {/* Event Details Tab */}
          <TabsContent value="details">
            <Card>
              <CardHeader>
                <CardTitle>Event Information</CardTitle>
                <CardDescription>Enter the basic details about your event</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="event-name">Event Name</Label>
                    <Input id="event-name" placeholder="e.g., Tech Conference 2025" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="event-type">Event Type</Label>
                    <Select>
                      <SelectTrigger id="event-type">
                        <SelectValue placeholder="Select event type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="conference">Conference</SelectItem>
                        <SelectItem value="webinar">Webinar</SelectItem>
                        <SelectItem value="corporate">Corporate Meeting</SelectItem>
                        <SelectItem value="education">Educational Event</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="start-date">Start Date</Label>
                    <Input id="start-date" type="date" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="end-date">End Date</Label>
                    <Input id="end-date" type="date" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select>
                      <SelectTrigger id="timezone">
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="est">Eastern Time (ET)</SelectItem>
                        <SelectItem value="cst">Central Time (CT)</SelectItem>
                        <SelectItem value="mst">Mountain Time (MT)</SelectItem>
                        <SelectItem value="pst">Pacific Time (PT)</SelectItem>
                        <SelectItem value="utc">Coordinated Universal Time (UTC)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="event-description">Event Description</Label>
                  <Textarea
                    id="event-description"
                    placeholder="Provide a brief description of your event..."
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="expected-attendees">Expected Attendees</Label>
                    <Input id="expected-attendees" type="number" placeholder="e.g., 500" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="event-format">Event Format</Label>
                    <Select>
                      <SelectTrigger id="event-format">
                        <SelectValue placeholder="Select format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="in-person">In-Person</SelectItem>
                        <SelectItem value="virtual">Virtual</SelectItem>
                        <SelectItem value="hybrid">Hybrid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button className="bg-[#008080] hover:bg-[#006666] text-white btn-pulse">Save and Continue</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Voice Settings Tab */}
          <TabsContent value="voice">
            <Card>
              <CardHeader>
                <CardTitle>Voice Configuration</CardTitle>
                <CardDescription>Customize how your AI emcee will sound</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Primary Voice</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select voice type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male-1">Male Voice 1</SelectItem>
                          <SelectItem value="male-2">Male Voice 2</SelectItem>
                          <SelectItem value="female-1">Female Voice 1</SelectItem>
                          <SelectItem value="female-2">Female Voice 2</SelectItem>
                          <SelectItem value="neutral">Gender Neutral</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Accent</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select accent" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="american">American</SelectItem>
                          <SelectItem value="british">British</SelectItem>
                          <SelectItem value="australian">Australian</SelectItem>
                          <SelectItem value="indian">Indian</SelectItem>
                          <SelectItem value="spanish">Spanish</SelectItem>
                          <SelectItem value="french">French</SelectItem>
                          <SelectItem value="german">German</SelectItem>
                          <SelectItem value="japanese">Japanese</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Speaking Style</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select style" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="professional">Professional</SelectItem>
                          <SelectItem value="friendly">Friendly</SelectItem>
                          <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                          <SelectItem value="formal">Formal</SelectItem>
                          <SelectItem value="casual">Casual</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>Speaking Rate</Label>
                        <span className="text-sm text-gray-500">Normal</span>
                      </div>
                      <Slider defaultValue={[50]} max={100} step={1} />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Slower</span>
                        <span>Faster</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>Pitch</Label>
                        <span className="text-sm text-gray-500">Medium</span>
                      </div>
                      <Slider defaultValue={[50]} max={100} step={1} />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Lower</span>
                        <span>Higher</span>
                      </div>
                    </div>

                    <div className="p-4 bg-gray-100 rounded-md">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-medium text-[#2C3E50]">Voice Preview</h3>
                        <Button size="sm" variant="outline" className="h-8 px-2 text-[#2C3E50]">
                          <Play className="h-4 w-4 mr-1" />
                          Play Sample
                        </Button>
                      </div>
                      <p className="text-gray-600 text-sm italic">
                        "Welcome to our event! I'm your AI host and I'll be guiding you through today's program."
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-medium text-[#2C3E50]">Additional Voices</h3>
                      <p className="text-gray-600 text-sm">Add secondary voices for different segments of your event</p>
                    </div>
                    <Button size="sm" className="bg-[#3498DB] hover:bg-[#2980b9] text-white">
                      <Plus className="h-4 w-4 mr-1" />
                      Add Voice
                    </Button>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-md text-center text-gray-500">
                    No additional voices added yet. Click "Add Voice" to create multiple AI hosts for your event.
                  </div>
                </div>

                <div className="border-t pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-[#2C3E50]">Multilingual Support</h3>
                      <p className="text-gray-600 text-sm">Enable support for multiple languages</p>
                    </div>
                    <Switch />
                  </div>
                </div>

                <div className="flex justify-end space-x-4">
                  <Button variant="outline" className="text-[#333333]">
                    Back
                  </Button>
                  <Button className="bg-[#008080] hover:bg-[#006666] text-white btn-pulse">Save and Continue</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Script Tab */}
          <TabsContent value="script">
            <Card>
              <CardHeader>
                <CardTitle>Event Script</CardTitle>
                <CardDescription>Create the script for your AI emcee to follow</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-4 mb-4">
                  <Button variant="outline" className="text-[#2C3E50]">
                    Use Template
                  </Button>
                  <Button variant="outline" className="text-[#2C3E50]">
                    Import Script
                  </Button>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label>Opening Remarks</Label>
                    <Textarea
                      placeholder="Welcome message and introduction..."
                      rows={4}
                      defaultValue="Welcome to our Tech Conference 2025! I'm your AI host for today's event. We have an exciting lineup of speakers and sessions planned for you over the next three days. Before we begin, I'd like to go over a few housekeeping items..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Session Introductions</Label>
                    <Textarea
                      placeholder="How to introduce each session..."
                      rows={4}
                      defaultValue="Our next session is titled 'The Future of AI in Healthcare' presented by Dr. Jane Smith, who is the Chief Innovation Officer at MedTech Solutions. Dr. Smith has over 15 years of experience in developing AI applications for medical diagnostics..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Speaker Introductions</Label>
                    <Textarea
                      placeholder="How to introduce speakers..."
                      rows={4}
                      defaultValue="I'm pleased to introduce our keynote speaker, John Anderson. John is the founder and CEO of Future Technologies, a company that has revolutionized the way we think about sustainable energy solutions. With over 20 years of experience in the field..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Transitions</Label>
                    <Textarea
                      placeholder="Transitions between sessions..."
                      rows={4}
                      defaultValue="Thank you for that insightful presentation. We'll now take a short 15-minute break before our next session. Please be back in the main hall by 11:15 AM for our panel discussion on 'Ethical Considerations in AI Development'..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Closing Remarks</Label>
                    <Textarea
                      placeholder="Closing message..."
                      rows={4}
                      defaultValue="As we come to the end of our conference, I'd like to thank all of our speakers, sponsors, and most importantly, you, our attendees. We hope you found the sessions informative and inspiring. Please don't forget to fill out the feedback form that has been sent to your email..."
                    />
                  </div>
                </div>

                <div className="border-t pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-medium text-[#2C3E50]">Advanced Settings</h3>
                      <p className="text-gray-600 text-sm">Fine-tune how your script is delivered</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-md">
                      <div>
                        <h4 className="font-medium text-[#2C3E50]">Pause Detection</h4>
                        <p className="text-gray-600 text-sm">Automatically detect and add natural pauses</p>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-md">
                      <div>
                        <h4 className="font-medium text-[#2C3E50]">Emphasis Detection</h4>
                        <p className="text-gray-600 text-sm">Automatically emphasize important words</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-4">
                  <Button variant="outline" className="text-[#333333]">
                    Back
                  </Button>
                  <Button className="bg-[#008080] hover:bg-[#006666] text-white btn-pulse">Save and Continue</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preview Tab */}
          <TabsContent value="preview">
            <Card>
              <CardHeader>
                <CardTitle>Preview Your AI Emcee</CardTitle>
                <CardDescription>Listen to how your AI emcee will sound during your event</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-[#333333] text-white p-6 rounded-lg animate-fade-in">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-[#008080] rounded-full flex items-center justify-center">
                        <Mic2 className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-bold">Tech Conference 2025</h3>
                        <p className="text-sm text-gray-300">British Accent, Professional Tone</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-transparent border-white text-white hover:bg-white/10"
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Play
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-transparent border-white text-white hover:bg-white/10"
                      >
                        Download
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-white/10 p-4 rounded-md">
                      <h4 className="text-sm font-medium text-gray-300 mb-2">Opening Remarks</h4>
                      <p className="text-sm">
                        "Welcome to our Tech Conference 2025! I'm your AI host for today's event. We have an exciting
                        lineup of speakers and sessions planned for you over the next three days..."
                      </p>
                    </div>

                    <div className="bg-white/10 p-4 rounded-md">
                      <h4 className="text-sm font-medium text-gray-300 mb-2">Session Introduction Example</h4>
                      <p className="text-sm">
                        "Our next session is titled 'The Future of AI in Healthcare' presented by Dr. Jane Smith, who is
                        the Chief Innovation Officer at MedTech Solutions..."
                      </p>
                    </div>

                    <div className="bg-white/10 p-4 rounded-md">
                      <h4 className="text-sm font-medium text-gray-300 mb-2">Closing Remarks Example</h4>
                      <p className="text-sm">
                        "As we come to the end of our conference, I'd like to thank all of our speakers, sponsors, and
                        most importantly, you, our attendees..."
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="font-medium text-[#2C3E50] mb-4">Event Summary</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-start">
                        <Calendar className="h-5 w-5 text-[#3498DB] mt-0.5 mr-3" />
                        <div>
                          <h4 className="font-medium text-[#2C3E50]">Event Details</h4>
                          <p className="text-gray-600 text-sm">Tech Conference 2025</p>
                          <p className="text-gray-600 text-sm">June 15-17, 2025</p>
                          <p className="text-gray-600 text-sm">In-Person Event</p>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <Users className="h-5 w-5 text-[#3498DB] mt-0.5 mr-3" />
                        <div>
                          <h4 className="font-medium text-[#2C3E50]">Audience</h4>
                          <p className="text-gray-600 text-sm">Expected Attendees: 500</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-start">
                        <Mic2 className="h-5 w-5 text-[#3498DB] mt-0.5 mr-3" />
                        <div>
                          <h4 className="font-medium text-[#2C3E50]">Voice Settings</h4>
                          <p className="text-gray-600 text-sm">Primary Voice: Male, British Accent</p>
                          <p className="text-gray-600 text-sm">Style: Professional</p>
                          <p className="text-gray-600 text-sm">Additional Voices: None</p>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <Clock className="h-5 w-5 text-[#3498DB] mt-0.5 mr-3" />
                        <div>
                          <h4 className="font-medium text-[#2C3E50]">Content Duration</h4>
                          <p className="text-gray-600 text-sm">Estimated Speaking Time: 45 minutes</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-4">
                  <Button variant="outline" className="text-[#333333]">
                    Back
                  </Button>
                  <Button className="bg-[#FF6D00] hover:bg-[#e56200] text-white btn-pulse">Finalize Event</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

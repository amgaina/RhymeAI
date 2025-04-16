import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PlusCircle, Calendar, Settings, Mic2, Users, Clock, Globe } from "lucide-react"

export default function Dashboard() {
  // Sample data for events
  const events = [
    {
      id: 1,
      name: "Tech Conference 2025",
      date: "June 15-17, 2025",
      voices: 3,
      duration: "8 hours",
      status: "Upcoming",
      languages: ["English", "Spanish"],
    },
    {
      id: 2,
      name: "Product Launch Webinar",
      date: "May 5, 2025",
      voices: 1,
      duration: "2 hours",
      status: "Draft",
      languages: ["English"],
    },
    {
      id: 3,
      name: "Annual Shareholders Meeting",
      date: "July 10, 2025",
      voices: 2,
      duration: "4 hours",
      status: "Upcoming",
      languages: ["English", "French"],
    },
  ]

  return (
    <div className="min-h-screen bg-secondary">
      {/* Header */}
      <header className="bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Mic2 className="h-6 w-6 text-terracotta" />
            <span className="text-xl font-bold">RhymeAI</span>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" className="text-primary-foreground hover:text-accent flex items-center gap-2">
              <Settings className="h-5 w-5" />
              <span>Settings</span>
            </Button>
            <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-white font-bold">
              JD
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div className="animate-slide-up">
            <h1 className="text-3xl font-bold text-primary-foreground">Your Events</h1>
            <p className="text-primary-foreground/70">Manage your AI-powered event hosts</p>
          </div>
          <Button
            className="mt-4 md:mt-0 bg-cta hover:bg-cta/90 text-white btn-pulse animate-slide-up flex items-center gap-2"
            style={{ animationDelay: "0.2s" }}
          >
            <PlusCircle className="h-5 w-5" />
            Create New Event
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 stagger-animation">
          <Card className="hover-scale animate-fade-in rhyme-card" style={{ animationDelay: "0.1s" }}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-primary-foreground/70">Total Events</p>
                  <p className="text-3xl font-bold text-primary-foreground">12</p>
                </div>
                <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-scale animate-fade-in rhyme-card" style={{ animationDelay: "0.2s" }}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-primary-foreground/70">Active Voices</p>
                  <p className="text-3xl font-bold text-primary-foreground">8</p>
                </div>
                <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center">
                  <Mic2 className="h-6 w-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-scale animate-fade-in rhyme-card" style={{ animationDelay: "0.3s" }}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-primary-foreground/70">Total Attendees</p>
                  <p className="text-3xl font-bold text-primary-foreground">2.4k</p>
                </div>
                <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center">
                  <Users className="h-6 w-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-scale animate-fade-in rhyme-card" style={{ animationDelay: "0.4s" }}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-primary-foreground/70">Content Hours</p>
                  <p className="text-3xl font-bold text-primary-foreground">42</p>
                </div>
                <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center">
                  <Clock className="h-6 w-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Events Table */}
        <Card className="mb-8 animate-slide-up rhyme-card">
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
            <CardDescription>Manage your scheduled and draft events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-primary/10">
                    <th className="text-left py-3 px-4 font-medium text-primary-foreground/70">Event Name</th>
                    <th className="text-left py-3 px-4 font-medium text-primary-foreground/70">Date</th>
                    <th className="text-left py-3 px-4 font-medium text-primary-foreground/70">Voices</th>
                    <th className="text-left py-3 px-4 font-medium text-primary-foreground/70">Duration</th>
                    <th className="text-left py-3 px-4 font-medium text-primary-foreground/70">Languages</th>
                    <th className="text-left py-3 px-4 font-medium text-primary-foreground/70">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-primary-foreground/70">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event, index) => (
                    <tr
                      key={event.id}
                      className="border-b border-primary/10 hover:bg-primary/5 animate-fade-in"
                      style={{ animationDelay: `${0.1 + index * 0.1}s` }}
                    >
                      <td className="py-4 px-4">
                        <div className="font-medium text-primary-foreground">{event.name}</div>
                      </td>
                      <td className="py-4 px-4 text-primary-foreground/70">{event.date}</td>
                      <td className="py-4 px-4 text-primary-foreground/70">{event.voices}</td>
                      <td className="py-4 px-4 text-primary-foreground/70">{event.duration}</td>
                      <td className="py-4 px-4">
                        <div className="flex space-x-1">
                          {event.languages.map((lang, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-accent/10 text-accent"
                            >
                              <Globe className="h-3 w-3 mr-1" />
                              {lang}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            event.status === "Upcoming" ? "bg-cta/10 text-cta" : "bg-terracotta/10 text-terracotta"
                          }`}
                        >
                          {event.status}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-2 text-primary-foreground border-accent hover:bg-accent/10"
                          >
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-2 text-primary-foreground border-accent hover:bg-accent/10"
                          >
                            Preview
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 stagger-animation">
          <Card className="hover-lift animate-slide-up rhyme-card" style={{ animationDelay: "0.1s" }}>
            <CardHeader>
              <CardTitle>Create New Voice</CardTitle>
              <CardDescription>Add a new AI voice to your collection</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-primary-foreground/70 mb-4">
                Customize accent, tone, and speaking style for your next event.
              </p>
              <Button className="w-full bg-accent hover:bg-accent/90 text-white rhyme-button">Create Voice</Button>
            </CardContent>
          </Card>

          <Card className="hover-lift animate-slide-up rhyme-card" style={{ animationDelay: "0.2s" }}>
            <CardHeader>
              <CardTitle>Script Templates</CardTitle>
              <CardDescription>Use pre-made templates for your events</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-primary-foreground/70 mb-4">
                Choose from conference, webinar, or corporate meeting templates.
              </p>
              <Button className="w-full bg-accent hover:bg-accent/90 text-white rhyme-button">Browse Templates</Button>
            </CardContent>
          </Card>

          <Card className="hover-lift animate-slide-up rhyme-card" style={{ animationDelay: "0.3s" }}>
            <CardHeader>
              <CardTitle>Help & Support</CardTitle>
              <CardDescription>Get assistance with your AI emcee</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-primary-foreground/70 mb-4">
                Access tutorials, documentation, or contact our support team.
              </p>
              <Button className="w-full bg-accent hover:bg-accent/90 text-white rhyme-button">Get Help</Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

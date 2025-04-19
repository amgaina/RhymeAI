import { ArrowRight, Calendar, Globe, Mic2, Users, UserCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CreateEventButton } from "@/components/CreateEventButton";


export default async function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="bg-primary text-primary-foreground rhyme-hero h-[80vh] flex items-center">
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-10 md:mb-0 animate-slide-up">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">Your AI-Powered Event Host</h1>
              <p className="text-lg mb-8 text-primary-foreground/80">
                Transform your events with a customizable AI emcee that speaks in your chosen voice, tone, and language.
                Perfect for conferences, presentations, and educational events.
              </p>
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <CreateEventButton />
                <Button
                  variant="outline"
                  className="border-accent text-accent hover:bg-accent/10 px-8 py-6 text-lg rounded-xl transition-colors duration-300"
                >
                  Watch Demo
                </Button>
              </div>
            </div>
            <div className="md:w-1/2 flex justify-center animate-fade-in" style={{ animationDelay: "0.3s" }}>
              <div className="relative w-full max-w-md hover-lift animate-float">
                <div className="bg-secondary rounded-lg shadow-xl overflow-hidden rhyme-card">
                  <div className="bg-accent p-4 text-accent-foreground">
                    <h3 className="font-bold">Tech Conference 2025</h3>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-white">
                          <Mic2 className="h-5 w-5" />
                        </div>
                        <div className="ml-4">
                          <p className="text-primary-foreground font-medium">British Accent, Professional Tone</p>
                          <p className="text-sm text-primary-foreground/70">Primary Voice</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-white">
                          <Calendar className="h-5 w-5" />
                        </div>
                        <div className="ml-4">
                          <p className="text-primary-foreground font-medium">June 15-17, 2025</p>
                          <p className="text-sm text-primary-foreground/70">3-Day Event</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-white">
                          <Users className="h-5 w-5" />
                        </div>
                        <div className="ml-4">
                          <p className="text-primary-foreground font-medium">500+ Attendees</p>
                          <p className="text-sm text-primary-foreground/70">International Audience</p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-6 pt-6 border-t border-primary/20">
                      <div className="bg-secondary/50 p-3 rounded-md">
                        <p className="text-primary-foreground italic">
                          "Welcome to the 2025 Tech Innovation Summit! I'm your AI host for today's exciting
                          sessions..."
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-secondary rhyme-section">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-slide-up">
            <h2 className="text-3xl font-bold text-primary-foreground mb-4">Powerful Features</h2>
            <p className="text-primary-foreground/70 max-w-2xl mx-auto">
              Our AI emcee platform offers everything you need to create a professional and engaging event experience.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 stagger-animation">
            <div className="bg-white p-6 rounded-lg shadow-md border border-primary/10 hover-lift animate-fade-in rhyme-card">
              <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mb-4">
                <Mic2 className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold text-primary-foreground mb-2">Customizable Voice</h3>
              <p className="text-primary-foreground/70">
                Choose from various accents, tones, and speaking styles to match your event's atmosphere.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md border border-primary/10 hover-lift animate-fade-in rhyme-card">
              <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mb-4">
                <Globe className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold text-primary-foreground mb-2">Multilingual Support</h3>
              <p className="text-primary-foreground/70">
                Host your event in multiple languages to accommodate international audiences.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md border border-primary/10 hover-lift animate-fade-in rhyme-card">
              <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mb-4">
                <Calendar className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold text-primary-foreground mb-2">Real-time Adaptability</h3>
              <p className="text-primary-foreground/70">
                Make last-minute changes to your script or schedule and the AI will adapt instantly.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md border border-primary/10 hover-lift animate-fade-in rhyme-card">
              <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold text-primary-foreground mb-2">Multiple Personas</h3>
              <p className="text-primary-foreground/70">
                Create different AI hosts for various segments of your event with unique personalities.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-background py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-primary-foreground mb-12">
            How RhymeAI Works
          </h2>

          <div className="grid md:grid-cols-3 gap-10 stagger-animation">
            {/* Step 1 */}
            <div className="bg-white dark:bg-muted p-8 rounded-2xl shadow-lg relative group transition-all duration-300 hover:shadow-2xl">
              <h3 className="text-xl font-semibold text-primary-foreground mb-3 group-hover:text-accent transition-colors">
                Create Your Event
              </h3>
              <p className="text-sm text-primary-foreground/70 mb-5 leading-relaxed">
                Sign up and create a new event. Add basic details like name, date, and type of event.
              </p>
              <div className="flex justify-center">
                <img
                  src="/create-event.png"
                  alt="Create event interface"
                  className="w-48 h-48 object-cover rounded-lg border border-muted shadow-sm group-hover:scale-[1.02] transition-transform duration-300"
                />
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-white dark:bg-muted p-8 rounded-2xl shadow-lg relative group transition-all duration-300 hover:shadow-2xl">
              <h3 className="text-xl font-semibold text-primary-foreground mb-3 group-hover:text-accent transition-colors">
                Customize Your AI Host
              </h3>
              <p className="text-sm text-primary-foreground/70 mb-5 leading-relaxed">
                Select voice characteristics, speaking style, and language preferences for your AI emcee.
              </p>
              <div className="flex justify-center">
                <img
                  src="/customize-ai-host.png"
                  alt="Voice customization interface"
                  className="w-48 h-48 object-cover rounded-lg border border-muted shadow-sm group-hover:scale-[1.02] transition-transform duration-300"
                />
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-white dark:bg-muted p-8 rounded-2xl shadow-lg relative group transition-all duration-300 hover:shadow-2xl">
              <h3 className="text-xl font-semibold text-primary-foreground mb-3 group-hover:text-accent transition-colors">
                Add Your Script
              </h3>
              <p className="text-sm text-primary-foreground/70 mb-5 leading-relaxed">
                Upload or type your script, including announcements, introductions, and transitions.
              </p>
              <div className="flex justify-center">
                <img
                  src="/add-script.png"
                  alt="Script editor interface"
                  className="w-48 h-48 object-cover rounded-lg border border-muted shadow-sm group-hover:scale-[1.02] transition-transform duration-300"
                />
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <div className="mt-14 text-center flex justify-center">
            <Button
              className="bg-gradient-to-br from-accent to-accent/90 hover:from-accent/90 hover:to-accent/80 transition-all duration-300 ease-in-out shadow-md hover:shadow-lg rounded-full px-6 py-2 text-white text-base font-semibold flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-accent/40"
            >
              <span>Get Started Now</span>
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1 duration-300" />
            </Button>
          </div>
        </div>
      </section >


      {/* Pricing Section */}
      < section id="pricing" className="py-20 bg-secondary rhyme-section" >
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-primary-foreground mb-4">Simple Pricing</h2>
            <p className="text-primary-foreground/70 max-w-2xl mx-auto">
              Choose the plan that works best for your event needs. All plans include our core AI emcee features.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto stagger-animation">
            <div className="bg-white p-8 rounded-lg shadow-md border border-primary/10 hover-lift transition-shadow rhyme-card animate-fade-in">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-primary-foreground">Basic</h3>
                <div className="mt-4 mb-6">
                  <span className="text-4xl font-bold text-primary-foreground">$99</span>
                  <span className="text-primary-foreground/70">/event</span>
                </div>
                <p className="text-primary-foreground/70">Perfect for small events and presentations</p>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <svg
                    className="h-5 w-5 text-accent mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span className="text-primary-foreground/70">1 AI voice</span>
                </li>
                <li className="flex items-center">
                  <svg
                    className="h-5 w-5 text-accent mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span className="text-primary-foreground/70">Up to 2 hours of content</span>
                </li>
                <li className="flex items-center">
                  <svg
                    className="h-5 w-5 text-accent mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span className="text-primary-foreground/70">Basic voice customization</span>
                </li>
                <li className="flex items-center">
                  <svg
                    className="h-5 w-5 text-accent mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span className="text-primary-foreground/70">Email support</span>
                </li>
              </ul>
              <Button className="w-full bg-white hover:bg-primary/10 text-primary-foreground border border-primary-foreground rhyme-button">
                Choose Basic
              </Button>
            </div>

            <div className="bg-accent p-8 rounded-lg shadow-xl transform md:scale-105 relative rhyme-card animate-fade-in">
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-sienna text-white px-4 py-1 rounded-full text-sm font-bold">
                MOST POPULAR
              </div>
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-white">Professional</h3>
                <div className="mt-4 mb-6">
                  <span className="text-4xl font-bold text-white">$249</span>
                  <span className="text-white/80">/event</span>
                </div>
                <p className="text-white/80">Ideal for conferences and corporate events</p>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <svg
                    className="h-5 w-5 text-white mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span className="text-white/80">3 AI voices</span>
                </li>
                <li className="flex items-center">
                  <svg
                    className="h-5 w-5 text-white mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span className="text-white/80">Up to 8 hours of content</span>
                </li>
                <li className="flex items-center">
                  <svg
                    className="h-5 w-5 text-white mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span className="text-white/80">Advanced voice customization</span>
                </li>
                <li className="flex items-center">
                  <svg
                    className="h-5 w-5 text-white mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span className="text-white/80">Real-time script adjustments</span>
                </li>
                <li className="flex items-center">
                  <svg
                    className="h-5 w-5 text-white mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span className="text-white/80">Priority support</span>
                </li>
              </ul>
              <Button className="w-full bg-cta hover:bg-cta/90 text-white rhyme-button">Choose Professional</Button>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-md border border-primary/10 hover-lift transition-shadow rhyme-card animate-fade-in">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-primary-foreground">Enterprise</h3>
                <div className="mt-4 mb-6">
                  <span className="text-4xl font-bold text-primary-foreground">$499</span>
                  <span className="text-primary-foreground/70">/event</span>
                </div>
                <p className="text-primary-foreground/70">For large-scale events and productions</p>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <svg
                    className="h-5 w-5 text-accent mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span className="text-primary-foreground/70">Unlimited AI voices</span>
                </li>
                <li className="flex items-center">
                  <svg
                    className="h-5 w-5 text-accent mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span className="text-primary-foreground/70">Unlimited content</span>
                </li>
                <li className="flex items-center">
                  <svg
                    className="h-5 w-5 text-accent mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span className="text-primary-foreground/70">Premium voice customization</span>
                </li>
                <li className="flex items-center">
                  <svg
                    className="h-5 w-5 text-accent mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span className="text-primary-foreground/70">Multi-language support</span>
                </li>
                <li className="flex items-center">
                  <svg
                    className="h-5 w-5 text-accent mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span className="text-primary-foreground/70">24/7 dedicated support</span>
                </li>
              </ul>
              <Button className="w-full bg-white hover:bg-primary/10 text-primary-foreground border border-primary-foreground rhyme-button">
                Choose Enterprise
              </Button>
            </div>
          </div>
        </div>
      </section >

      {/* Testimonials */}
      < section className="py-20 bg-primary/20 rhyme-section" >
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-primary-foreground mb-4">What Our Customers Say</h2>
            <p className="text-primary-foreground/70 max-w-2xl mx-auto">
              Hear from event organizers who have transformed their events with our AI emcee platform.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 stagger-animation">
            <div className="bg-white p-8 rounded-lg shadow-md rhyme-card animate-fade-in">
              <div className="flex items-center mb-4">
                <div className="text-terracotta">
                  {Array(5)
                    .fill(0)
                    .map((_, i) => (
                      <span key={i} className="text-xl">
                        ★
                      </span>
                    ))}
                </div>
              </div>
              <p className="text-primary-foreground/70 mb-6 italic">
                "The AI emcee was a game-changer for our tech conference. It handled announcements flawlessly and
                adapted to our last-minute schedule changes without any issues."
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center text-white font-bold">
                  JD
                </div>
                <div className="ml-4">
                  <p className="font-semibold text-primary-foreground">John Doe</p>
                  <p className="text-sm text-primary-foreground/70">Event Director, TechCon</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-md rhyme-card animate-fade-in">
              <div className="flex items-center mb-4">
                <div className="text-terracotta">
                  {Array(5)
                    .fill(0)
                    .map((_, i) => (
                      <span key={i} className="text-xl">
                        ★
                      </span>
                    ))}
                </div>
              </div>
              <p className="text-primary-foreground/70 mb-6 italic">
                "Our university graduation ceremony needed to be multilingual, and the AI emcee handled English,
                Spanish, and Mandarin announcements perfectly. Parents were impressed!"
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-terracotta rounded-full flex items-center justify-center text-white font-bold">
                  SR
                </div>
                <div className="ml-4">
                  <p className="font-semibold text-primary-foreground">Sarah Rodriguez</p>
                  <p className="text-sm text-primary-foreground/70">Dean, Global University</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-md rhyme-card animate-fade-in">
              <div className="flex items-center mb-4">
                <div className="text-terracotta">
                  {Array(5)
                    .fill(0)
                    .map((_, i) => (
                      <span key={i} className="text-xl">
                        ★
                      </span>
                    ))}
                </div>
              </div>
              <p className="text-primary-foreground/70 mb-6 italic">
                "As a small business, we couldn't afford a professional emcee for our product launch. The AI host was
                affordable and sounded completely natural. Our audience loved it!"
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-sienna rounded-full flex items-center justify-center text-white font-bold">
                  MP
                </div>
                <div className="ml-4">
                  <p className="font-semibold text-primary-foreground">Michael Patel</p>
                  <p className="text-sm text-primary-foreground/70">Founder, StartUp Inc.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section >

      {/* CTA Section */}
      < section className="py-20 bg-primary text-primary-foreground rhyme-section rhyme-hero" >
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl font-bold mb-6 animate-slide-up">Ready to Transform Your Events?</h2>
          <p
            className="text-xl text-primary-foreground/80 mb-8 max-w-2xl mx-auto animate-slide-up"
            style={{ animationDelay: "0.2s" }}
          >
            Join hundreds of organizations already using our AI emcee platform to create professional, engaging events.
          </p>
          <div
            className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4 animate-slide-up"
            style={{ animationDelay: "0.4s" }}
          >
            <Button className="bg-cta hover:bg-cta/90 text-white px-8 py-6 text-lg btn-pulse flex items-center gap-2">
              <UserCircle2 className="h-5 w-5" />
              <span>Get Started Free</span>
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button variant="outline" className="border-accent text-accent hover:bg-accent/10 px-8 py-6 text-lg">
              Schedule a Demo
            </Button>
          </div>
        </div>
      </section >

      {/* Footer */}
      < footer className="bg-primary-foreground text-white py-12" >
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Mic2 className="h-6 w-6 text-terracotta" />
                <span className="text-xl font-bold">RhymeAI</span>
              </div>
              <p className="text-white/70 mb-4">
                Transform your events with our AI-powered emcee platform. Professional, customizable, and
                cost-effective.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-white/70 hover:text-accent transition-colors">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fillRule="evenodd"
                      d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                </a>
                <a href="#" className="text-white/70 hover:text-accent transition-colors">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path>
                  </svg>
                </a>
                <a href="#" className="text-white/70 hover:text-accent transition-colors">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fillRule="evenodd"
                      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                </a>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Product</h3>
              <ul className="space-y-2">
                <li>
                  <a href="#features" className="text-white/70 hover:text-accent transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="text-white/70 hover:text-accent transition-colors">
                    Use Cases
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="text-white/70 hover:text-accent transition-colors">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="text-white/70 hover:text-accent transition-colors">
                    Integrations
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Resources</h3>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-white/70 hover:text-accent transition-colors">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="text-white/70 hover:text-accent transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="text-white/70 hover:text-accent transition-colors">
                    Tutorials
                  </a>
                </li>
                <li>
                  <a href="#" className="text-white/70 hover:text-accent transition-colors">
                    Support
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Company</h3>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-white/70 hover:text-accent transition-colors">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#" className="text-white/70 hover:text-accent transition-colors">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#" className="text-white/70 hover:text-accent transition-colors">
                    Contact
                  </a>
                </li>
                <li>
                  <a href="#" className="text-white/70 hover:text-accent transition-colors">
                    Privacy Policy
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/20 mt-12 pt-8 text-center text-white/70">
            <p>&copy; {new Date().getFullYear()} RhymeAI. All rights reserved.</p>
          </div>
        </div>
      </footer >
    </div >
  )
}



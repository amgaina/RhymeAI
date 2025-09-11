"use client"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { FileInput, ClipboardList, Sparkles, ChevronRight } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

export default function CreateEvent() {
  const router = useRouter()
  const [isGenerating, setIsGenerating] = useState(false)
  const [showCodeTransition, setShowCodeTransition] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [description, setDescription] = useState("")

  // Fix hydration issues by ensuring client-side only rendering for dynamic content
  useEffect(() => {
    setIsClient(true)
  }, [])

  const handleGenerate = () => {
    if (!description.trim()) return;
    setIsGenerating(true);
    setShowCodeTransition(true);

    setTimeout(() => {
      const encoded = encodeURIComponent(description);
      router.push(`/test-dashboard/?query=${encoded}`);
    }, 2500);
  };

  // Sample code lines for the transition effect
  const codeLines = [
    "// Generating event structure...",
    "const event = new EventBuilder();",
    "event.setType('webinar');",
    "event.setDuration(60); // minutes",
    "event.addSegment('welcome');",
    "event.addSegment('presentation');",
    "event.addSegment('qna');",
    "// Optimizing layout...",
    "applyAILayoutSuggestions();",
    "// Finalizing configuration...",
    "event.compile();",
  ]

  // Decorative floating elements - positions are now fixed to avoid hydration issues
  const floatingElements = [
    { id: 1, size: "w-12 h-12", left: "10%", top: "20%", delay: 0 },
    { id: 2, size: "w-24 h-24", left: "70%", top: "15%", delay: 2 },
    { id: 3, size: "w-16 h-16", left: "25%", top: "60%", delay: 4 },
    { id: 4, size: "w-20 h-20", left: "80%", top: "70%", delay: 1 },
    { id: 5, size: "w-32 h-32", left: "40%", top: "80%", delay: 3 },
  ]

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#f8f6f0]">
      {/* Decorative background elements - only render on client to avoid hydration issues */}
      {isClient && (
        <div className="absolute inset-0 overflow-hidden">
          {floatingElements.map((el) => (
            <motion.div
              key={el.id}
              className={`absolute rounded-full ${el.size} bg-[#e8e4c9]/40 blur-xl`}
              initial={{ opacity: 0.3 }}
              animate={{
                x: [0, 20, 0],
                y: [0, 15, 0],
                opacity: [0.3, 0.7, 0.3],
              }}
              transition={{
                repeat: Number.POSITIVE_INFINITY,
                duration: 15,
                delay: el.delay,
                repeatType: "reverse",
              }}
              style={{
                left: el.left,
                top: el.top,
              }}
            />
          ))}
        </div>
      )}

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-grid-beige/[0.03] bg-[size:40px_40px] opacity-30"></div>

      <AnimatePresence>
        {showCodeTransition ? (
          <motion.div
            key="code-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center"
          >
            <div className="max-w-2xl w-full p-6">
              <motion.div
                className="bg-[#1e1e1e] rounded-xl overflow-hidden border border-[#d6cca9] shadow-[0_0_50px_rgba(214,204,169,0.3)]"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <div className="bg-gray-800 px-4 py-3 flex items-center">
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <div className="text-gray-400 text-sm ml-4 flex items-center">
                    <span className="text-[#d6cca9]">generating-event</span>
                    <span>.ts</span>
                  </div>
                </div>
                <div className="p-6 font-mono text-sm text-gray-300 h-96 overflow-auto bg-[#1e1e1e] bg-opacity-95">
                  {codeLines.map((line: string, index: number) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.15, duration: 0.3 }}
                      className={`whitespace-pre mb-2 ${line.includes("✅") ? "text-green-400 font-bold" : ""}`}
                    >
                      {line.includes("//") ? (
                        <>
                          <span className="text-gray-500">{line.split("//")[0]}// </span>
                          <span className="text-[#d6cca9]">{line.split("//")[1]}</span>
                        </>
                      ) : line.includes("✅") ? (
                        <span className="flex items-center">
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: index * 0.15 + 0.1, type: "spring" }}
                          >
                            {line}
                          </motion.span>
                        </span>
                      ) : (
                        <span
                          dangerouslySetInnerHTML={{
                            __html: line
                              .replace(/const|new|function/g, '<span class="text-blue-400">$&</span>')
                              .replace(/;|,|\./g, '<span class="text-gray-500">$&</span>')
                              .replace(/'[^']*'/g, '<span class="text-green-400">$&</span>')
                              .replace(/\d+/g, '<span class="text-orange-400">$&</span>'),
                          }}
                        />
                      )}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </motion.div>
        ) : (
          <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="w-full max-w-3xl mx-auto space-y-6 relative"
            >
              {/* Glowing card effect */}
              <div className="absolute inset-0 bg-[#d6cca9]/30 rounded-2xl blur-xl"></div>

              <div className="relative bg-white/90 backdrop-blur-sm border border-[#d6cca9]/30 rounded-2xl p-6 shadow-xl">
                {/* Chat prompt area */}
                <div className="space-y-6">
                  <div className="relative">
                    <Textarea
                      className="min-h-[150px] text-lg py-4 px-5 resize-none bg-[#f8f6f0]/50 border-[#d6cca9]/30 rounded-xl focus:ring-2 focus:ring-[#d6cca9]/50 focus:border-[#d6cca9]/50 transition-all duration-300"
                      placeholder="Describe your event in detail... (e.g., 'A 3-day tech conference with keynotes, workshops, and networking events')"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                    <div className="absolute bottom-3 right-3 text-[#8a7e55]/60 text-sm">AI-powered</div>
                  </div>

                  <div className="flex justify-center pt-2">
                    <Button
                      className="px-8 py-6 text-lg relative overflow-hidden rounded-xl bg-gradient-to-r from-[#d6cca9] to-[#c2b792] hover:from-[#c2b792] hover:to-[#d6cca9] text-[#5c4f35] transition-all duration-300 shadow-lg shadow-[#d6cca9]/30 group border-0"
                      onClick={handleGenerate}
                      disabled={isGenerating}

                    >
                      {isGenerating && (
                        <motion.span
                          className="absolute left-0 top-0 h-full bg-white/20"
                          initial={{ width: 0 }}
                          animate={{ width: "100%" }}
                          transition={{ duration: 2.5, ease: "linear" }}
                        />
                      )}
                      <span className="relative z-10 flex items-center gap-2">
                        {isGenerating ? (
                          <>
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                            >
                              <Sparkles className="h-5 w-5" />
                            </motion.div>
                            <span>Generating...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-5 w-5" />
                            <span>Generate Event</span>
                            <motion.div
                              animate={{ x: [0, 5, 0] }}
                              transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, repeatType: "reverse" }}
                            >
                              <ChevronRight className="h-5 w-5" />
                            </motion.div>
                          </>
                        )}
                      </span>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Action buttons with icons */}
              <motion.div
                className="flex flex-wrap justify-center gap-4 pt-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <Button
                  variant="outline"
                  size="lg"
                  className="gap-2 text-[#8a7e55] border-[#d6cca9]/40 bg-white/50 backdrop-blur-sm hover:bg-[#f5f5dc]/50 hover:text-[#5c4f35] transition-all duration-300"
                >
                  <FileInput className="h-4 w-4" />
                  Import from PDF
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="gap-2 text-[#8a7e55] border-[#d6cca9]/40 bg-white/50 backdrop-blur-sm hover:bg-[#f5f5dc]/50 hover:text-[#5c4f35] transition-all duration-300"
                  onClick={() => router.push("/form-builder")}
                >
                  <ClipboardList className="h-4 w-4" />
                  Use Form Builder
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="gap-2 text-[#8a7e55] border-[#d6cca9]/40 bg-white/50 backdrop-blur-sm hover:bg-[#f5f5dc]/50 hover:text-[#5c4f35] transition-all duration-300"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M8 3H5a2 2 0 0 0-2 2v3" />
                    <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
                    <path d="M3 16v3a2 2 0 0 0 2 2h3" />
                    <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
                  </svg>
                  Use Previous Template
                </Button>
              </motion.div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

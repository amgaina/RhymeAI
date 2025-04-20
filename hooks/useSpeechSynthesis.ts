import { useState, useEffect } from "react";
import { ScriptSegment } from "@/components/ScriptEditor";

export function useSpeechSynthesis() {
  // Text-to-speech state
  const [availableVoices, setAvailableVoices] = useState<
    SpeechSynthesisVoice[]
  >([]);
  const [selectedVoice, setSelectedVoice] =
    useState<SpeechSynthesisVoice | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [ttsUtterance, setTtsUtterance] =
    useState<SpeechSynthesisUtterance | null>(null);
  const [ttsSupported, setTtsSupported] = useState(true);

  // Initialize speech synthesis and load available voices
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (!("speechSynthesis" in window)) {
        console.log("Text-to-speech not supported in this browser");
        setTtsSupported(false);
        return;
      }

      // Set available voices when they load
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          setAvailableVoices(voices);
          // Set default voice
          const defaultVoice =
            voices.find((voice) => voice.default) || voices[0];
          setSelectedVoice(defaultVoice);
        }
      };

      // Chrome loads voices asynchronously
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }

      // Initial load of voices (works in Firefox)
      loadVoices();

      // Cleanup function to cancel any active speech when component unmounts
      return () => {
        window.speechSynthesis.cancel();
      };
    }
  }, []);

  // Play text using speech synthesis
  const speakText = (text: string) => {
    if (!ttsSupported || !selectedVoice) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    // Create utterance with selected voice
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = selectedVoice;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    // Set up events
    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = (event) => {
      console.error("SpeechSynthesis error:", event);
      setIsPlaying(false);
    };

    // Store utterance in state
    setTtsUtterance(utterance);

    // Speak the text
    window.speechSynthesis.speak(utterance);
  };

  // Stop current speech
  const stopSpeaking = () => {
    if (!ttsSupported) return;
    window.speechSynthesis.cancel();
    setIsPlaying(false);
  };

  // Change the voice
  const changeVoice = (voiceName: string) => {
    const voice = availableVoices.find((v) => v.name === voiceName);
    if (voice) {
      setSelectedVoice(voice);

      // If something is currently being spoken, update the voice
      if (isPlaying && ttsUtterance) {
        stopSpeaking();
        speakText(ttsUtterance.text);
      }
    }
  };

  // Handle generating audio for a script segment
  const handleGenerateAudio = (
    scriptSegments: ScriptSegment[],
    setScriptSegments: React.Dispatch<React.SetStateAction<ScriptSegment[]>>,
    segmentId: number,
    setProgress?: React.Dispatch<React.SetStateAction<number>>
  ) => {
    // Set status to generating
    setScriptSegments((prev) =>
      prev.map((segment) =>
        segment.id === segmentId
          ? { ...segment, status: "generating" }
          : segment
      )
    );

    // Get the segment content
    const segment = scriptSegments.find((s) => s.id === segmentId);
    if (!segment) return;

    // For real implementation, this would call an API to generate audio
    // For now, we'll use the browser's TTS as a placeholder
    if (ttsSupported && selectedVoice) {
      // Create an AudioContext to record TTS audio
      try {
        const audioContext = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
        const mediaStreamDest = audioContext.createMediaStreamDestination();

        // Record the TTS for demonstration purposes
        const mediaRecorder = new MediaRecorder(mediaStreamDest.stream);
        const audioChunks: BlobPart[] = [];

        mediaRecorder.ondataavailable = (event) => {
          audioChunks.push(event.data);
        };

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
          const audioUrl = URL.createObjectURL(audioBlob);

          // Update segment with generated audio
          setScriptSegments((prev) =>
            prev.map((s) =>
              s.id === segmentId
                ? {
                    ...s,
                    status: "generated",
                    audio: audioUrl,
                  }
                : s
            )
          );

          // If all segments have audio, increase progress
          if (
            setProgress &&
            scriptSegments.every(
              (s) => s.id === segmentId || s.status === "generated"
            )
          ) {
            setProgress((prev) => Math.min(prev + 15, 100));
          }
        };

        // Start recording
        mediaRecorder.start();

        // Speak the text (this is a simplified placeholder; real implementation would use an API)
        speakText(segment.content);

        // Stop recording after a few seconds
        setTimeout(() => {
          mediaRecorder.stop();
        }, 5000);
      } catch (error) {
        console.error("Error creating audio:", error);

        // Fallback to mock implementation if recording fails
        simulateAudioGeneration(
          scriptSegments,
          setScriptSegments,
          segmentId,
          setProgress
        );
      }
    } else {
      // Fallback to mock implementation
      simulateAudioGeneration(
        scriptSegments,
        setScriptSegments,
        segmentId,
        setProgress
      );
    }
  };

  // Simulate audio generation with timeout (fallback method)
  const simulateAudioGeneration = (
    scriptSegments: ScriptSegment[],
    setScriptSegments: React.Dispatch<React.SetStateAction<ScriptSegment[]>>,
    segmentId: number,
    setProgress?: React.Dispatch<React.SetStateAction<number>>
  ) => {
    setTimeout(() => {
      setScriptSegments((prev) =>
        prev.map((segment) =>
          segment.id === segmentId
            ? {
                ...segment,
                status: "generated",
                audio: `mock-audio-url-${segmentId}.mp3`,
              }
            : segment
        )
      );

      // If all segments have audio, increase progress
      if (
        setProgress &&
        scriptSegments.every((segment) => segment.status === "generated")
      ) {
        setProgress((prev) => Math.min(prev + 15, 100));
      }
    }, 2000);
  };

  return {
    availableVoices,
    selectedVoice,
    isPlaying,
    ttsSupported,
    speakText,
    stopSpeaking,
    changeVoice,
    handleGenerateAudio,
  };
}

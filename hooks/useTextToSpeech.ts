import { useState, useEffect } from "react";

export interface TextToSpeechOptions {
  rate?: number;
  pitch?: number;
}

export default function useTextToSpeech() {
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
  const speakText = (text: string, options: TextToSpeechOptions = {}) => {
    if (!ttsSupported || !selectedVoice) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    // Create utterance with selected voice
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = selectedVoice;
    utterance.rate = options.rate || 1.0;
    utterance.pitch = options.pitch || 1.0;

    // Set up events
    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = (event) => {
      // Get more detailed error information
      const errorType = event.error || "unknown";
      const errorMessage = event.message || "No error details available";

      console.error(`SpeechSynthesis error: ${errorType}`, event);

      // Handle specific error types
      if (errorType === "canceled") {
        console.log(
          "Speech synthesis was canceled - this is normal when navigating or starting a new speech"
        );
      } else if (errorType === "interrupted") {
        console.log("Speech synthesis was interrupted by another utterance");
      } else if (errorType === "audio-busy") {
        console.log("Audio channel was busy");
      } else if (errorType === "network") {
        console.error("Network error occurred during speech synthesis");
      } else if (errorType === "synthesis-unavailable") {
        console.error("Speech synthesis service was unavailable");
      } else {
        console.error(
          `Unhandled speech synthesis error: ${errorType} - ${errorMessage}`
        );
      }

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

  return {
    availableVoices,
    selectedVoice,
    isPlaying,
    ttsSupported,
    speakText,
    stopSpeaking,
    changeVoice,
  };
}

"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  RhymeAIChatWrapper,
  RhymeAIChatWrapperProps,
} from "./RhymeAIChatWrapper";

export default function SafeRhymeAIChatWrapper(props: RhymeAIChatWrapperProps) {
  // Use refs to prevent unnecessary re-renders
  const propsRef = useRef(props);
  const [shouldRender, setShouldRender] = useState(false);
  const errorCountRef = useRef(0);

  // Update props ref without causing re-renders
  useEffect(() => {
    propsRef.current = props;
  }, [props]);

  // Only render the component after initial mount to break any existing render loops
  useEffect(() => {
    // Small delay to let React stabilize
    const timer = setTimeout(() => {
      setShouldRender(true);
    }, 10);

    return () => clearTimeout(timer);
  }, []);

  // Error boundary logic using refs and state
  const [hasError, setHasError] = useState(false);

  // Function to handle errors
  const handleError = (error: Error) => {
    console.error("Error in RhymeAIChatWrapper:", error);
    errorCountRef.current += 1;

    // If too many errors, stop trying to render
    if (errorCountRef.current > 3) {
      setHasError(true);
    } else {
      // Reset the component after an error
      setShouldRender(false);
      setTimeout(() => setShouldRender(true), 100);
    }
  };

  if (hasError) {
    return (
      <div className="p-4 border border-red-300 bg-red-50 rounded-md">
        <h3 className="text-red-600 font-medium">Something went wrong</h3>
        <p className="text-sm text-red-600">
          The chat component encountered an error and couldn't be loaded.
        </p>
        <button
          className="mt-2 px-3 py-1 bg-red-100 text-red-800 rounded-md text-sm"
          onClick={() => {
            errorCountRef.current = 0;
            setHasError(false);
            setShouldRender(true);
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  // Only render the chat component when it's safe to do so
  return shouldRender ? (
    <ErrorCatcher onError={handleError}>
      <RhymeAIChatWrapper {...propsRef.current} />
    </ErrorCatcher>
  ) : (
    <div className="p-4 border rounded-md animate-pulse">
      <div className="h-6 w-48 bg-gray-200 rounded mb-4"></div>
      <div className="h-4 w-full bg-gray-200 rounded mb-2"></div>
      <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
    </div>
  );
}

// Simple error boundary component - make sure React is imported above!
class ErrorCatcher extends React.Component<{
  children: React.ReactNode;
  onError: (error: Error) => void;
}> {
  componentDidCatch(error: Error) {
    this.props.onError(error);
  }

  render() {
    return this.props.children;
  }
}

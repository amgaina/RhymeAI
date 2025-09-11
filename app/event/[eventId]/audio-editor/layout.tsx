"use client";

import { AudioReduxProvider } from "@/components/providers/AudioPlaybackProvider";

export default function AudioEditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AudioReduxProvider>{children}</AudioReduxProvider>;
}

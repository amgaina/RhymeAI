"use client";

import Link from "next/link";
import { Beaker } from "lucide-react";

export default function PlaygroundLink() {
  return (
    <Link
      href="/playground"
      className="hover:text-accent transition-colors font-medium tracking-wide hover:underline underline-offset-4 flex items-center gap-1"
    >
      <Beaker className="h-4 w-4" />
      Playground
    </Link>
  );
}

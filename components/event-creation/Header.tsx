import { Button } from "@/components/ui/button";
import { Mic2, Settings } from "lucide-react";

export default function Header() {
  return (
    <header className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Mic2 className="h-6 w-6 text-terracotta" />
          <span className="text-xl font-bold">RhymeAI</span>
        </div>
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            className="text-primary-foreground hover:text-accent flex items-center gap-2"
          >
            <Settings className="h-5 w-5" />
            <span>Settings</span>
          </Button>
          <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-white font-bold">
            JD
          </div>
        </div>
      </div>
    </header>
  );
}

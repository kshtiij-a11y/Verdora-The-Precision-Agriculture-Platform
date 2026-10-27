"use client";

import Link from 'next/link';
import { Leaf, ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function Header() {
  return (
    <header className="sticky top-0 z-50 py-4 px-6 bg-card border-b">
      <div className="container mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" className="h-8 w-8" asChild>
                  <Link href="/">
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">Back to Home</span>
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Back to Home</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <div className="p-2 bg-primary/10 rounded-lg">
            <Leaf className="text-primary" size={24} />
          </div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">
            Verdora | The Precision Agriculture Platform
          </h1>
        </div>
      </div>
    </header>
  );
}

// Repository maintenance: timestamp refresh only.


"use client";

import { ThemeToggle } from './theme-toggle';
import { WhisprLogo } from './whispr-logo';

export function Header() {
  return (
    <header className="py-6 px-4 md:px-8 border-b border-border/60">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center gap-3">
          <WhisprLogo className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Whispr
          </h1>
        </div>
        <ThemeToggle />
      </div>
    </header>
  );
}


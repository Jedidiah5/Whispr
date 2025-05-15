
"use client";

import { ThemeToggle } from './theme-toggle';
import Image from 'next/image';

export function Header() {
  return (
    <header className="py-6 px-4 md:px-8 border-b border-border/60">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Image
            src="https://placehold.co/32x32.png"
            alt="Whispr Logo"
            width={32}
            height={32}
            className="text-primary"
            data-ai-hint="logo"
          />
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Whispr
          </h1>
        </div>
        <ThemeToggle />
      </div>
    </header>
  );
}

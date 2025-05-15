
"use client";

import { ThemeToggle } from './theme-toggle';
import Image from 'next/image';
import whisprIconPNG from '../app/whispr-icon.png';

export function Header() {
  return (
    <header className="py-6 px-4 md:px-8 border-b border-border/60">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Image
            src={whisprIconPNG}
            alt="Whispr Logo"
            width={32}
            height={32}
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

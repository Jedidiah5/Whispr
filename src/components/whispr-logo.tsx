
import type React from 'react';
import { cn } from '@/lib/utils';

interface WhisprLogoProps extends React.SVGProps<SVGSVGElement> {}

export function WhisprLogo({ className, ...props }: WhisprLogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      className={cn("fill-current", className)}
      {...props}
    >
      <g transform="translate(50, 50) scale(0.9)">
        {/* Microphone Body */}
        <rect x="-15" y="-30" width="30" height="50" rx="10" ry="10" className="text-primary" />
        {/* Microphone Grill */}
        <rect x="-12" y="-28" width="24" height="30" rx="5" ry="5" fillOpacity="0.7" className="text-primary-foreground"/>
        <line x1="-10" y1="-25" x2="10" y2="-25" strokeWidth="2" className="stroke-primary" />
        <line x1="-10" y1="-20" x2="10" y2="-20" strokeWidth="2" className="stroke-primary" />
        <line x1="-10" y1="-15" x2="10" y2="-15" strokeWidth="2" className="stroke-primary" />
        <line x1="-10" y1="-10" x2="10" y2="-10" strokeWidth="2" className="stroke-primary" />
         <line x1="-10" y1="-5" x2="10" y2="-5" strokeWidth="2" className="stroke-primary" />


        {/* Microphone Stand */}
        <rect x="-5" y="20" width="10" height="15" className="text-primary" />
        <circle cx="0" cy="35" r="10" className="text-primary" />

        {/* Swoosh */}
        <path
          d="M -40,0 A 40,25 0 0,1 40,20"
          fill="none"
          strokeWidth="8"
          className="stroke-accent"
          strokeLinecap="round"
        />
         <path
          d="M -45,5 A 45,30 0 0,1 35,25"
          fill="none"
          strokeWidth="3"
          className="stroke-primary-foreground"
          strokeLinecap="round"
          strokeDasharray="5 3"
        />
      </g>
    </svg>
  );
}

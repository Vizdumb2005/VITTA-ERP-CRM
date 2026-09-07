"use client";

import type { ReactElement } from "react";
import { cn } from "@/lib/utils";

// Hand-crafted VITTA app icons (Odoo 17 style):
// white rounded card + 2-3 overlapping abstract shapes per app.
// Palette: plum #7C2D5E, mauve #9A5B8F, brand #714B67, teal #00A88D,
// sky #31A3DD, navy #23536B, orange #F8931D, gold #FBB04E, red #D9534F.

const C = {
  plum: "#7C2D5E",
  mauve: "#9A5B8F",
  brand: "#714B67",
  teal: "#00A88D",
  sky: "#31A3DD",
  navy: "#23536B",
  orange: "#F8931D",
  gold: "#FBB04E",
  red: "#D9534F",
  green: "#2E7D6B",
} as const;

const ICONS: Record<string, ReactElement> = {
  // Gold coin + plum diagonal bar + small teal coin
  accounting: (
    <g>
      <circle cx="19" cy="19" r="10" fill={C.gold} opacity="0.9" />
      <circle cx="33" cy="15" r="5.5" fill={C.teal} opacity="0.95" />
      <rect
        x="17.5"
        y="26.75"
        width="18"
        height="6.5"
        rx="3.25"
        fill={C.plum}
        opacity="0.95"
        transform="rotate(-45 26.5 30)"
      />
    </g>
  ),
  // Plum rounded square + teal bookmark
  knowledge: (
    <g>
      <rect x="10" y="12" width="20" height="20" rx="6" fill={C.plum} opacity="0.92" />
      <path
        d="M24 17h12.5a2.5 2.5 0 0 1 2.5 2.5V36l-8.75-6-8.75 6V19.5A2.5 2.5 0 0 1 24 17Z"
        fill={C.teal}
      />
    </g>
  ),
  // Navy signature squiggle + sky underline swoosh (stroke style)
  sign: (
    <g fill="none" strokeLinecap="round">
      <path d="M19 34.5C24.5 37 31.5 36.5 37.5 33.5" stroke={C.sky} strokeWidth="3.2" />
      <path
        d="M10.5 31.5C13.5 21.5 16.5 16.5 19 16.5C21.5 16.5 20.5 27 23.5 27C26.5 27 27.5 18.5 30.5 18.5C33 18.5 32.5 24.5 35 24.5C36.7 24.5 37.8 22.8 38.5 21"
        stroke={C.navy}
        strokeWidth="3.5"
      />
    </g>
  ),
  // Funnel: wide plum trapezoid + narrow teal stem, overlapping
  crm: (
    <g>
      <path d="M12 14h24l-8.5 11.5h-7Z" fill={C.plum} opacity="0.92" />
      <path d="M21 24.5h6l-1.6 9.5h-2.8Z" fill={C.teal} />
    </g>
  ),
  // Crossed tools: teal screwdriver + plum ring-head wrench
  studio: (
    <g>
      <rect x="17" y="22.2" width="14" height="3.6" rx="1.8" fill={C.teal} transform="rotate(45 24 24)" />
      <rect x="27.5" y="29.4" width="5" height="2.2" rx="0.9" fill={C.teal} transform="rotate(45 30 30.5)" />
      <rect x="14.75" y="14.5" width="6.5" height="7" rx="2.5" fill={C.teal} transform="rotate(45 18 18)" />
      <rect x="14.5" y="22" width="17" height="4" rx="2" fill={C.plum} transform="rotate(-45 23 24)" />
      <circle cx="30.5" cy="16.5" r="5" fill={C.plum} />
      <circle cx="30.5" cy="16.5" r="2.3" fill="#fff" />
      <rect x="32.4" y="11.1" width="4" height="3" rx="1" fill="#fff" transform="rotate(-45 34.4 12.6)" />
    </g>
  ),
  // Circular refresh arrows: orange top arc + teal bottom arc with heads
  subscriptions: (
    <g fill="none" strokeLinecap="round">
      <path d="M13.91 21.1A10.5 10.5 0 0 1 33 18.6" stroke={C.orange} strokeWidth="4" />
      <polygon points="-4.2,0 2.8,3.4 2.8,-3.4" fill={C.orange} stroke="none" transform="translate(33.5 19.2) rotate(59)" />
      <path d="M34.09 26.9A10.5 10.5 0 0 1 15 29.4" stroke={C.teal} strokeWidth="4" />
      <polygon points="-4.2,0 2.8,3.4 2.8,-3.4" fill={C.teal} stroke="none" transform="translate(14.5 28.8) rotate(-121)" />
    </g>
  ),
  // Plum letter A (notched triangle) + orange letter I bar
  ai: (
    <g>
      <path d="M23 13 33 34.5H26.8L24.9 28H21.1L19.2 34.5H13Z" fill={C.plum} opacity="0.95" />
      <rect x="35.2" y="13" width="3.8" height="21.5" rx="1.9" fill={C.orange} />
    </g>
  ),
  // Shop: striped plum/orange scalloped awning + teal storefront
  pos: (
    <g>
      <rect x="13" y="24.5" width="22" height="10" rx="2" fill={C.teal} opacity="0.95" />
      <rect x="21" y="27.5" width="6" height="7" rx="1" fill="#fff" />
      <rect x="10" y="12" width="28" height="9" fill={C.plum} />
      <rect x="17" y="12" width="7" height="9" fill={C.orange} />
      <rect x="31" y="12" width="7" height="9" fill={C.orange} />
      <circle cx="13.5" cy="21" r="3.5" fill={C.plum} />
      <circle cx="20.5" cy="21" r="3.5" fill={C.orange} />
      <circle cx="27.5" cy="21" r="3.5" fill={C.plum} />
      <circle cx="34.5" cy="21" r="3.5" fill={C.orange} />
    </g>
  ),
  // Orange chat bubble with dots + small plum bubble in front
  discuss: (
    <g>
      <polygon points="13,26.5 21,26.5 13,33.5" fill={C.orange} />
      <rect x="10" y="13" width="27" height="15" rx="5" fill={C.orange} />
      <circle cx="16.5" cy="20.5" r="1.7" fill="#fff" />
      <circle cx="21" cy="20.5" r="1.7" fill="#fff" />
      <circle cx="25.5" cy="20.5" r="1.7" fill="#fff" />
      <polygon points="29,31 35,31 29,36" fill={C.plum} opacity="0.95" />
      <rect x="26" y="22" width="12" height="10" rx="4" fill={C.plum} opacity="0.95" />
    </g>
  ),
  // Tilted orange sheet behind + sky sheet with white text lines
  documents: (
    <g>
      <rect
        x="17"
        y="11"
        width="17"
        height="21"
        rx="2.5"
        fill={C.orange}
        opacity="0.9"
        transform="rotate(8 25.5 21.5)"
      />
      <rect x="13" y="14" width="17" height="21" rx="2.5" fill={C.sky} />
      <rect x="17" y="19.5" width="9" height="2" rx="1" fill="#fff" />
      <rect x="17" y="24" width="6.5" height="2" rx="1" fill="#fff" />
    </g>
  ),
  // Two overlapping checkmarks: teal behind, plum in front
  project: (
    <g>
      <rect x="12.5" y="24" width="12" height="5" rx="2.5" fill={C.teal} opacity="0.9" transform="rotate(45 18.5 26.5)" />
      <rect x="21.5" y="23" width="17" height="5" rx="2.5" fill={C.teal} opacity="0.9" transform="rotate(-45 30 25.5)" />
      <rect x="10" y="21" width="12" height="5" rx="2.5" fill={C.plum} transform="rotate(45 16 23.5)" />
      <rect x="19" y="20" width="17" height="5" rx="2.5" fill={C.plum} transform="rotate(-45 27.5 22.5)" />
    </g>
  ),
  // Stopwatch: sky case + white face + orange hand
  timesheets: (
    <g>
      <rect x="21.7" y="11" width="4.6" height="4.5" rx="1.5" fill={C.sky} />
      <rect x="30.25" y="15.2" width="5.5" height="3.6" rx="1.6" fill={C.sky} transform="rotate(-48 33 17)" />
      <circle cx="24" cy="27" r="12" fill={C.sky} />
      <circle cx="24" cy="27" r="8.5" fill="#fff" />
      <rect x="25.4" y="19.5" width="3.2" height="8" rx="1.6" fill={C.orange} transform="rotate(-45 27 23.5)" />
      <circle cx="24" cy="27" r="2.3" fill={C.orange} />
    </g>
  ),
  // Gold lightning bolt behind plum lightning bolt
  fieldservice: (
    <g>
      <path d="M25.5 10 13.5 26.5H22L19 38 34.5 20.5H26L29.5 10Z" fill={C.gold} opacity="0.9" transform="translate(4 0.5)" />
      <path d="M25.5 10 13.5 26.5H22L19 38 34.5 20.5H26L29.5 10Z" fill={C.plum} />
    </g>
  ),
  // Orange calendar card with white rings, teal squares + play triangle
  planning: (
    <g>
      <rect x="10" y="13" width="22" height="20" rx="3" fill={C.orange} />
      <rect x="15" y="10.5" width="2.6" height="5" rx="1.3" fill="#fff" />
      <rect x="24.4" y="10.5" width="2.6" height="5" rx="1.3" fill="#fff" />
      <rect x="14.5" y="18.5" width="5" height="5" rx="1.2" fill={C.teal} />
      <rect x="21.5" y="18.5" width="5" height="5" rx="1.2" fill={C.teal} />
      <polygon points="27,25.5 33.5,29 27,32.5" fill={C.teal} />
    </g>
  ),
  // Medical cross: green cross offset behind teal cross
  helpdesk: (
    <g>
      <rect x="23" y="15" width="8" height="24" rx="3" fill={C.green} opacity="0.9" />
      <rect x="15" y="23" width="24" height="8" rx="3" fill={C.green} opacity="0.9" />
      <rect x="20" y="12" width="8" height="24" rx="3" fill={C.teal} />
      <rect x="12" y="20" width="24" height="8" rx="3" fill={C.teal} />
    </g>
  ),
  // Plum shopping bag with arched handle + gold tag dot
  ecommerce: (
    <g>
      <path d="M17 17A7 7 0 0 1 31 17H26.5A2.5 2.5 0 0 0 21.5 17Z" fill={C.plum} opacity="0.95" />
      <rect x="13" y="17" width="22" height="18" rx="3" fill={C.plum} />
      <circle cx="30.5" cy="24.5" r="2.6" fill={C.gold} />
    </g>
  ),
  // Sky orbit arc behind teal globe with white latitude band
  website: (
    <g>
      <path d="M11 24A13 13 0 0 1 37 24H33.6A9.6 9.6 0 0 0 14.4 24Z" fill={C.sky} opacity="0.95" />
      <circle cx="24" cy="24" r="10.8" fill={C.teal} />
      <path d="M14.5 24A9.5 9.5 0 0 0 33.5 24H30.3A6.3 6.3 0 0 1 17.7 24Z" fill="#fff" opacity="0.85" />
    </g>
  ),
  // Sky paper plane + plum folded wing
  email: (
    <g>
      <path d="M38 13.5 10.5 21.5 19.5 25.5 23.5 37Z" fill={C.sky} opacity="0.95" />
      <path d="M10.5 21.5 19.5 25.5 14.5 16Z" fill={C.plum} opacity="0.92" />
    </g>
  ),
  // Teal coin behind plum credit card with white stripe + gold chip
  purchase: (
    <g>
      <circle cx="32" cy="17.5" r="6.5" fill={C.teal} opacity="0.95" />
      <circle cx="32" cy="17.5" r="3" fill="#fff" />
      <rect x="10" y="20" width="24" height="15" rx="3" fill={C.plum} />
      <rect x="10" y="24.5" width="24" height="3.4" fill="#fff" />
      <rect x="13.5" y="30.5" width="5" height="3" rx="1" fill={C.gold} />
    </g>
  ),
  // 3D box: plum top + plum left face + orange right face
  inventory: (
    <g>
      <polygon points="24,12 33.5,17.5 24,23 14.5,17.5" fill={C.plum} opacity="0.8" />
      <polygon points="14.5,17.5 24,23 24,35.5 14.5,30" fill={C.plum} />
      <polygon points="24,23 33.5,17.5 33.5,30 24,35.5" fill={C.orange} opacity="0.95" />
    </g>
  ),
  // Toothed teal gear block + orange square + smaller teal block
  manufacturing: (
    <g>
      <rect x="18" y="9.5" width="3" height="3" rx="0.8" fill={C.teal} />
      <rect x="9.5" y="17.5" width="3" height="3" rx="0.8" fill={C.teal} />
      <rect x="27.5" y="17.5" width="3" height="3" rx="0.8" fill={C.teal} />
      <rect x="18" y="27.5" width="3" height="3" rx="0.8" fill={C.teal} />
      <rect x="12.5" y="12" width="15" height="15" rx="3.5" fill={C.teal} />
      <rect x="17" y="16.5" width="6" height="6" rx="1.5" fill="#fff" />
      <rect x="32.5" y="12" width="6" height="6" rx="1.5" fill={C.orange} />
      <rect x="25" y="25" width="11" height="11" rx="3" fill={C.teal} opacity="0.9" />
      <rect x="28.5" y="28.5" width="4" height="4" rx="1" fill="#fff" />
    </g>
  ),
  // Ascending bar chart: three plum bars + gold leader
  sales: (
    <g>
      <path d="M10.5 37v-8.6a2.4 2.4 0 0 1 2.4-2.4h.7a2.4 2.4 0 0 1 2.4 2.4V37Z" fill={C.plum} opacity="0.8" />
      <path d="M18 37v-13.6a2.4 2.4 0 0 1 2.4-2.4h.7a2.4 2.4 0 0 1 2.4 2.4V37Z" fill={C.plum} opacity="0.9" />
      <path d="M25.5 37v-18.6a2.4 2.4 0 0 1 2.4-2.4h.7a2.4 2.4 0 0 1 2.4 2.4V37Z" fill={C.plum} />
      <path d="M33 37V12.4a2.4 2.4 0 0 1 2.4-2.4h.7a2.4 2.4 0 0 1 2.4 2.4V37Z" fill={C.gold} />
    </g>
  ),
  // Two people: teal pair behind orange person in front
  hr: (
    <g>
      <circle cx="30" cy="18.5" r="5.2" fill={C.teal} opacity="0.85" />
      <path d="M22.5 33.5a7.5 7.5 0 0 1 15 0Z" fill={C.teal} opacity="0.85" />
      <circle cx="19" cy="19.5" r="5.5" fill={C.orange} />
      <path d="M10.5 36a8.5 8.5 0 0 1 17 0Z" fill={C.orange} />
    </g>
  ),
  // 2x2 KPI tiles: plum / red / sky / teal
  dashboard: (
    <g>
      <rect x="11" y="11" width="12" height="12" rx="3.5" fill={C.plum} opacity="0.95" />
      <rect x="25" y="11" width="12" height="12" rx="3.5" fill={C.red} opacity="0.95" />
      <rect x="11" y="25" width="12" height="12" rx="3.5" fill={C.sky} opacity="0.95" />
      <rect x="25" y="25" width="12" height="12" rx="3.5" fill={C.teal} opacity="0.95" />
    </g>
  ),
};

// Generic fallback for unknown ids: soft 3x3 dot grid.
const FALLBACK = (
  <g fill={C.mauve} opacity="0.9">
    <circle cx="16.5" cy="16.5" r="2.6" />
    <circle cx="24" cy="16.5" r="2.6" />
    <circle cx="31.5" cy="16.5" r="2.6" />
    <circle cx="16.5" cy="24" r="2.6" />
    <circle cx="24" cy="24" r="2.6" fill={C.teal} />
    <circle cx="31.5" cy="24" r="2.6" />
    <circle cx="16.5" cy="31.5" r="2.6" />
    <circle cx="24" cy="31.5" r="2.6" />
    <circle cx="31.5" cy="31.5" r="2.6" />
  </g>
);

export function AppIcon({ id, className }: { id: string; className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={cn("h-full w-full", className)} aria-hidden="true">
      <rect x="3" y="3" width="42" height="42" rx="10" fill="#fff" />
      {ICONS[id] ?? FALLBACK}
    </svg>
  );
}

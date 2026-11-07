import {
  BookOpen, Briefcase, Building2, CalendarCheck, Car, ClipboardCheck, FileCheck, FileSearch, FileText, Globe, GraduationCap, Home,
  Hotel, Languages, Map, Plane, PlaneLanding, ScanLine, Search, ShieldCheck, Smartphone, Stamp, Users, Wifi, type LucideIcon,
} from "lucide-react";
import type { ComponentProps } from "react";

const ICONS: Record<string, LucideIcon> = {
  "book-open": BookOpen, briefcase: Briefcase, building: Building2, calendar: CalendarCheck, car: Car, clipboard: ClipboardCheck,
  "file-check": FileCheck, "file-search": FileSearch, "file-text": FileText, globe: Globe, graduation: GraduationCap, home: Home,
  hotel: Hotel, languages: Languages, map: Map, plane: Plane, "plane-landing": PlaneLanding, scan: ScanLine, search: Search,
  shield: ShieldCheck, smartphone: Smartphone, stamp: Stamp, users: Users, wifi: Wifi,
};

export const ICON_NAMES = Object.keys(ICONS);

export function DynamicIcon({ name, ...props }: { name: string } & ComponentProps<"svg">) {
  const Icon = ICONS[name] || FileText;
  return <Icon {...props} />;
}

export function WhatsAppIcon(props: ComponentProps<"svg">) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.64-2.05-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.5h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.21 3.08.15.2 2.1 3.2 5.08 4.48.71.31 1.26.49 1.7.63.71.22 1.36.19 1.87.12.57-.09 1.75-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35zM12.05 21.8h-.01a9.8 9.8 0 0 1-5-1.37l-.36-.21-3.72.98 1-3.63-.24-.37a9.8 9.8 0 0 1-1.5-5.22c0-5.42 4.42-9.84 9.85-9.84a9.8 9.8 0 0 1 9.83 9.85c0 5.43-4.42 9.84-9.85 9.84zm8.38-18.22A11.77 11.77 0 0 0 12.05.1C5.5.1.17 5.43.17 11.98c0 2.1.55 4.14 1.59 5.94L.07 24l6.23-1.63a11.86 11.86 0 0 0 5.75 1.46h.01c6.55 0 11.88-5.33 11.88-11.88 0-3.17-1.24-6.16-3.5-8.4z" />
    </svg>
  );
}

export function SocialIcon({ network, ...props }: { network: string } & ComponentProps<"svg">) {
  const paths: Record<string, string> = {
    facebook: "M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12z",
    instagram: "M12 2.2c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.21 15.58 2.2 15.2 2.2 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.21 8.8 2.2 12 2.2zm0 4.86a4.94 4.94 0 1 0 0 9.88 4.94 4.94 0 0 0 0-9.88zm0 8.15a3.2 3.2 0 1 1 0-6.42 3.2 3.2 0 0 1 0 6.42zm5.14-9.5a1.15 1.15 0 1 0 0 2.3 1.15 1.15 0 0 0 0-2.3z",
    tiktok: "M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5 2.6 2.6 0 0 1-2.59-2.6 2.6 2.6 0 0 1 3.38-2.48V9.66a5.68 5.68 0 0 0-6.47 5.64 5.69 5.69 0 0 0 5.68 5.7 5.69 5.69 0 0 0 5.68-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3s-1.88.09-3.24-1.48z",
    linkedin: "M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z",
    youtube: "M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31.4 31.4 0 0 0 0 12a31.4 31.4 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31.4 31.4 0 0 0 24 12a31.4 31.4 0 0 0-.5-5.8zM9.6 15.6V8.4l6.3 3.6-6.3 3.6z",
  };
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d={paths[network] || ""} />
    </svg>
  );
}

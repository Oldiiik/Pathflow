import {
  MessageSquareText,
  GraduationCap,
  Compass,
  Radar,
  CalendarClock,
  FolderSearch,
  Route,
  GitCompare,
  BookOpen,
  FlaskConical,
  type LucideIcon,
} from "lucide-react";
import type { ObjectKind } from "./types";

export interface KindMeta {
  label: string;
  plural: string;
  path: string;
  icon: LucideIcon;
}

// Single source of truth mapping a generated object kind to its destination page.
export const KIND_META: Record<ObjectKind, KindMeta> = {
  university: { label: "University Match", plural: "Universities", path: "/universities", icon: GraduationCap },
  majorFit: { label: "Major Fit", plural: "Majors", path: "/majors", icon: Compass },
  gapRadar: { label: "Gap Radar", plural: "Gaps", path: "/gaps", icon: Radar },
  opportunity: { label: "Opportunity", plural: "Opportunities", path: "/opportunities", icon: CalendarClock },
  portfolio: { label: "Portfolio", plural: "Portfolio", path: "/portfolio", icon: FolderSearch },
};

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  kind?: ObjectKind;
  section: "Workspace" | "Tools";
}

// Primary sidebar navigation, in display order, grouped by section.
export const NAV_ITEMS: NavItem[] = [
  { label: "Command", path: "/", icon: MessageSquareText, section: "Workspace" },
  { label: "Universities", path: "/universities", icon: GraduationCap, kind: "university", section: "Workspace" },
  { label: "Majors", path: "/majors", icon: Compass, kind: "majorFit", section: "Workspace" },
  { label: "Gap Radar", path: "/gaps", icon: Radar, kind: "gapRadar", section: "Workspace" },
  { label: "Opportunities", path: "/opportunities", icon: CalendarClock, kind: "opportunity", section: "Workspace" },
  { label: "Portfolio", path: "/portfolio", icon: FolderSearch, kind: "portfolio", section: "Workspace" },
  { label: "Compare", path: "/compare", icon: GitCompare, section: "Tools" },
  { label: "Courses", path: "/courses", icon: BookOpen, section: "Tools" },
  { label: "Project review", path: "/review", icon: FlaskConical, section: "Tools" },
  { label: "Roadmap", path: "/roadmap", icon: Route, section: "Tools" },
];

export const NAV_SECTIONS: ("Workspace" | "Tools")[] = ["Workspace", "Tools"];

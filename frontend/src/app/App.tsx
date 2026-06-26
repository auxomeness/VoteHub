import { useState, useEffect, useRef } from "react";
import { motion, useInView } from "motion/react";
import {
  LayoutDashboard, Vote, BarChart3, UserCircle, Bell, LogOut, X,
  Shield, Building2, Users2, Clock, Eye, ChevronRight, Check,
  Search, Plus, Edit2, Archive, TrendingUp, FileText, Calendar,
  ArrowRight, CheckCircle2, AlertCircle, ChevronDown, ChevronLeft,
  Trash2, KeyRound, ShieldCheck, Download, RefreshCw, Activity,
  Zap, BarChart2, PieChart as PieChartIcon
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie,
  Cell, Legend
} from "recharts";
import horizontalLockupUrl from "../../images/horizontal-lockup.png";
import whiteMainIconUrl from "../../images/white-main-icon.png";
import whiteVerticalLockupUrl from "../../images/white-vertical-lockup.png";

// ─── TYPES ────────────────────────────────────────────────────────────────────

type View =
  | "landing" | "login" | "admin-login" | "register"
  | "student-dashboard" | "voting" | "results" | "profile" | "notifications" | "elections-list"
  | "admin-dashboard" | "admin-users" | "admin-elections" | "admin-organizations"
  | "election-create" | "analytics";

type Role = "student" | "admin" | null;
interface AppUser {
  name: string; studentNumber: string; email: string;
  college: string; program: string; organization: string; role: Role;
  status: "active" | "pending" | "suspended";
}
interface MockUser {
  id: number; studentNumber: string; name: string; email: string;
  college: string; org: string; status: string;
}

// ─── MOCK DATA ────────────────────────────────────────────────────────────────

const COLLEGES = ["CBA", "CCS", "CED", "CHSS", "CSEA", "CON", "COL"];
const PROGRAMS = [
  "Bachelor of Science in Computer Science",
  "Bachelor of Science in Information Technology",
  "Bachelor of Science in Information Systems",
  "Bachelor of Science in Accountancy",
  "Bachelor of Science in Business Administration",
  "Bachelor of Science in Nursing",
  "Bachelor of Elementary Education",
  "Bachelor of Secondary Education",
  "Bachelor of Arts in Communication",
  "Bachelor of Laws",
];
const ORGS = ["CSS", "JPCS", "PIXEL", "ThePILLARS", "Remontados Debate Society", "LEAP", "GABAY", "TACTICS"];

const mockStudent: AppUser = {
  name: "Maria Santos", studentNumber: "2021-00456",
  email: "maria.santos@gbox.adnu.edu.ph", college: "CCS",
  program: "Bachelor of Science in Computer Science",
  organization: "JPCS", role: "student", status: "active",
};
const mockAdmin: AppUser = {
  name: "Dr. Jose Reyes", studentNumber: "ADMIN-001",
  email: "jreyes@adnu.edu.ph", college: "CCS",
  program: "",
  organization: "", role: "admin", status: "active",
};

const elections = [
  {
    id: 1, title: "Ateneo Student Government Elections 2025",
    description: "Annual university-wide student government election for academic year 2025–2026.",
    type: "University-Wide", status: "active" as const,
    openDate: "Jun 25, 2025", closeDate: "Jun 27, 2025",
    eligibility: "All Students", visibility: "Live Results",
    votescast: 1847, totalVoters: 4200,
  },
  {
    id: 2, title: "CCS Student Council Elections",
    description: "College of Computer Studies student council for AY 2025–2026.",
    type: "College", status: "active" as const,
    openDate: "Jun 25, 2025", closeDate: "Jun 28, 2025",
    eligibility: "CCS Students", visibility: "Scheduled Release",
    votescast: 312, totalVoters: 680,
  },
  {
    id: 3, title: "JPCS Officers Election 2025",
    description: "Junior Philippine Computer Society chapter officer elections.",
    type: "Organization", status: "upcoming" as const,
    openDate: "Jul 5, 2025", closeDate: "Jul 6, 2025",
    eligibility: "JPCS Members", visibility: "Live Results",
    votescast: 0, totalVoters: 145,
  },
  {
    id: 4, title: "CBA Student Council Elections",
    description: "College of Business Administration council elections.",
    type: "College", status: "closed" as const,
    openDate: "Jun 10, 2025", closeDate: "Jun 12, 2025",
    eligibility: "CBA Students", visibility: "Hidden Results",
    votescast: 498, totalVoters: 710,
  },
];

const positions = [
  {
    id: 1, title: "President",
    candidates: [
      { id: 1, name: "Carlo Dela Cruz", college: "CCS", org: "CSS", platform: "Digital transformation of student services and transparent, accountable governance for all Ateneans." },
      { id: 2, name: "Angela Ramos", college: "CBA", org: "GABAY", platform: "Inclusive campus initiatives, stronger academic support systems, and a unified student voice." },
    ],
  },
  {
    id: 2, title: "Vice President",
    candidates: [
      { id: 3, name: "Luis Bautista", college: "CHSS", org: "", platform: "Strengthening student welfare programs, mental health advocacy, and campus accessibility." },
      { id: 4, name: "Hana Villanueva", college: "CON", org: "LEAP", platform: "Community outreach, university-barangay partnership programs, and volunteer empowerment." },
      { id: 5, name: "Marco Fernandez", college: "CCS", org: "JPCS", platform: "Technology-driven campus solutions, student entrepreneurship, and digital skills access." },
    ],
  },
  {
    id: 3, title: "Secretary",
    candidates: [
      { id: 6, name: "Sofia Garcia", college: "CED", org: "", platform: "Streamlined communication, accessible records management, and open-access documentation." },
      { id: 7, name: "Renz Aquino", college: "CCS", org: "PIXEL", platform: "Digital documentation systems, creative communication, and transparency in governance." },
    ],
  },
  {
    id: 4, title: "CCS Representative", college: "CCS",
    candidates: [
      { id: 8, name: "Trisha Mendoza", college: "CCS", org: "JPCS", platform: "Advocating for tech resources, coding bootcamp opportunities, and CCS student welfare." },
      { id: 9, name: "Jan Ocampo", college: "CCS", org: "CSS", platform: "Expanded internship programs, industry partnerships, and skills development initiatives." },
    ],
  },
];

// ─── ANALYTICS DATA ───────────────────────────────────────────────────────────

const analyticsCollegeData = [
  { college: "CCS", fullName: "College of Computer Studies", votes: 1250, eligible: 1480, rate: 84.5, color: "#2563EB" },
  { college: "CBA", fullName: "College of Business and Accountancy", votes: 600, eligible: 890, rate: 67.4, color: "#7C3AED" },
  { college: "CHSS", fullName: "College of Humanities & Social Sciences", votes: 450, eligible: 520, rate: 86.5, color: "#059669" },
  { college: "CON", fullName: "College of Nursing", votes: 350, eligible: 420, rate: 83.3, color: "#D97706" },
  { college: "CSEA", fullName: "College of Science, Engineering & Architecture", votes: 200, eligible: 280, rate: 71.4, color: "#DC2626" },
  { college: "CED", fullName: "College of Education", votes: 100, eligible: 160, rate: 62.5, color: "#0891B2" },
  { college: "COL", fullName: "College of Law", votes: 50, eligible: 100, rate: 50.0, color: "#64748B" },
];

const analyticsYearData = [
  { year: "1st Year", votes: 680, eligible: 773, rate: 88, color: "#2563EB" },
  { year: "2nd Year", votes: 615, eligible: 750, rate: 82, color: "#7C3AED" },
  { year: "3rd Year", votes: 550, eligible: 696, rate: 79, color: "#059669" },
  { year: "4th Year", votes: 480, eligible: 658, rate: 73, color: "#D97706" },
  { year: "5th Year", votes: 68, eligible: 100, rate: 68, color: "#DC2626" },
  { year: "Graduate", votes: 54, eligible: 59, rate: 91, color: "#0891B2" },
];

const analyticsOrgData = [
  { org: "JPCS", members: 312, votes: 291, rate: 93.3 },
  { org: "CSS", members: 145, votes: 131, rate: 90.3 },
  { org: "PIXEL", members: 87, votes: 74, rate: 85.1 },
  { org: "LEAP", members: 98, votes: 81, rate: 82.7 },
  { org: "GABAY", members: 76, votes: 61, rate: 80.3 },
  { org: "ThePILLARS", members: 64, votes: 49, rate: 76.6 },
  { org: "TACTICS", members: 54, votes: 40, rate: 74.1 },
  { org: "Remontados", members: 43, votes: 29, rate: 67.4 },
];

const hourlyVotingData = [
  { time: "8 AM", votes: 120, cumulative: 120 },
  { time: "9 AM", votes: 285, cumulative: 405 },
  { time: "10 AM", votes: 342, cumulative: 747 },
  { time: "11 AM", votes: 398, cumulative: 1145 },
  { time: "12 PM", votes: 521, cumulative: 1666 },
  { time: "1 PM", votes: 487, cumulative: 2153 },
  { time: "2 PM", votes: 412, cumulative: 2565 },
  { time: "3 PM", votes: 287, cumulative: 2852 },
  { time: "4 PM", votes: 198, cumulative: 3050 },
  { time: "5 PM", votes: 143, cumulative: 3193 },
  { time: "6 PM", votes: 98, cumulative: 3291 },
  { time: "7 PM", votes: 32, cumulative: 3323 },
];

const positionAnalyticsData: Record<string, Array<{ name: string; votes: number; percentage: number; rank: number; color: string; byCollege: Array<{ college: string; support: number }>; byYear: Array<{ year: string; pct: number }> }>> = {
  "President": [
    {
      name: "Carlo Dela Cruz", votes: 892, percentage: 44.6, rank: 2, color: "#2563EB",
      byCollege: [{ college: "CCS", support: 48 }, { college: "CBA", support: 12 }, { college: "CHSS", support: 28 }, { college: "CON", support: 17 }, { college: "CSEA", support: 13 }, { college: "CED", support: 8 }, { college: "COL", support: 8 }],
      byYear: [{ year: "1st", pct: 55 }, { year: "2nd", pct: 49 }, { year: "3rd", pct: 46 }, { year: "4th", pct: 43 }],
    },
    {
      name: "Angela Ramos", votes: 955, percentage: 47.8, rank: 1, color: "#0A2540",
      byCollege: [{ college: "CCS", support: 52 }, { college: "CBA", support: 88 }, { college: "CHSS", support: 72 }, { college: "CON", support: 83 }, { college: "CSEA", support: 88 }, { college: "CED", support: 92 }, { college: "COL", support: 92 }],
      byYear: [{ year: "1st", pct: 33 }, { year: "2nd", pct: 33 }, { year: "3rd", pct: 33 }, { year: "4th", pct: 30 }],
    },
  ],
  "Vice President": [
    {
      name: "Luis Bautista", votes: 623, percentage: 31.2, rank: 2, color: "#2563EB",
      byCollege: [{ college: "CCS", support: 35 }, { college: "CBA", support: 28 }, { college: "CHSS", support: 52 }, { college: "CON", support: 40 }, { college: "CSEA", support: 30 }, { college: "CED", support: 25 }, { college: "COL", support: 22 }],
      byYear: [{ year: "1st", pct: 38 }, { year: "2nd", pct: 33 }, { year: "3rd", pct: 29 }, { year: "4th", pct: 25 }],
    },
    {
      name: "Hana Villanueva", votes: 712, percentage: 35.6, rank: 1, color: "#0A2540",
      byCollege: [{ college: "CCS", support: 28 }, { college: "CBA", support: 42 }, { college: "CHSS", support: 38 }, { college: "CON", support: 55 }, { college: "CSEA", support: 48 }, { college: "CED", support: 62 }, { college: "COL", support: 70 }],
      byYear: [{ year: "1st", pct: 36 }, { year: "2nd", pct: 37 }, { year: "3rd", pct: 38 }, { year: "4th", pct: 42 }],
    },
    {
      name: "Marco Fernandez", votes: 512, percentage: 25.6, rank: 3, color: "#7C3AED",
      byCollege: [{ college: "CCS", support: 37 }, { college: "CBA", support: 30 }, { college: "CHSS", support: 10 }, { college: "CON", support: 5 }, { college: "CSEA", support: 22 }, { college: "CED", support: 13 }, { college: "COL", support: 8 }],
      byYear: [{ year: "1st", pct: 26 }, { year: "2nd", pct: 30 }, { year: "3rd", pct: 33 }, { year: "4th", pct: 33 }],
    },
  ],
  "Secretary": [
    {
      name: "Sofia Garcia", votes: 1105, percentage: 55.3, rank: 1, color: "#2563EB",
      byCollege: [{ college: "CCS", support: 48 }, { college: "CBA", support: 52 }, { college: "CHSS", support: 62 }, { college: "CON", support: 70 }, { college: "CSEA", support: 58 }, { college: "CED", support: 78 }, { college: "COL", support: 65 }],
      byYear: [{ year: "1st", pct: 60 }, { year: "2nd", pct: 57 }, { year: "3rd", pct: 53 }, { year: "4th", pct: 50 }],
    },
    {
      name: "Renz Aquino", votes: 782, percentage: 39.1, rank: 2, color: "#0A2540",
      byCollege: [{ college: "CCS", support: 52 }, { college: "CBA", support: 48 }, { college: "CHSS", support: 38 }, { college: "CON", support: 30 }, { college: "CSEA", support: 42 }, { college: "CED", support: 22 }, { college: "COL", support: 35 }],
      byYear: [{ year: "1st", pct: 40 }, { year: "2nd", pct: 43 }, { year: "3rd", pct: 47 }, { year: "4th", pct: 50 }],
    },
  ],
};

const candidateAnalyticsData = [
  {
    name: "Carlo Dela Cruz", votes: 892, percentage: 44.6, rank: 2, color: "#2563EB",
    byCollege: [
      { college: "CCS", support: 48 }, { college: "CBA", support: 12 },
      { college: "CHSS", support: 28 }, { college: "CON", support: 17 },
      { college: "CSEA", support: 13 }, { college: "CED", support: 8 }, { college: "COL", support: 8 },
    ],
    byYear: [{ year: "1st", pct: 55 }, { year: "2nd", pct: 49 }, { year: "3rd", pct: 46 }, { year: "4th", pct: 43 }],
  },
  {
    name: "Angela Ramos", votes: 955, percentage: 51.7, rank: 1, color: "#0A2540",
    byCollege: [
      { college: "CCS", support: 52 }, { college: "CBA", support: 88 },
      { college: "CHSS", support: 72 }, { college: "CON", support: 83 },
      { college: "CSEA", support: 88 }, { college: "CED", support: 92 }, { college: "COL", support: 92 },
    ],
    byYear: [{ year: "1st", pct: 33 }, { year: "2nd", pct: 33 }, { year: "3rd", pct: 33 }, { year: "4th", pct: 30 }],
  },
];

const compareData = [
  { college: "CCS", "ASG 2024": 72, "ASG 2025": 85 },
  { college: "CBA", "ASG 2024": 58, "ASG 2025": 67 },
  { college: "CHSS", "ASG 2024": 74, "ASG 2025": 87 },
  { college: "CON", "ASG 2024": 69, "ASG 2025": 83 },
  { college: "CSEA", "ASG 2024": 55, "ASG 2025": 71 },
  { college: "CED", "ASG 2024": 48, "ASG 2025": 63 },
  { college: "COL", "ASG 2024": 35, "ASG 2025": 50 },
];

const programData = [
  { program: "BS Information Technology", votes: 456, eligible: 520, rate: 87.7 },
  { program: "BS Computer Science", votes: 312, eligible: 380, rate: 82.1 },
  { program: "BS Information Systems", votes: 234, eligible: 290, rate: 80.7 },
  { program: "BS Accountancy", votes: 312, eligible: 450, rate: 69.3 },
  { program: "BS Nursing", votes: 289, eligible: 350, rate: 82.6 },
  { program: "BS Education", votes: 78, eligible: 120, rate: 65.0 },
];

const presidentResults = [
  { name: "Carlo Dela Cruz", votes: 892, percentage: 44.6, color: "#2563EB" },
  { name: "Angela Ramos", votes: 955, percentage: 47.8, color: "#0A2540" },
  { name: "Abstain", votes: 150, percentage: 7.5, color: "#94A3B8" },
];
const vpResults = [
  { name: "Luis Bautista", votes: 623, percentage: 31.2, color: "#2563EB" },
  { name: "Hana Villanueva", votes: 712, percentage: 35.6, color: "#0A2540" },
  { name: "Marco Fernandez", votes: 512, percentage: 25.6, color: "#7C3AED" },
  { name: "Abstain", votes: 150, percentage: 7.5, color: "#94A3B8" },
];
const secretaryResults = [
  { name: "Sofia Garcia", votes: 1105, percentage: 55.3, color: "#2563EB" },
  { name: "Renz Aquino", votes: 782, percentage: 39.1, color: "#0A2540" },
  { name: "Abstain", votes: 110, percentage: 5.5, color: "#94A3B8" },
];
const ccsRepResults = [
  { name: "Trisha Mendoza", votes: 198, percentage: 63.5, color: "#2563EB" },
  { name: "Jan Ocampo", votes: 94, percentage: 30.1, color: "#0A2540" },
  { name: "Abstain", votes: 20, percentage: 6.4, color: "#94A3B8" },
];
// Per-election results — keyed by election ID
const electionResultsData: Record<number, Array<{ position: string; data: Array<{ name: string; votes: number; percentage: number; color: string }> }>> = {
  1: [
    { position: "President", data: presidentResults },
    { position: "Vice President", data: vpResults },
    { position: "Secretary", data: secretaryResults },
    { position: "CCS Representative", data: ccsRepResults },
  ],
  2: [
    { position: "CCS President", data: [
      { name: "Ana Reyes", votes: 201, percentage: 64.4, color: "#2563EB" },
      { name: "Ben Santos", votes: 82, percentage: 26.3, color: "#0A2540" },
      { name: "Abstain", votes: 29, percentage: 9.3, color: "#94A3B8" },
    ]},
    { position: "CCS Vice President", data: [
      { name: "Carlo Tan", votes: 178, percentage: 57.1, color: "#2563EB" },
      { name: "Diana Go", votes: 112, percentage: 35.9, color: "#0A2540" },
      { name: "Abstain", votes: 22, percentage: 7.1, color: "#94A3B8" },
    ]},
    { position: "CCS Secretary", data: [
      { name: "Ella Cruz", votes: 220, percentage: 70.5, color: "#2563EB" },
      { name: "Felix Lim", votes: 72, percentage: 23.1, color: "#0A2540" },
      { name: "Abstain", votes: 20, percentage: 6.4, color: "#94A3B8" },
    ]},
  ],
  3: [], // upcoming — no results yet
  4: [
    { position: "CBA President", data: [
      { name: "Marco Flores", votes: 312, percentage: 62.7, color: "#2563EB" },
      { name: "Luz Garcia", votes: 149, percentage: 29.9, color: "#0A2540" },
      { name: "Abstain", votes: 37, percentage: 7.4, color: "#94A3B8" },
    ]},
    { position: "CBA Vice President", data: [
      { name: "Nina Castro", votes: 287, percentage: 57.6, color: "#2563EB" },
      { name: "Oscar Reyes", votes: 168, percentage: 33.7, color: "#0A2540" },
      { name: "Abstain", votes: 43, percentage: 8.6, color: "#94A3B8" },
    ]},
  ],
};

const turnoutData = [
  { day: "D1 9AM", votes: 234 }, { day: "D1 12PM", votes: 687 },
  { day: "D1 3PM", votes: 1102 }, { day: "D1 6PM", votes: 1456 },
  { day: "D2 9AM", votes: 1589 }, { day: "D2 12PM", votes: 1847 },
];
function candidateTimelineData(results: Array<{ name: string; votes: number }>) {
  const candidates = results.filter((candidate) => candidate.name !== "Abstain");
  const progress = [0.12, 0.34, 0.56, 0.76, 0.88, 1];
  return turnoutData.map((point, index) => {
    const row: Record<string, string | number> = { day: point.day };
    candidates.forEach((candidate, candidateIndex) => {
      const earlyLean = 1 + ((candidateIndex % 3) - 1) * 0.045;
      const adjustedProgress = Math.min(1, progress[index] * earlyLean);
      row[candidate.name] = Math.round(candidate.votes * adjustedProgress);
    });
    return row;
  });
}
const participationData = [
  { college: "CCS", rate: 76 }, { college: "CBA", rate: 68 },
  { college: "CED", rate: 72 }, { college: "CHSS", rate: 81 },
  { college: "CSEA", rate: 65 }, { college: "CON", rate: 79 },
  { college: "COL", rate: 70 },
];
const mockUsersData: MockUser[] = [
  { id: 1, studentNumber: "2021-00456", name: "Maria Santos", email: "m.santos@gbox.adnu.edu.ph", college: "CCS", org: "JPCS", status: "active" },
  { id: 2, studentNumber: "2022-01123", name: "Carlo Dela Cruz", email: "c.delacruz@gbox.adnu.edu.ph", college: "CCS", org: "CSS", status: "active" },
  { id: 3, studentNumber: "2020-00789", name: "Angela Ramos", email: "a.ramos@gbox.adnu.edu.ph", college: "CBA", org: "", status: "active" },
  { id: 4, studentNumber: "2023-00234", name: "Luis Bautista", email: "l.bautista@gbox.adnu.edu.ph", college: "CHSS", org: "GABAY", status: "pending" },
  { id: 5, studentNumber: "2021-00567", name: "Hana Villanueva", email: "h.villanueva@gbox.adnu.edu.ph", college: "CON", org: "", status: "suspended" },
  { id: 6, studentNumber: "2022-00891", name: "Sofia Garcia", email: "s.garcia@gbox.adnu.edu.ph", college: "CED", org: "LEAP", status: "active" },
];

// ─── SHARED UTILITIES ─────────────────────────────────────────────────────────

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "bg-emerald-50 text-emerald-700 border-emerald-200",
    upcoming: "bg-amber-50 text-amber-700 border-amber-200",
    closed: "bg-slate-100 text-slate-500 border-slate-200",
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    suspended: "bg-red-50 text-red-700 border-red-200",
    inactive: "bg-slate-100 text-slate-500 border-slate-200",
    live: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };
  const labels: Record<string, string> = {
    active: "Active", upcoming: "Upcoming", closed: "Closed",
    pending: "Pending", suspended: "Suspended", inactive: "Inactive", live: "● Live",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${map[status] ?? "bg-slate-100 text-slate-600 border-slate-200"}`}>
      {labels[status] ?? status}
    </span>
  );
}

function TypeBadge({ type }: { type: string }) {
  const map: Record<string, string> = {
    "University-Wide": "bg-blue-50 text-blue-700 border-blue-200",
    "College": "bg-purple-50 text-purple-700 border-purple-200",
    "Organization": "bg-teal-50 text-teal-700 border-teal-200",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${map[type] ?? "bg-slate-100 text-slate-600 border-slate-200"}`}>
      {type}
    </span>
  );
}

function Btn({
  children, variant = "primary", size = "md", onClick, type = "button", disabled, className = "",
}: {
  children: React.ReactNode; variant?: "primary" | "secondary" | "ghost" | "outline" | "danger";
  size?: "sm" | "md" | "lg"; onClick?: () => void; type?: "button" | "submit";
  disabled?: boolean; className?: string;
}) {
  const base = "inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer";
  const variants = {
    primary: "bg-[#0A2540] text-white hover:bg-[#1E3A8A] active:scale-[0.98]",
    secondary: "bg-[#2563EB] text-white hover:bg-[#1E3A8A] active:scale-[0.98]",
    ghost: "bg-transparent text-[#0F172A] hover:bg-slate-100 active:scale-[0.98]",
    outline: "bg-transparent border border-current hover:bg-white/10 active:scale-[0.98]",
    danger: "bg-[#DC2626] text-white hover:bg-red-700 active:scale-[0.98]",
  };
  const sizes = { sm: "px-3.5 py-2 text-sm", md: "px-5 py-2.5 text-sm", lg: "px-7 py-3.5 text-base" };
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </button>
  );
}

function Field({
  label, type = "text", placeholder, value, onChange, required, helpText, as,
}: {
  label: string; type?: string; placeholder?: string; value: string;
  onChange: (v: string) => void; required?: boolean; helpText?: string; as?: "textarea";
}) {
  const cls = "w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-[#0F172A] placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-all";
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-[#0F172A]">
        {label}{required && <span className="text-[#DC2626] ml-0.5">*</span>}
      </label>
      {as === "textarea"
        ? <textarea placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} rows={3} className={`${cls} resize-none`} />
        : <input type={type} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} className={cls} />
      }
      {helpText && <p className="text-xs text-slate-500">{helpText}</p>}
    </div>
  );
}

function DropField({
  label, value, onChange, options, placeholder, required,
}: {
  label: string; value: string; onChange: (v: string) => void;
  options: string[]; placeholder?: string; required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-[#0F172A]">
        {label}{required && <span className="text-[#DC2626] ml-0.5">*</span>}
      </label>
      <div className="relative">
        <select value={value} onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none px-3.5 py-2.5 pr-10 rounded-xl border border-slate-200 bg-white text-[#0F172A] text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-all">
          <option value="">{placeholder ?? "Select..."}</option>
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
      </div>
    </div>
  );
}

function formatStatValue(value: number, template: string) {
  const formatted = Math.round(value).toLocaleString();
  return template.endsWith("+") ? `${formatted}+` : formatted;
}

function AnimatedStat({ value }: { value: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const target = Number(value.replace(/[^\d]/g, ""));
  const [display, setDisplay] = useState(formatStatValue(0, value));

  useEffect(() => {
    if (!inView || !Number.isFinite(target)) return;

    let frame = 0;
    let animationFrame = 0;
    const digitCount = Math.max(1, String(target).length);

    const shuffle = window.setInterval(() => {
      const randomValue = Math.floor(Math.random() * 10 ** digitCount);
      setDisplay(formatStatValue(randomValue, value));
      frame += 1;
      if (frame >= 14) window.clearInterval(shuffle);
    }, 48);

    const settleDelay = window.setTimeout(() => {
      const start = performance.now();
      const duration = 1150;
      const tick = (now: number) => {
        const progress = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplay(formatStatValue(target * eased, value));
        if (progress < 1) {
          animationFrame = window.requestAnimationFrame(tick);
        } else {
          setDisplay(value);
        }
      };
      animationFrame = window.requestAnimationFrame(tick);
    }, 680);

    return () => {
      window.clearInterval(shuffle);
      window.clearTimeout(settleDelay);
      window.cancelAnimationFrame(animationFrame);
    };
  }, [inView, target, value]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}
      animate={inView ? { opacity: 1, y: 0, filter: "blur(0px)" } : undefined}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="text-4xl lg:text-5xl font-bold text-white mb-2 font-[JetBrains_Mono,monospace] tabular-nums"
    >
      {display}
    </motion.div>
  );
}

function Modal({ title, onClose, children, width = "max-w-md" }: {
  title: string; onClose: () => void; children: React.ReactNode; width?: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${width} max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-[#0F172A]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, sub, icon: Icon, accent = false }: {
  label: string; value: string | number; sub?: string; icon: React.ElementType; accent?: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="text-3xl font-semibold text-[#0F172A] mt-1 font-[JetBrains_Mono,monospace]">{value}</p>
          {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
        </div>
        <div className={`p-3 rounded-xl ${accent ? "bg-[#2563EB] text-white" : "bg-slate-100 text-[#0A2540]"}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

// ─── ANALYTIC METRIC CARD ─────────────────────────────────────────────────────

function AnalyticCard({ label, value, delta, sub, icon: Icon }: {
  label: string; value: string; delta?: number; sub?: string; icon: React.ElementType;
}) {
  const up = delta !== undefined && delta > 0;
  const down = delta !== undefined && delta < 0;
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 duration-200">
      <div className="flex items-start justify-between mb-3">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight">{label}</p>
        <div className="p-2 bg-slate-50 rounded-lg text-slate-400 shrink-0">
          <Icon className="w-3.5 h-3.5" />
        </div>
      </div>
      <div className="text-2xl lg:text-3xl font-bold text-[#0F172A] font-[JetBrains_Mono,monospace] mb-1.5 leading-none">{value}</div>
      <div className="flex items-center gap-1.5">
        {delta !== undefined && (
          <span className={`text-xs font-bold px-1.5 py-0.5 rounded-md ${up ? "bg-emerald-50 text-emerald-600" : down ? "bg-red-50 text-red-500" : "bg-slate-50 text-slate-400"}`}>
            {up ? "↑" : down ? "↓" : "—"} {Math.abs(delta)}%
          </span>
        )}
        {sub && <span className="text-[11px] text-slate-400 leading-tight">{sub}</span>}
      </div>
    </div>
  );
}

// ─── PORTRAIT CANDIDATE CARD ──────────────────────────────────────────────────

function CandidatePortraitCard({
  candidate, selected, onSelect,
}: {
  candidate: { id: number; name: string; college: string; org?: string; platform: string };
  selected: boolean; onSelect: () => void;
}) {
  const gradients = [
    "from-[#0A2540] via-[#0f3460] to-[#1E3A8A]",
    "from-[#1E3A8A] via-[#2563EB] to-[#1d4ed8]",
    "from-[#0F172A] via-[#0A2540] to-[#1E3A8A]",
    "from-[#1E3A8A] via-[#0A2540] to-[#0F172A]",
  ];
  const grad = gradients[candidate.id % gradients.length];

  return (
    <button onClick={onSelect}
      className={`text-left rounded-2xl border-2 overflow-hidden transition-all duration-200 cursor-pointer w-full ${selected ? "border-[#2563EB] shadow-xl shadow-blue-100/70 scale-[1.02]" : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md hover:scale-[1.01]"}`}>
      <div className={`w-full bg-gradient-to-b ${grad} relative`} style={{ aspectRatio: "2/3" }}>
        <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(ellipse at 50% 30%, rgba(255,255,255,0.12) 0%, transparent 65%)" }} />
        <div className="absolute top-3 left-3 w-7 h-7 rounded-full bg-black/35 backdrop-blur-sm flex items-center justify-center">
          <span className="text-white text-[11px] font-bold">{candidate.id}</span>
        </div>
        {selected && (
          <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-[#2563EB] border-2 border-white flex items-center justify-center shadow-lg">
            <Check className="w-3.5 h-3.5 text-white" />
          </div>
        )}
        <div className="absolute inset-0 flex flex-col items-center" style={{ paddingTop: "22%" }}>
          <div className="w-14 h-14 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center shadow-inner">
            <span className="text-white text-lg font-bold tracking-wide">{initials(candidate.name)}</span>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 200 90" className="w-full" fill="none">
            <path d="M0 90 L50 18 L72 52 L100 28 L128 52 L150 18 L200 90 Z" fill="rgba(255,255,255,0.13)" />
            <path d="M72 52 L100 28 L128 52 L115 90 L85 90 Z" fill="rgba(255,255,255,0.09)" />
            <path d="M97 52 L100 28 L103 52 L100 65 Z" fill="rgba(255,255,255,0.18)" />
          </svg>
        </div>
      </div>
      <div className={`p-4 transition-colors ${selected ? "bg-blue-50" : "bg-white"}`}>
        <div className="font-semibold text-[#0F172A] text-sm leading-tight">{candidate.name}</div>
        <div className="text-xs font-medium text-[#2563EB] mt-0.5">{candidate.college}</div>
        {candidate.org && <div className="text-[11px] text-slate-400 mt-0.5">{candidate.org}</div>}
        <p className="text-[11px] text-slate-500 mt-2 leading-relaxed line-clamp-3">{candidate.platform}</p>
      </div>
    </button>
  );
}

// ─── CANDIDATE RESULT CARD ────────────────────────────────────────────────────

function CandidateResultCard({ candidate, isWinner, rank }: {
  candidate: { name: string; votes: number; percentage: number; color: string };
  isWinner: boolean;
  rank: number;
}) {
  const isAbstain = candidate.name === "Abstain";
  const gradients = ["from-[#0A2540] via-[#0f3460] to-[#1E3A8A]", "from-[#1E3A8A] via-[#2563EB] to-[#1d4ed8]", "from-[#0F172A] via-[#0A2540] to-[#1E3A8A]", "from-[#1E3A8A] via-[#0A2540] to-[#0F172A]"];
  const grad = isAbstain ? "from-slate-300 to-slate-400" : gradients[rank % gradients.length];

  return (
    <div className={`rounded-2xl overflow-hidden border-2 transition-all ${isWinner ? "border-amber-400 shadow-lg shadow-amber-100/50" : isAbstain ? "border-dashed border-slate-300" : "border-slate-200"}`}>
      <div className={`w-full relative bg-gradient-to-b ${grad}`} style={{ aspectRatio: "2/3" }}>
        {isWinner && (
          <div className="absolute top-2 right-2 bg-amber-400 text-amber-900 text-[9px] font-bold px-2 py-0.5 rounded-full z-10">
            LEADING
          </div>
        )}
        <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-black/30 flex items-center justify-center">
          <span className="text-white text-[10px] font-bold">#{rank}</span>
        </div>
        {isAbstain ? (
          <div className="absolute inset-0 flex items-center justify-center opacity-40">
            <span className="text-slate-100 text-5xl font-light">—</span>
          </div>
        ) : (
          <>
            <div className="absolute inset-0 flex flex-col items-center" style={{ paddingTop: "22%" }}>
              <div className="w-12 h-12 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center shadow-inner">
                <span className="text-white text-base font-bold">{candidate.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}</span>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0">
              <svg viewBox="0 0 200 90" className="w-full" fill="none">
                <path d="M0 90 L50 18 L72 52 L100 28 L128 52 L150 18 L200 90 Z" fill="rgba(255,255,255,0.13)" />
                <path d="M72 52 L100 28 L128 52 L115 90 L85 90 Z" fill="rgba(255,255,255,0.09)" />
              </svg>
            </div>
          </>
        )}
        {/* Vote overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
          <div className={`text-xl font-bold leading-tight ${isAbstain ? "text-slate-300" : "text-white"}`}>{candidate.percentage}%</div>
          <div className="text-white/70 text-[11px]">{candidate.votes.toLocaleString()} votes</div>
        </div>
      </div>
      <div className={`p-3 ${isAbstain ? "bg-slate-50" : "bg-white"}`}>
        <div className={`font-semibold text-sm truncate ${isAbstain ? "text-slate-400 italic" : "text-[#0F172A]"}`}>{candidate.name}</div>
        <div className="h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${candidate.percentage}%`, backgroundColor: candidate.color, opacity: isAbstain ? 0.4 : 1 }} />
        </div>
      </div>
    </div>
  );
}

// ─── ABSTAIN CARD ─────────────────────────────────────────────────────────────

function AbstainCard({ selected, onSelect }: { selected: boolean; onSelect: () => void }) {
  return (
    <button onClick={onSelect}
      className={`text-left rounded-2xl border-2 overflow-hidden transition-all duration-200 cursor-pointer w-full ${selected ? "border-slate-500 shadow-md scale-[1.01] bg-slate-50" : "border-dashed border-slate-300 bg-white hover:border-slate-400 hover:shadow-sm"}`}>
      <div className="w-full relative flex items-center justify-center bg-gradient-to-b from-slate-100 to-slate-150" style={{ aspectRatio: "2/3" }}>
        {selected && (
          <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-slate-500 border-2 border-white flex items-center justify-center shadow-lg">
            <Check className="w-3.5 h-3.5 text-white" />
          </div>
        )}
        <div className="flex flex-col items-center gap-3 opacity-50">
          <div className="w-14 h-14 rounded-full border-2 border-dashed border-slate-400 flex items-center justify-center">
            <span className="text-slate-400 text-2xl font-light leading-none">—</span>
          </div>
        </div>
        {/* subtle diagonal lines */}
        <div className="absolute inset-0" style={{
          backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(148,163,184,0.08) 10px, rgba(148,163,184,0.08) 11px)",
        }} />
      </div>
      <div className={`p-4 transition-colors ${selected ? "bg-slate-100" : "bg-white"}`}>
        <div className="font-semibold text-slate-600 text-sm">Abstain</div>
        <div className="text-xs text-slate-400 mt-0.5">No preference</div>
        <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
          I choose not to vote for any candidate in this position.
        </p>
      </div>
    </button>
  );
}

// ─── APP SHELL ────────────────────────────────────────────────────────────────

const studentNav = [
  { id: "student-dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "elections-list", label: "Elections", icon: Vote },
  { id: "results", label: "Results", icon: BarChart3 },
  { id: "notifications", label: "Alerts", icon: Bell },
  { id: "profile", label: "Profile", icon: UserCircle },
];
const adminNav = [
  { id: "admin-dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "admin-elections", label: "Elections", icon: Vote },
  { id: "analytics", label: "Analytics", icon: BarChart2 },
  { id: "admin-users", label: "Users", icon: Users2 },
  { id: "admin-organizations", label: "Orgs", icon: Building2 },
];

function AppShell({
  children, view, onNavigate, onSignOut, role, user,
}: {
  children: React.ReactNode; view: string; onNavigate: (v: string) => void;
  onSignOut: () => void; role: Role; user: AppUser;
}) {
  const nav = role === "admin" ? adminNav : studentNav;

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden" style={{ fontFamily: "Inter, sans-serif" }}>
      <aside className="hidden lg:flex w-64 shrink-0 flex-col bg-[#0A2540]">
        <div className="h-16 flex items-center gap-2.5 px-5 border-b border-white/10 shrink-0">
          <img src={whiteMainIconUrl} alt="ADNU VoteHub" className="w-9 h-9 object-contain shrink-0" />
          <span className="votehub-brand-word text-white text-sm tracking-tight">VoteHub</span>
        </div>
        <div className="px-5 pt-5 pb-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
            {role === "admin" ? "Administration" : "Student Portal"}
          </p>
        </div>
        <nav className="flex-1 px-3 py-2 flex flex-col gap-0.5 overflow-y-auto">
          {nav.map((item) => {
            const active = view === item.id;
            return (
              <button key={item.id} onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left cursor-pointer ${active ? "bg-[#2563EB] text-white" : "text-slate-300 hover:bg-white/10 hover:text-white"}`}>
                <item.icon className="w-4 h-4 shrink-0" />
                {item.label === "Alerts" ? "Notifications" : item.label}
              </button>
            );
          })}
        </nav>
        <div className="p-3 border-t border-white/10 shrink-0">
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 transition-all">
            <div className="w-8 h-8 rounded-full bg-[#2563EB] flex items-center justify-center shrink-0 text-white text-xs font-semibold">
              {initials(user.name)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white text-xs font-medium truncate">{user.name}</div>
              <div className="text-slate-400 text-xs truncate">{role === "admin" ? "Administrator" : user.college}</div>
            </div>
            <button onClick={onSignOut} className="text-slate-400 hover:text-white transition-colors p-1 cursor-pointer" title="Sign Out">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-100 flex items-center gap-4 px-6 shrink-0">
          <div className="lg:hidden flex items-center gap-2">
            <img src={horizontalLockupUrl} alt="ADNU VoteHub" className="h-8 w-auto object-contain" />
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <button className="relative p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors cursor-pointer" onClick={() => onNavigate("notifications")}>
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#DC2626]" />
            </button>
            <button onClick={() => onNavigate("profile")}
              className="w-8 h-8 rounded-full bg-[#0A2540] flex items-center justify-center text-white text-xs font-semibold cursor-pointer hover:bg-[#1E3A8A] transition-colors">
              {initials(user.name)}
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto pb-24 lg:pb-0">{children}</main>
      </div>

      {/* Floating bottom navigation — mobile only */}
      <nav className="lg:hidden fixed bottom-3 left-3 right-3 z-40 pointer-events-none">
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl border border-slate-200/80 shadow-2xl shadow-black/15 px-1 py-1.5 flex pointer-events-auto">
          {nav.slice(0, 5).map((item) => {
            const active = view === item.id;
            return (
              <button key={item.id} onClick={() => onNavigate(item.id)}
                className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl transition-all duration-200 cursor-pointer ${active ? "bg-[#0A2540] text-white" : "text-slate-500 hover:text-[#0A2540] hover:bg-slate-50"}`}>
                <item.icon className={`w-5 h-5 shrink-0 ${active ? "stroke-[2.2px]" : ""}`} />
                <span className={`text-[10px] font-semibold truncate ${active ? "text-white" : ""}`}>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

// ─── LANDING PAGE (Floating Navbar) ──────────────────────────────────────────

function LandingPage({ onSignIn, onRegister }: { onSignIn: () => void; onRegister: () => void }) {
  const features = [
    { icon: Shield, title: "Secure Voting", desc: "Tamper-proof audit logs, one-vote enforcement, and end-to-end ballot verification." },
    { icon: BarChart3, title: "Real-Time Results", desc: "Live tallying with configurable visibility — public, scheduled, or admin-controlled." },
    { icon: Building2, title: "College-Based Elections", desc: "Auto-filtered representative seats and positions based on college enrollment." },
    { icon: Users2, title: "Organization Elections", desc: "Isolated election pools for accredited university organizations and societies." },
    { icon: Clock, title: "Automated Scheduling", desc: "Set opening and closing timestamps — elections activate and close automatically." },
    { icon: Eye, title: "Transparent Governance", desc: "Verifiable participation statistics and configurable result disclosure controls." },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC]" style={{ fontFamily: "Inter, sans-serif" }}>
      {/* Floating Navbar */}
      <div className="fixed top-4 inset-x-0 z-50 flex justify-center px-4 sm:px-6 pointer-events-none">
        <nav className="w-full max-w-6xl bg-[#0A2540]/92 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl shadow-black/25 pointer-events-auto">
          <div className="h-16 flex items-center justify-between px-6">
            <div className="flex items-center gap-3">
              <img src={whiteMainIconUrl} alt="AdNU VoteHub" className="w-12 h-12 object-contain shrink-0" />
              <span className="votehub-brand-word text-white text-xl">AdNU VoteHub</span>
            </div>
            <div className="hidden sm:flex items-center gap-4 text-slate-400 text-sm">
              {["About", "Features", "Contact"].map((l) => (
                <a key={l} href="#" className="hover:text-white transition-colors">{l}</a>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Btn variant="ghost" onClick={onSignIn} className="text-white hover:bg-white/10 text-sm">Sign In</Btn>
              <Btn variant="secondary" size="sm" onClick={onRegister}>Register</Btn>
            </div>
          </div>
        </nav>
      </div>

      {/* Hero — pt-24 to clear floating nav */}
      <section className="relative pt-24 min-h-screen flex items-center bg-[#0A2540] overflow-hidden">
        <div className="absolute inset-0 opacity-[0.05]" style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[700px] bg-[#2563EB]/15 rounded-full blur-[140px] pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-6 lg:px-10 py-24 lg:py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#2563EB]/20 border border-[#2563EB]/30 text-[#93C5FD] text-xs font-medium mb-8">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Ateneo de Naga University · Official Voting Platform
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold text-white leading-[1.08] tracking-tight mb-6"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Secure Digital Elections for{" "}
              <span className="votehub-gradient-text">Ateneo de Naga University</span>
            </h1>
            <p className="text-lg text-slate-300 leading-relaxed mb-10 max-w-xl">
              A centralized platform for university, college, and organization voting — transparent, verifiable, and accessible to every Atenean.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Btn variant="secondary" size="lg" onClick={onSignIn} className="sm:w-auto w-full">
                Sign In <ArrowRight className="w-4 h-4" />
              </Btn>
              <Btn variant="outline" size="lg" onClick={onRegister} className="sm:w-auto w-full text-white border-white/30">
                Create Account
              </Btn>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="max-w-xl mb-14">
            <p className="text-[#2563EB] text-xs font-bold uppercase tracking-widest mb-3">Platform Features</p>
            <h2 className="text-3xl lg:text-4xl font-bold text-[#0F172A] leading-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Everything your election needs
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <div key={f.title} className="bg-white rounded-2xl border border-slate-100 p-7 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                <div className="w-11 h-11 rounded-xl bg-[#0A2540] flex items-center justify-center mb-5">
                  <f.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-sm font-semibold text-[#0F172A] mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-[#0A2540]">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { label: "Active Elections", value: "4" },
              { label: "Registered Students", value: "4,200" },
              { label: "Votes Cast", value: "12,847" },
              { label: "Organizations", value: "28" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <AnimatedStat value={s.value} />
                <div className="text-slate-400 text-sm">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-14 lg:py-16 grid gap-12 lg:grid-cols-[minmax(220px,0.75fr)_minmax(520px,1.6fr)]">
          <div className="grid gap-4 content-start">
            <a href="#" aria-label="ADNU VoteHub home" className="inline-flex w-fit">
              <img src={horizontalLockupUrl} alt="ADNU VoteHub" className="w-[190px] max-w-full h-auto object-contain" />
            </a>
            <p className="text-sm text-slate-500 leading-relaxed max-w-[280px]">
              Secure digital elections for Ateneo de Naga University, built for transparent voting and accountable campus governance.
            </p>
            <a href="mailto:voterhub@adnu.edu.ph" className="text-xs font-bold text-[#0A2540] hover:underline underline-offset-4 w-fit">
              voterhub@adnu.edu.ph
            </a>
            <small className="text-[11px] text-slate-400 mt-8">© 2026 Ateneo de Naga University | Unmatched Egoist. All rights reserved.</small>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            {[
              { title: "Explore", links: ["About", "Features", "Live Results", "Organizations"] },
              { title: "Portal", links: ["Student Login", "Register", "Elections", "Profile"] },
              { title: "Administration", links: ["Admin Access", "Election Setup", "Candidates", "Analytics"] },
              { title: "Support", links: ["Help Desk", "Contact", "Voting Guide", "Accessibility"] },
              { title: "Legal", links: ["Privacy Policy", "Terms", "Election Rules"] },
            ].map((column) => (
              <nav key={column.title} className="grid content-start gap-2.5" aria-label={column.title}>
                <span className="text-[11px] font-extrabold text-[#0F172A]">{column.title}</span>
                {column.links.map((link) => (
                  <a key={link} href="#" className="text-xs font-semibold text-slate-500 hover:text-[#0A2540] hover:underline underline-offset-4 w-fit">
                    {link}
                  </a>
                ))}
              </nav>
            ))}
            <p className="col-span-2 md:col-span-5 border-t border-slate-200 pt-5 mt-2 text-xs text-slate-500 leading-relaxed max-w-xl">
              Official election access is limited to verified ADNU accounts. Vote records are sealed after submission and results visibility follows election rules.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ─── LOGIN PAGE ───────────────────────────────────────────────────────────────

function LoginPage({ mode = "student", onLogin, onRegister }: { mode?: "student" | "admin"; onLogin: (r: Role) => void; onRegister?: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const isAdmin = mode === "admin";
  return (
    <div className="min-h-screen bg-[#0A2540] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.06]" style={{
        backgroundImage: "linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)",
        backgroundSize: "64px 64px",
      }} />
      <div className="w-full max-w-md relative">
        <div className="text-center mb-7">
          <img src={whiteVerticalLockupUrl} alt="ADNU VoteHub" className="w-28 h-28 object-contain mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{isAdmin ? "Admin sign in" : "Sign in to VoteHub"}</h1>
          <p className="text-slate-300 text-sm mt-1">{isAdmin ? "VoteHub administration" : "Ateneo de Naga University"}</p>
        </div>
        <div className="bg-white/95 backdrop-blur-xl rounded-[1.5rem] border border-white/60 shadow-2xl shadow-black/25 p-8 flex flex-col gap-5">
          <Field label="Email Address" type="email" placeholder={isAdmin ? "admin@adnu.edu.ph" : "you@gbox.adnu.edu.ph"} value={email} onChange={setEmail} required />
          <Field label="Password" type="password" placeholder="Enter your password" value={password} onChange={setPassword} required />
          <div className="flex justify-end -mt-2"><a href="#" className="text-sm text-[#2563EB] hover:underline">Forgot password?</a></div>
          <Btn variant="primary" size="lg" onClick={() => onLogin(isAdmin ? "admin" : "student")} className="w-full">Sign In</Btn>
        </div>
        {!isAdmin && onRegister && (
          <p className="text-center text-sm text-slate-300 mt-6">
            {"Don't have an account? "}
            <button onClick={onRegister} className="text-white font-semibold hover:underline cursor-pointer">Register here</button>
          </p>
        )}
      </div>
    </div>
  );
}

// ─── REGISTER PAGE ────────────────────────────────────────────────────────────

function RegisterPage({ onBack, onRegister }: { onBack: () => void; onRegister: () => void }) {
  const [form, setForm] = useState({ name: "", studentNumber: "", email: "", college: "", program: "", organization: "", password: "", confirmPassword: "" });
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));
  const validEmail = form.email.endsWith("@gbox.adnu.edu.ph");
  return (
    <div className="min-h-screen bg-[#0A2540] flex items-center justify-center p-4 py-12 relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.06]" style={{
        backgroundImage: "linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)",
        backgroundSize: "64px 64px",
      }} />
      <div className="w-full max-w-xl relative">
        <div className="text-center mb-7">
          <img src={whiteVerticalLockupUrl} alt="ADNU VoteHub" className="w-28 h-28 object-contain mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Create your account</h1>
          <p className="text-slate-300 text-sm mt-1">ADNU VoteHub · Student Registration</p>
        </div>
        <div className="bg-white/95 backdrop-blur-xl rounded-[1.5rem] border border-white/60 shadow-2xl shadow-black/25 p-8 flex flex-col gap-5">
          <Field label="Full Name" placeholder="Maria Santos" value={form.name} onChange={set("name")} required />
          <Field label="Student Number" placeholder="2024-00123" value={form.studentNumber} onChange={set("studentNumber")} required />
          <div>
            <Field label="ADNU Email" type="email" placeholder="you@gbox.adnu.edu.ph" value={form.email} onChange={set("email")} required helpText="Must end with @gbox.adnu.edu.ph for automatic approval" />
            {form.email.length > 6 && (
              <div className={`flex items-center gap-1.5 mt-1.5 text-xs ${validEmail ? "text-emerald-600" : "text-red-500"}`}>
                {validEmail ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                {validEmail ? "Valid ADNU email — auto-approved" : "Must use your @gbox.adnu.edu.ph address"}
              </div>
            )}
          </div>
          <DropField label="College" value={form.college} onChange={set("college")} options={COLLEGES} placeholder="Select your college" required />
          <DropField label="Course / Program" value={form.program} onChange={set("program")} options={PROGRAMS} placeholder="Select your course or program" required />
          <DropField label="Organization" value={form.organization} onChange={set("organization")} options={ORGS} placeholder="Select organization (optional)" />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Password" type="password" placeholder="••••••••" value={form.password} onChange={set("password")} required />
            <Field label="Confirm Password" type="password" placeholder="••••••••" value={form.confirmPassword} onChange={set("confirmPassword")} required />
          </div>
          <Btn variant="primary" size="lg" onClick={onRegister} className="w-full" disabled={!validEmail}>Create Account</Btn>
        </div>
        <p className="text-center text-sm text-slate-300 mt-6">
          Already have an account?{" "}
          <button onClick={onBack} className="text-white font-semibold hover:underline cursor-pointer">Sign in</button>
        </p>
      </div>
    </div>
  );
}

// ─── SHARED ELECTION CARD ─────────────────────────────────────────────────────

function ElectionCard({ election, onVote, onResults }: {
  election: typeof elections[0]; onVote?: () => void; onResults?: () => void;
}) {
  const turnout = election.totalVoters > 0 ? Math.round((election.votescast / election.totalVoters) * 100) : 0;
  const isActive = election.status === "active";
  return (
    <div className="group bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:-translate-y-1 transition-all duration-200">
      <div className="h-1.5 bg-gradient-to-r from-[#0A2540] via-[#2563EB] to-[#38BDF8]" />
      <div className="p-5 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <TypeBadge type={election.type} />
              {isActive && (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
                </span>
              )}
            </div>
            <h3 className="font-bold text-[#0F172A] text-base leading-snug" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {election.title}
            </h3>
          </div>
          <StatusBadge status={election.status} />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-0.5">
              <Calendar className="w-3.5 h-3.5" /> Opens
            </div>
            <div className="text-xs font-semibold text-slate-700">{election.openDate}</div>
          </div>
          <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-0.5">
              <Clock className="w-3.5 h-3.5" /> Closes
            </div>
            <div className="text-xs font-semibold text-slate-700">{election.closeDate}</div>
          </div>
        </div>

        {election.status !== "upcoming" && election.votescast > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-500">Turnout</span>
              <span className="text-xs font-bold font-mono text-[#0A2540]">{turnout}%</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#0A2540] to-[#2563EB] rounded-full transition-all duration-700" style={{ width: `${turnout}%` }} />
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-1">
          {isActive && onVote && (
            <Btn variant="primary" size="sm" onClick={onVote} className="flex-1 !rounded-xl">
              <Vote className="w-3.5 h-3.5" /> Vote Now
            </Btn>
          )}
          {election.status !== "upcoming" && onResults && (
            <Btn variant="ghost" size="sm" onClick={onResults} className={`${isActive && onVote ? "" : "flex-1"} text-slate-600 border border-slate-200 !rounded-xl hover:border-[#0A2540] hover:text-[#0A2540]`}>
              <BarChart3 className="w-3.5 h-3.5" /> Results
            </Btn>
          )}
          {election.status === "upcoming" && (
            <div className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-500 flex items-center justify-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Opens {election.openDate}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── STUDENT DASHBOARD ────────────────────────────────────────────────────────

function StudentDashboard({ user, onVote, onResults }: {
  user: AppUser; onVote: () => void; onResults: () => void;
}) {
  const active = elections.filter((e) => e.status === "active");
  const upcoming = elections.filter((e) => e.status === "upcoming");
  const closed = elections.filter((e) => e.status === "closed");
  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#0F172A]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Good morning, {user.name.split(" ")[0]}</h1>
        <p className="text-slate-500 text-sm mt-0.5">{new Date().toLocaleDateString("en-PH", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Active Elections", value: active.length, color: "text-[#0A2540]" },
          { label: "Upcoming", value: upcoming.length, color: "text-amber-500" },
          { label: "Votes Cast", value: 2, color: "text-emerald-500" },
          { label: "Closed", value: closed.length, color: "text-slate-400" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
            <div className={`text-2xl font-bold font-[JetBrains_Mono,monospace] ${s.color}`}>{s.value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>
      {active.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-[#0F172A] text-sm">Active Elections</h2>
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {active.map((e) => <ElectionCard key={e.id} election={e} onVote={onVote} onResults={onResults} />)}
          </div>
        </section>
      )}
      {upcoming.length > 0 && (
        <section className="mb-8">
          <h2 className="font-semibold text-[#0F172A] text-sm mb-4">Upcoming Elections</h2>
          <div className="grid gap-4 md:grid-cols-2">{upcoming.map((e) => <ElectionCard key={e.id} election={e} />)}</div>
        </section>
      )}
      {closed.length > 0 && (
        <section>
          <h2 className="font-semibold text-[#0F172A] text-sm mb-4">Closed Elections</h2>
          <div className="grid gap-4 md:grid-cols-2">{closed.map((e) => <ElectionCard key={e.id} election={e} onResults={onResults} />)}</div>
        </section>
      )}
    </div>
  );
}

function ElectionsList({ onVote, onResults }: { onVote: () => void; onResults: () => void }) {
  const [filter, setFilter] = useState<"all" | "active" | "upcoming" | "closed">("all");
  const filtered = filter === "all" ? elections : elections.filter((e) => e.status === filter);
  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-[#0F172A] mb-6" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Elections</h1>
      <div className="flex gap-2 mb-6 flex-wrap">
        {(["all", "active", "upcoming", "closed"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all cursor-pointer ${filter === f ? "bg-[#0A2540] text-white" : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300"}`}>
            {f}
          </button>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {filtered.map((e) => <ElectionCard key={e.id} election={e} onVote={onVote} onResults={onResults} />)}
      </div>
    </div>
  );
}

// ─── VOTING PAGE ──────────────────────────────────────────────────────────────

const ABSTAIN_ID = 0;

function VotingPage({ user, onBack }: { user: AppUser; onBack: () => void }) {
  const [phase, setPhase] = useState<"consent" | "ballot" | "submitted">("consent");
  const [hasAcknowledgedPolicies, setHasAcknowledgedPolicies] = useState(false);
  const [selections, setSelections] = useState<Record<number, number>>({});
  const [showConfirm, setShowConfirm] = useState(false);

  const filteredPositions = positions.filter((p) => !("college" in p) || (p as any).college === user.college);
  const total = filteredPositions.length;
  const selected = Object.keys(selections).length;
  const allConsented = hasAcknowledgedPolicies;

  const toggleSelection = (positionId: number, candidateId: number) => {
    setSelections((s) => {
      if (s[positionId] === candidateId) {
        const next = { ...s };
        delete next[positionId];
        return next;
      }
      return { ...s, [positionId]: candidateId };
    });
  };

  // ── SUBMITTED ──
  if (phase === "submitted") {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mb-6">
          <CheckCircle2 className="w-10 h-10 text-emerald-500" />
        </div>
        <h2 className="text-2xl font-bold text-[#0F172A] mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Vote Submitted!</h2>
        <p className="text-slate-500 mb-2">Your ballot has been securely recorded and sealed.</p>
        <p className="text-xs text-slate-400 font-mono mb-8">Receipt: VH-2025-{Math.random().toString(36).slice(2, 9).toUpperCase()}</p>
        <Btn variant="primary" onClick={onBack}>Return to Dashboard</Btn>
      </div>
    );
  }

  // ── CONSENT ──
  if (phase === "consent") {
    return (
      <div className="max-w-2xl mx-auto p-6 lg:p-8">
        <div className="bg-[#0A2540] rounded-2xl p-6 mb-6 text-white">
          <StatusBadge status="active" />
          <h1 className="text-lg font-bold mt-2 mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Ateneo Student Government Elections 2025
          </h1>
          <p className="text-slate-300 text-sm">Before you vote, please review and accept the election policies.</p>
        </div>

        {/* Policies */}
        <div className="space-y-4 mb-6">
          {[
            {
              title: "Terms and Conditions",
              body: "By participating in this election, you agree to abide by the ADNU VoteHub election rules and regulations. Votes are anonymous, non-transferable, and irrevocable once submitted. Fraudulent voting activity may result in account suspension and disciplinary action.",
            },
            {
              title: "Privacy Notice",
              body: "Your vote is secret. The system records only that you voted, not how you voted. Participation data (turnout statistics) may be shared with the university administration in aggregate, anonymized form. No personally identifiable voting preference data will ever be disclosed.",
            },
            {
              title: "Election Guidelines",
              body: "You may select one candidate per position, or choose Abstain. Abstaining is a valid and respected ballot choice. You may leave positions unanswered, but completing all positions strengthens election legitimacy. Your ballot cannot be modified after submission.",
            },
          ].map((p) => (
            <div key={p.title} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <h3 className="font-semibold text-[#0F172A] text-sm mb-2">{p.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{p.body}</p>
            </div>
          ))}
        </div>

        {/* Consent checkboxes */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-6 space-y-4">
          <h3 className="font-semibold text-[#0F172A] text-sm mb-4">Required Acknowledgements</h3>
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${hasAcknowledgedPolicies ? "bg-[#2563EB] border-[#2563EB]" : "border-slate-300 group-hover:border-[#2563EB]"}`}
              onClick={() => setHasAcknowledgedPolicies((checked) => !checked)}>
              {hasAcknowledgedPolicies && <Check className="w-3 h-3 text-white" />}
            </div>
            <span className="text-sm text-slate-700 leading-snug">
              I have read and agree to all election policies, including the terms, privacy notice, and the rule that submitted votes cannot be modified.
            </span>
          </label>
        </div>

        <Btn variant="primary" size="lg" onClick={() => setPhase("ballot")} disabled={!allConsented} className="w-full">
          Continue to Voting Ballot <ChevronRight className="w-4 h-4" />
        </Btn>
        {!allConsented && (
          <p className="text-center text-xs text-slate-400 mt-3">All acknowledgements must be checked to proceed.</p>
        )}
      </div>
    );
  }

  // ── BALLOT ──
  return (
    <div className="max-w-4xl mx-auto p-6 lg:p-8 pb-36">
      <div className="bg-[#0A2540] rounded-2xl p-6 mb-6 text-white">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <StatusBadge status="active" />
            <h1 className="text-lg font-bold mt-2 mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Ateneo Student Government Elections 2025
            </h1>
            <p className="text-slate-300 text-sm">Jun 25 – Jun 27, 2025 · University-Wide</p>
          </div>
          <div className="text-right shrink-0">
            <div className="text-2xl font-bold font-mono">{selected}/{total}</div>
            <div className="text-slate-400 text-xs">answered</div>
          </div>
        </div>
        <div className="mt-4 h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-[#2563EB] rounded-full transition-all duration-500"
            style={{ width: `${total > 0 ? (selected / total) * 100 : 0}%` }} />
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 mb-6 flex items-start gap-3">
        <AlertCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <p className="text-xs text-slate-600 leading-relaxed">
          Select a candidate or <strong>Abstain</strong> for each position. Clicking a selected card again removes your choice. Only <strong>{user.college}</strong> representative seats are shown. Votes are final once submitted.
        </p>
      </div>

      <div className="flex flex-col gap-10">
        {filteredPositions.map((position) => {
          const hasSelection = position.id in selections;
          return (
            <div key={position.id}>
              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-px bg-slate-200" />
                <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full transition-colors ${hasSelection ? "bg-emerald-600" : "bg-[#0A2540]"}`}>
                  <h2 className="text-xs font-bold text-white uppercase tracking-widest whitespace-nowrap">{position.title}</h2>
                  {hasSelection && <Check className="w-3.5 h-3.5 text-emerald-200" />}
                </div>
                <div className="flex-1 h-px bg-slate-200" />
              </div>
              <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
                {position.candidates.map((candidate) => (
                  <CandidatePortraitCard key={candidate.id} candidate={candidate}
                    selected={selections[position.id] === candidate.id}
                    onSelect={() => toggleSelection(position.id, candidate.id)} />
                ))}
                {/* Abstain card always last */}
                <AbstainCard
                  selected={selections[position.id] === ABSTAIN_ID}
                  onSelect={() => toggleSelection(position.id, ABSTAIN_ID)} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Sticky bar */}
      <div className="fixed bottom-20 lg:bottom-0 left-0 right-0 lg:left-64 bg-white/95 backdrop-blur-sm border-t border-slate-100 shadow-lg shadow-black/5 p-4 z-30">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-[#0F172A]">{selected} of {total} positions answered</div>
            <div className="text-xs text-slate-400 mt-0.5">
              {total - selected > 0 ? `${total - selected} unanswered — still submittable` : "All positions answered"}
            </div>
          </div>
          <Btn variant="primary" onClick={() => setShowConfirm(true)} disabled={selected === 0} className="shrink-0">
            Review & Submit
          </Btn>
        </div>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 text-amber-500" />
            </div>
            <h3 className="text-lg font-bold text-[#0F172A] mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Submit Your Vote?</h3>
            <p className="text-slate-500 text-sm mb-4">
              You have answered <strong>{selected} of {total}</strong> positions.
              {total - selected > 0 && <span className="text-amber-600"> {total - selected} position(s) will be left blank.</span>}
            </p>
            <p className="text-xs text-slate-400 mb-6">Votes <strong className="text-slate-600">cannot be modified</strong> after submission. Abstain selections are recorded as valid votes.</p>
            <div className="flex gap-3">
              <Btn variant="ghost" onClick={() => setShowConfirm(false)} className="flex-1">Cancel</Btn>
              <Btn variant="primary" onClick={() => { setShowConfirm(false); setPhase("submitted"); }} className="flex-1">
                Confirm Vote
              </Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── RESULTS PAGE ─────────────────────────────────────────────────────────────

function ResultsPage() {
  const selectedElectionId = elections[0].id;
  const [activePos, setActivePos] = useState(0);

  const sel = elections.find((e) => e.id === selectedElectionId) ?? elections[0];
  const positionResults = electionResultsData[selectedElectionId] ?? [];
  const current = positionResults[activePos];

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <h1 className="text-2xl font-bold text-[#0F172A]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Results</h1>
          {sel.status === "active" && <StatusBadge status="live" />}
        </div>
      </div>

      {/* Election summary banner */}
      <div className="bg-[#0A2540] text-white rounded-2xl p-4 lg:p-5 mb-6 flex flex-wrap gap-4 lg:gap-6 items-center">
        <div className="min-w-0">
          <div className="text-xs text-slate-400 mb-0.5">Election</div>
          <div className="text-sm font-semibold truncate">{sel.title}</div>
        </div>
        <div className="w-px h-8 bg-white/10 hidden sm:block" />
        <div>
          <div className="text-xs text-slate-400 mb-0.5">Period</div>
          <div className="text-sm font-medium">{sel.openDate} — {sel.closeDate}</div>
        </div>
        <div className="w-px h-8 bg-white/10 hidden sm:block" />
        <div>
          <div className="text-xs text-slate-400 mb-0.5">Turnout</div>
          <div className="text-sm font-bold font-mono">{sel.totalVoters > 0 ? Math.round((sel.votescast / sel.totalVoters) * 100) : 0}%</div>
        </div>
        <div className="ml-auto"><StatusBadge status={sel.status} /></div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-3 lg:gap-4 mb-6">
        {[
          { label: "Votes Cast", value: sel.votescast.toLocaleString() },
          { label: "Total Voters", value: sel.totalVoters.toLocaleString() },
          { label: "Turnout", value: `${sel.totalVoters > 0 ? Math.round((sel.votescast / sel.totalVoters) * 100) : 0}%` },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-100 p-4 lg:p-5 shadow-sm">
            <div className="text-xl lg:text-2xl font-bold text-[#0A2540] font-[JetBrains_Mono,monospace]">{s.value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* No results state */}
      {positionResults.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="font-semibold text-[#0F172A] mb-2">No Results Available</h3>
          <p className="text-slate-500 text-sm">
            {sel.status === "upcoming" ? "This election has not started yet. Results will appear once voting begins." : "Results for this election are not yet available."}
          </p>
        </div>
      ) : (
        <>
          {/* Position tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
            {positionResults.map((r, i) => (
              <button key={r.position} onClick={() => setActivePos(i)}
                className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all cursor-pointer ${activePos === i ? "bg-[#0A2540] text-white" : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300"}`}>
                {r.position}
              </button>
            ))}
          </div>

          {current && (
            <>
              {(() => {
                const runningCandidates = current.data.filter((candidate) => candidate.name !== "Abstain");
                const timeline = candidateTimelineData(current.data);
                return (
                  <>
              {/* Portrait result cards */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-[#0F172A]">{current.position}</h2>
                  <span className="text-xs text-slate-400 font-mono">{current.data.reduce((a, c) => a + c.votes, 0).toLocaleString()} total votes</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {[...current.data].sort((a, b) => b.votes - a.votes).map((c, i) => {
                    const candidatesOnly = current.data.filter(x => x.name !== "Abstain");
                    const isWinner = c.name !== "Abstain" && c.votes === Math.max(...candidatesOnly.map(x => x.votes));
                    return <CandidateResultCard key={c.name} candidate={c} isWinner={isWinner} rank={i + 1} />;
                  })}
                </div>
              </div>

              {/* Horizontal bar breakdown */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-6">
                <h3 className="font-semibold text-[#0F172A] text-sm mb-5">Vote Breakdown — {current.position}</h3>
                <div className="flex flex-col gap-4">
                  {[...current.data].sort((a, b) => b.votes - a.votes).map((c) => {
                    const isAbstain = c.name === "Abstain";
                    const candidatesOnly = current.data.filter(x => x.name !== "Abstain");
                    const isWinner = !isAbstain && c.votes === Math.max(...candidatesOnly.map(x => x.votes));
                    return (
                      <div key={c.name}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {isWinner && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
                            <span className={`text-sm font-medium ${isWinner ? "text-[#0F172A]" : isAbstain ? "text-slate-400 italic" : "text-slate-600"}`}>
                              {c.name}
                            </span>
                            {isAbstain && <span className="text-[10px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded font-medium">intentional</span>}
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-slate-400 font-mono">{c.votes.toLocaleString()}</span>
                            <span className={`text-sm font-bold w-12 text-right font-mono ${isAbstain ? "text-slate-400" : "text-[#0F172A]"}`}>{c.percentage}%</span>
                          </div>
                        </div>
                        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${c.percentage}%`, backgroundColor: c.color, opacity: isAbstain ? 0.5 : 1 }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                {current.data.find(c => c.name === "Abstain") && (
                  <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-400">
                    <span className="font-medium text-slate-500">Abstain rate: </span>
                    <span className="font-bold font-mono">{current.data.find(c => c.name === "Abstain")?.percentage}%</span>
                    {" "}— voters who intentionally did not support any candidate.
                  </div>
                )}
              </div>

              {/* Votes over time */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <h3 className="font-semibold text-[#0F172A] text-sm">Candidate Votes Over Time</h3>
                  <span className="text-xs text-slate-400">{current.position}</span>
                </div>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={timeline}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#94A3B8" }} />
                    <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E2E8F0" }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    {runningCandidates.map((candidate) => (
                      <Line
                        key={candidate.name}
                        type="monotone"
                        dataKey={candidate.name}
                        stroke={candidate.color}
                        strokeWidth={2.5}
                        dot={{ r: 3, strokeWidth: 2 }}
                        activeDot={{ r: 5 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
                  </>
                );
              })()}
            </>
          )}
        </>
      )}
    </div>
  );
}

// ─── PROFILE PAGE ─────────────────────────────────────────────────────────────

function ProfilePage({ user, onSignOut }: { user: AppUser; onSignOut?: () => void }) {
  const [showEdit, setShowEdit] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [ef, setEf] = useState({ name: user.name, college: user.college, program: user.program, organization: user.organization });
  const setE = (k: keyof typeof ef) => (v: string) => setEf((f) => ({ ...f, [k]: v }));
  const isAdmin = user.role === "admin";
  return (
    <div className="p-6 lg:p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-[#0F172A] mb-6" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        {isAdmin ? "Admin Profile" : "My Profile"}
      </h1>

      {/* Profile card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-5">
        <div className="h-24 bg-gradient-to-r from-[#0A2540] via-[#1E3A8A] to-[#2563EB]" />
        <div className="px-5 pb-5">
          {/* Avatar row — separate so it doesn't fight for width on mobile */}
          <div className="flex items-start justify-between -mt-10 mb-4">
            <div className="w-20 h-20 rounded-2xl bg-[#0A2540] flex items-center justify-center text-white text-2xl font-bold border-4 border-white shadow-lg shrink-0">
              {initials(user.name)}
            </div>
            <div className="pt-12 shrink-0">
              <Btn variant="ghost" size="sm" onClick={() => setShowEdit(true)} className="text-slate-600 border border-slate-200 bg-white hover:bg-slate-50">
                <Edit2 className="w-3.5 h-3.5" /> Edit
              </Btn>
            </div>
          </div>
          {/* Name + badges */}
          <div className="mb-5">
            <h2 className="font-bold text-[#0F172A] text-lg leading-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {user.name}
            </h2>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <StatusBadge status={user.status} />
              {isAdmin && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#0A2540] text-white">
                  Administrator
                </span>
              )}
            </div>
          </div>
          {/* Info grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(isAdmin ? [
              { label: "Name", value: user.name },
              { label: "Role", value: "System Administrator" },
              { label: "Email", value: user.email },
              { label: "Employee ID", value: user.studentNumber },
              { label: "Department", value: user.college },
              { label: "Last Login", value: "Today, 8:41 AM" },
            ] : [
              { label: "Student Number", value: user.studentNumber },
              { label: "Email", value: user.email },
              { label: "College", value: user.college },
              { label: "Course / Program", value: user.program },
              { label: "Organization", value: user.organization || "None" },
            ]).map((f) => (
              <div key={f.label} className="bg-slate-50 rounded-xl p-4">
                <div className="text-xs text-slate-400 mb-1">{f.label}</div>
                <div className="text-sm font-medium text-[#0F172A] break-all">{f.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action rows */}
      <div className="flex flex-col gap-3 mb-5">
        <button onClick={() => setShowPwd(true)}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-all cursor-pointer text-left w-full">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
            <KeyRound className="w-5 h-5 text-[#0A2540]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-[#0F172A]">Change Password</div>
            <div className="text-xs text-slate-500 mt-0.5">Update your account password</div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
        </button>
        {isAdmin && (
          <button className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-all cursor-pointer text-left w-full">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-[#0A2540]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-[#0F172A]">Security Preferences</div>
              <div className="text-xs text-slate-500 mt-0.5">Manage 2FA and active login sessions</div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
          </button>
        )}
        {/* Logout — always visible, especially important on mobile */}
        {onSignOut && (
          <button onClick={onSignOut}
            className="bg-white rounded-2xl border border-red-100 shadow-sm p-5 flex items-center gap-4 hover:shadow-md hover:border-red-200 transition-all cursor-pointer text-left w-full">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
              <LogOut className="w-5 h-5 text-[#DC2626]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-[#DC2626]">Sign Out</div>
              <div className="text-xs text-slate-500 mt-0.5">Sign out of your ADNU VoteHub account</div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
          </button>
        )}
      </div>

      {!isAdmin && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="font-semibold text-[#0F172A] mb-4 text-sm">Voting History</h3>
          {elections.slice(0, 2).map((e) => (
            <div key={e.id} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
              <div className="min-w-0 pr-4">
                <div className="text-sm font-medium text-[#0F172A] truncate">{e.title}</div>
                <div className="text-xs text-slate-400">{e.openDate}</div>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium shrink-0">
                <Check className="w-3.5 h-3.5" /> Voted
              </div>
            </div>
          ))}
        </div>
      )}
      {showEdit && (
        <Modal title="Edit Profile" onClose={() => setShowEdit(false)}>
          <div className="flex flex-col gap-4">
            <Field label="Full Name" value={ef.name} onChange={setE("name")} />
            <DropField label="College" value={ef.college} onChange={setE("college")} options={COLLEGES} />
            {!isAdmin && (
              <>
                <DropField label="Course / Program" value={ef.program} onChange={setE("program")} options={PROGRAMS} placeholder="Select your course or program" />
                <DropField label="Organization" value={ef.organization} onChange={setE("organization")} options={ORGS} placeholder="None" />
              </>
            )}
            <div className="flex gap-3 pt-2">
              <Btn variant="ghost" onClick={() => setShowEdit(false)} className="flex-1">Cancel</Btn>
              <Btn variant="primary" onClick={() => setShowEdit(false)} className="flex-1">Save Changes</Btn>
            </div>
          </div>
        </Modal>
      )}
      {showPwd && (
        <Modal title="Change Password" onClose={() => setShowPwd(false)}>
          <div className="flex flex-col gap-4">
            <Field label="Current Password" type="password" placeholder="••••••••" value="" onChange={() => {}} />
            <Field label="New Password" type="password" placeholder="••••••••" value="" onChange={() => {}} />
            <Field label="Confirm New Password" type="password" placeholder="••••••••" value="" onChange={() => {}} />
            <div className="flex gap-3 pt-2">
              <Btn variant="ghost" onClick={() => setShowPwd(false)} className="flex-1">Cancel</Btn>
              <Btn variant="primary" onClick={() => setShowPwd(false)} className="flex-1">Update Password</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function NotificationsPage() {
  const notes = [
    { id: 1, type: "election", title: "ASG Elections 2025 is now open — cast your vote today.", time: "2 hours ago", read: false },
    { id: 2, type: "election", title: "CCS Student Council Elections is open.", time: "2 hours ago", read: false },
    { id: 3, type: "reminder", title: "JPCS Election opens in 10 days — check your eligibility.", time: "1 day ago", read: true },
    { id: 4, type: "result", title: "CBA Student Council results are now available.", time: "2 weeks ago", read: true },
  ];
  const typeMap: Record<string, { cls: string; Icon: React.ElementType }> = {
    election: { cls: "bg-blue-50 text-[#2563EB]", Icon: Vote },
    reminder: { cls: "bg-amber-50 text-amber-600", Icon: Clock },
    result: { cls: "bg-emerald-50 text-emerald-600", Icon: BarChart3 },
  };
  return (
    <div className="p-6 lg:p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-[#0F172A] mb-6" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Notifications</h1>
      <div className="flex flex-col gap-2">
        {notes.map((n) => {
          const t = typeMap[n.type];
          return (
            <div key={n.id} className={`bg-white rounded-2xl border shadow-sm p-5 flex items-start gap-4 ${n.read ? "border-slate-100" : "border-[#2563EB]/30 ring-1 ring-[#2563EB]/10"}`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${t.cls}`}><t.Icon className="w-4 h-4" /></div>
              <div className="flex-1"><p className={`text-sm leading-snug ${n.read ? "text-slate-600" : "text-[#0F172A] font-medium"}`}>{n.title}</p><p className="text-xs text-slate-400 mt-1">{n.time}</p></div>
              {!n.read && <div className="w-2 h-2 rounded-full bg-[#2563EB] mt-1.5 shrink-0" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── ADMIN DASHBOARD ──────────────────────────────────────────────────────────

function AdminDashboard({ onCreateElection, onAnalytics }: { onCreateElection: () => void; onAnalytics: () => void }) {
  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Admin Dashboard</h1>
          <p className="text-slate-500 text-sm mt-0.5">Ateneo de Naga University · AY 2025–2026</p>
        </div>
        <div className="flex gap-2">
          <Btn variant="ghost" size="sm" onClick={onAnalytics} className="text-slate-600"><BarChart2 className="w-4 h-4" /> Analytics</Btn>
          <Btn variant="secondary" size="sm" onClick={onCreateElection}><Plus className="w-4 h-4" /> New Election</Btn>
        </div>
      </div>
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <MetricCard label="Total Students" value="4,200" icon={Users2} sub="+84 this week" />
        <MetricCard label="Total Elections" value="12" icon={Vote} sub="AY 2025–2026" />
        <MetricCard label="Active Elections" value="4" icon={TrendingUp} accent sub="2 ending today" />
        <MetricCard label="Votes Cast" value="12,847" icon={CheckCircle2} sub="All elections" />
      </div>
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="font-semibold text-[#0F172A] mb-4 text-sm">Votes Over Time — ASG 2025</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={turnoutData}>
              <defs><linearGradient id="avg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2563EB" stopOpacity={0.15} /><stop offset="95%" stopColor="#2563EB" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#94A3B8" }} />
              <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E2E8F0" }} />
              <Area type="monotone" dataKey="votes" stroke="#2563EB" strokeWidth={2} fill="url(#avg)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="font-semibold text-[#0F172A] mb-4 text-sm">Participation by College</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={participationData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: "#94A3B8" }} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
              <YAxis dataKey="college" type="category" tick={{ fontSize: 11, fill: "#64748B" }} width={42} />
              <Tooltip formatter={(v) => [`${v}%`, "Participation"]} contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E2E8F0" }} />
              <Bar dataKey="rate" fill="#0A2540" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-[#0F172A] text-sm">Elections Overview</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {["Election", "Type", "Status", "Turnout", "Closes"].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {elections.map((e) => {
                const t = Math.round((e.votescast / e.totalVoters) * 100);
                return (
                  <tr key={e.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4 font-medium text-[#0F172A] max-w-xs truncate">{e.title}</td>
                    <td className="px-5 py-4"><TypeBadge type={e.type} /></td>
                    <td className="px-5 py-4"><StatusBadge status={e.status} /></td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-[#2563EB] rounded-full" style={{ width: `${t}%` }} /></div>
                        <span className="text-xs text-slate-500 font-mono">{t}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-500 text-xs">{e.closeDate}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── ADMIN USERS ──────────────────────────────────────────────────────────────

function AdminUsers() {
  const [users, setUsers] = useState<MockUser[]>(mockUsersData);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editUser, setEditUser] = useState<MockUser | null>(null);
  const [viewUser, setViewUser] = useState<MockUser | null>(null);
  const [addForm, setAddForm] = useState({ name: "", studentNumber: "", email: "", college: "", org: "" });
  const setA = (k: keyof typeof addForm) => (v: string) => setAddForm((f) => ({ ...f, [k]: v }));
  const filtered = users.filter((u) => u.name.toLowerCase().includes(search.toLowerCase()) || u.studentNumber.includes(search) || u.email.toLowerCase().includes(search.toLowerCase()));
  const toggleStatus = (id: number, action: "activate" | "suspend") => setUsers((us) => us.map((u) => u.id === id ? { ...u, status: action === "activate" ? "active" : "suspended" } : u));

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>User Management</h1>
          <p className="text-slate-500 text-sm mt-0.5">{users.length} registered students</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 pr-4 py-2 rounded-xl bg-slate-100 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB] w-52 border-0" />
          </div>
          <Btn variant="primary" size="sm" onClick={() => setShowAdd(true)}><Plus className="w-4 h-4" /> Add User</Btn>
        </div>
      </div>
      {/* Desktop table */}
      <div className="hidden lg:block bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {["Student No.", "Name", "Email", "College", "Org", "Status", "Actions"].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-4 font-mono text-xs text-slate-600">{u.studentNumber}</td>
                  <td className="px-5 py-4 font-medium text-[#0F172A] whitespace-nowrap">{u.name}</td>
                  <td className="px-5 py-4 text-slate-500 text-xs">{u.email}</td>
                  <td className="px-5 py-4"><span className="px-2 py-0.5 bg-slate-100 rounded-md text-xs font-medium text-slate-600">{u.college}</span></td>
                  <td className="px-5 py-4 text-slate-400 text-xs">{u.org || "—"}</td>
                  <td className="px-5 py-4"><StatusBadge status={u.status} /></td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setViewUser(u)} className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-[#2563EB] transition-colors cursor-pointer" title="View"><Eye className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setEditUser({ ...u })} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer" title="Edit"><Edit2 className="w-3.5 h-3.5" /></button>
                      {u.status !== "active"
                        ? <button onClick={() => toggleStatus(u.id, "activate")} className="p-1.5 rounded-lg hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer" title="Activate"><CheckCircle2 className="w-3.5 h-3.5" /></button>
                        : <button onClick={() => toggleStatus(u.id, "suspend")} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-[#DC2626] transition-colors cursor-pointer" title="Suspend"><Archive className="w-3.5 h-3.5" /></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="lg:hidden flex flex-col gap-3">
        {filtered.map((u) => (
          <div key={u.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-[#0A2540] flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {initials(u.name)}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-[#0F172A] text-sm truncate">{u.name}</div>
                  <div className="text-xs text-slate-400 font-mono truncate">{u.studentNumber}</div>
                </div>
              </div>
              <StatusBadge status={u.status} />
            </div>
            <div className="flex flex-col gap-1 mb-3">
              <div className="text-xs text-slate-500 truncate">{u.email}</div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-slate-100 rounded-md text-xs font-medium text-slate-600">{u.college}</span>
                {u.org && <span className="text-xs text-slate-400">{u.org}</span>}
              </div>
            </div>
            <div className="flex gap-2 pt-2 border-t border-slate-50">
              <button onClick={() => setViewUser(u)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg hover:bg-blue-50 text-slate-500 hover:text-[#2563EB] transition-colors text-xs font-medium cursor-pointer">
                <Eye className="w-3.5 h-3.5" /> View
              </button>
              <button onClick={() => setEditUser({ ...u })} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors text-xs font-medium cursor-pointer">
                <Edit2 className="w-3.5 h-3.5" /> Edit
              </button>
              {u.status !== "active"
                ? <button onClick={() => toggleStatus(u.id, "activate")} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg hover:bg-emerald-50 text-slate-500 hover:text-emerald-600 transition-colors text-xs font-medium cursor-pointer">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Activate
                  </button>
                : <button onClick={() => toggleStatus(u.id, "suspend")} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg hover:bg-red-50 text-slate-500 hover:text-[#DC2626] transition-colors text-xs font-medium cursor-pointer">
                    <Archive className="w-3.5 h-3.5" /> Suspend
                  </button>}
            </div>
          </div>
        ))}
      </div>
      {showAdd && (
        <Modal title="Add New User" onClose={() => setShowAdd(false)} width="max-w-lg">
          <div className="flex flex-col gap-4">
            <Field label="Full Name" placeholder="Maria Santos" value={addForm.name} onChange={setA("name")} required />
            <Field label="Student Number" placeholder="2024-00123" value={addForm.studentNumber} onChange={setA("studentNumber")} required />
            <Field label="Email" type="email" placeholder="you@gbox.adnu.edu.ph" value={addForm.email} onChange={setA("email")} required />
            <div className="grid grid-cols-2 gap-4">
              <DropField label="College" value={addForm.college} onChange={setA("college")} options={COLLEGES} placeholder="Select college" required />
              <DropField label="Organization" value={addForm.org} onChange={setA("org")} options={ORGS} placeholder="None" />
            </div>
            <div className="flex gap-3 pt-2">
              <Btn variant="ghost" onClick={() => setShowAdd(false)} className="flex-1">Cancel</Btn>
              <Btn variant="primary" onClick={() => { if (addForm.name && addForm.studentNumber && addForm.email && addForm.college) { setUsers((us) => [...us, { id: Date.now(), ...addForm, status: "pending" }]); setShowAdd(false); setAddForm({ name: "", studentNumber: "", email: "", college: "", org: "" }); } }} className="flex-1">Add User</Btn>
            </div>
          </div>
        </Modal>
      )}
      {editUser && (
        <Modal title="Edit User" onClose={() => setEditUser(null)} width="max-w-lg">
          <div className="flex flex-col gap-4">
            <Field label="Full Name" value={editUser.name} onChange={(v) => setEditUser((u) => u ? { ...u, name: v } : null)} required />
            <Field label="Student Number" value={editUser.studentNumber} onChange={(v) => setEditUser((u) => u ? { ...u, studentNumber: v } : null)} required />
            <Field label="Email" type="email" value={editUser.email} onChange={(v) => setEditUser((u) => u ? { ...u, email: v } : null)} required />
            <div className="grid grid-cols-2 gap-4">
              <DropField label="College" value={editUser.college} onChange={(v) => setEditUser((u) => u ? { ...u, college: v } : null)} options={COLLEGES} />
              <DropField label="Organization" value={editUser.org} onChange={(v) => setEditUser((u) => u ? { ...u, org: v } : null)} options={ORGS} placeholder="None" />
            </div>
            <div className="flex gap-3 pt-2">
              <Btn variant="ghost" onClick={() => setEditUser(null)} className="flex-1">Cancel</Btn>
              <Btn variant="primary" onClick={() => { setUsers((us) => us.map((u) => u.id === editUser!.id ? editUser! : u)); setEditUser(null); }} className="flex-1">Save Changes</Btn>
            </div>
          </div>
        </Modal>
      )}
      {viewUser && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30" onClick={() => setViewUser(null)} />
          <div className="relative z-10 w-full max-w-sm bg-white h-full shadow-2xl flex flex-col overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-[#0F172A]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>User Details</h3>
              <button onClick={() => setViewUser(null)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 flex flex-col gap-5">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-[#0A2540] flex items-center justify-center text-white text-xl font-bold">{initials(viewUser.name)}</div>
                <div><div className="font-bold text-[#0F172A] text-base">{viewUser.name}</div><div className="mt-1"><StatusBadge status={viewUser.status} /></div></div>
              </div>
              <div className="flex flex-col gap-2">
                {[{ label: "Student Number", value: viewUser.studentNumber }, { label: "Email", value: viewUser.email }, { label: "College", value: viewUser.college }, { label: "Organization", value: viewUser.org || "None" }, { label: "Status", value: viewUser.status }].map((f) => (
                  <div key={f.label} className="bg-slate-50 rounded-xl px-4 py-3">
                    <div className="text-xs text-slate-400 mb-0.5">{f.label}</div>
                    <div className="text-sm font-medium text-[#0F172A] capitalize">{f.value}</div>
                  </div>
                ))}
              </div>
              <div className="pt-2 flex flex-col gap-2">
                <Btn variant="ghost" size="sm" onClick={() => { setEditUser({ ...viewUser }); setViewUser(null); }} className="w-full text-slate-600"><Edit2 className="w-3.5 h-3.5" /> Edit User</Btn>
                {viewUser.status !== "active"
                  ? <Btn variant="secondary" size="sm" onClick={() => { toggleStatus(viewUser.id, "activate"); setViewUser(null); }} className="w-full"><CheckCircle2 className="w-3.5 h-3.5" /> Activate Account</Btn>
                  : <Btn variant="danger" size="sm" onClick={() => { toggleStatus(viewUser.id, "suspend"); setViewUser(null); }} className="w-full"><Archive className="w-3.5 h-3.5" /> Suspend Account</Btn>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ADMIN ELECTIONS ──────────────────────────────────────────────────────────

function AdminElections({ onCreateElection, onAnalytics }: { onCreateElection: () => void; onAnalytics: () => void }) {
  const [selectedId, setSelectedId] = useState<number>(elections[0].id);
  const [activeTab, setActiveTab] = useState("overview");
  const [mobileShowDetail, setMobileShowDetail] = useState(false);
  const selected = elections.find((e) => e.id === selectedId) ?? elections[0];
  const turnout = Math.round((selected.votescast / selected.totalVoters) * 100);
  const tabs = ["Overview", "Candidates", "Positions", "Analytics", "Results", "Settings"];

  // Candidate modal state
  type CandidateForm = { id?: number; name: string; college: string; org: string; platform: string; positionId: number };
  const [managedPositions, setManagedPositions] = useState(positions.map(p => ({ ...p, candidates: [...p.candidates] })));
  const [showAddCandidate, setShowAddCandidate] = useState(false);
  const [editCandidate, setEditCandidate] = useState<CandidateForm | null>(null);
  const [candidateForm, setCandidateForm] = useState<CandidateForm>({ name: "", college: "", org: "", platform: "", positionId: positions[0]?.id ?? 1 });

  // Position modal state
  type PositionForm = { id?: number; title: string; college: string };
  const [showAddPosition, setShowAddPosition] = useState(false);
  const [editPosition, setEditPosition] = useState<PositionForm | null>(null);
  const [positionForm, setPositionForm] = useState<PositionForm>({ title: "", college: "" });

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left panel — hidden on mobile when detail is open */}
      <div className={`${mobileShowDetail ? "hidden" : "flex"} lg:flex w-full lg:w-72 shrink-0 border-r border-slate-200 bg-white flex-col overflow-hidden`}>
        <div className="flex items-center justify-between px-4 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-[#0F172A] text-sm">Elections</h2>
          <Btn size="sm" variant="secondary" onClick={onCreateElection} className="!px-2.5 !py-1.5 text-xs"><Plus className="w-3.5 h-3.5" /> New</Btn>
        </div>
        <div className="flex-1 overflow-y-auto">
          {elections.map((e) => {
            const isActive = selectedId === e.id;
            return (
              <button key={e.id} onClick={() => { setSelectedId(e.id); setActiveTab("overview"); setMobileShowDetail(true); }}
                className={`w-full text-left px-4 py-4 border-b border-slate-50 transition-colors cursor-pointer ${isActive ? "bg-blue-50 border-l-2 border-l-[#2563EB]" : "hover:bg-slate-50"}`}>
                <div className="text-xs font-semibold text-[#0F172A] truncate mb-2">{e.title}</div>
                <div className="flex items-center gap-2"><StatusBadge status={e.status} /><span className="text-[10px] text-slate-400">{e.type}</span></div>
                <div className="text-[10px] text-slate-400 mt-1.5 font-mono">Closes {e.closeDate}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right detail panel — full width on mobile */}
      <div className={`${mobileShowDetail ? "flex" : "hidden"} lg:flex flex-1 flex-col overflow-hidden`}>
        <div className="bg-white border-b border-slate-200 px-4 lg:px-6 py-4 shrink-0">
          <div className="flex items-center justify-between mb-3 gap-2">
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              {/* Back button on mobile */}
              <button onClick={() => setMobileShowDetail(false)} className="lg:hidden p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer shrink-0">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <h2 className="text-sm font-bold text-[#0F172A] truncate" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{selected.title}</h2>
              <StatusBadge status={selected.status} /><TypeBadge type={selected.type} />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Btn size="sm" variant="ghost" className="text-slate-600 text-xs"><Edit2 className="w-3.5 h-3.5" /> Edit</Btn>
              <Btn size="sm" variant="ghost" className="text-[#DC2626] hover:bg-red-50 text-xs"><Archive className="w-3.5 h-3.5" /> Archive</Btn>
            </div>
          </div>
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab.toLowerCase())}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${activeTab === tab.toLowerCase() ? "bg-[#0A2540] text-white" : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"}`}>
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "overview" && (
            <div className="w-full">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {[{ label: "Eligible Voters", value: selected.totalVoters.toLocaleString() }, { label: "Votes Cast", value: selected.votescast.toLocaleString() }, { label: "Participation", value: `${turnout}%` }].map((s) => (
                  <div key={s.label} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                    <div className="text-2xl font-bold text-[#0A2540] font-[JetBrains_Mono,monospace]">{s.value}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <h3 className="font-semibold text-[#0F172A] text-sm mb-4">Election Details</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[{ label: "Description", value: selected.description }, { label: "Status", value: selected.status }, { label: "Opens", value: selected.openDate }, { label: "Closes", value: selected.closeDate }, { label: "Eligibility", value: selected.eligibility }, { label: "Result Visibility", value: selected.visibility }].map((f) => (
                    <div key={f.label} className={`bg-slate-50 rounded-xl p-4 ${f.label === "Description" ? "col-span-2" : ""}`}>
                      <div className="text-xs text-slate-400 mb-1">{f.label}</div>
                      <div className="text-sm font-medium text-[#0F172A]">{f.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          {activeTab === "analytics" && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-[#0A2540] flex items-center justify-center mb-4"><BarChart2 className="w-8 h-8 text-white" /></div>
              <h3 className="font-bold text-[#0F172A] text-lg mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Full Analytics Dashboard</h3>
              <p className="text-slate-500 text-sm mb-6 max-w-sm">View detailed participation analytics, demographic breakdowns, timeline insights, and candidate performance.</p>
              <Btn variant="primary" onClick={onAnalytics}><BarChart2 className="w-4 h-4" /> Open Analytics</Btn>
            </div>
          )}
          {activeTab === "candidates" && (
            <div className="w-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-[#0F172A] text-sm">All Candidates</h3>
                <Btn size="sm" variant="primary" onClick={() => { setCandidateForm({ name: "", college: "", org: "", platform: "", positionId: managedPositions[0]?.id ?? 1 }); setShowAddCandidate(true); }}><Plus className="w-3.5 h-3.5" /> Add Candidate</Btn>
              </div>
              {managedPositions.map((pos) => (
                <div key={pos.id} className="mb-6">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">{pos.title}</h4>
                  <div className="flex flex-col gap-2">
                    {pos.candidates.map((c) => (
                      <div key={c.id} className="bg-white rounded-xl border border-slate-100 p-4 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0A2540] to-[#2563EB] flex items-center justify-center text-white text-sm font-bold shrink-0">{initials(c.name)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-[#0F172A] text-sm">{c.name}</div>
                          <div className="text-xs text-slate-400">{c.college}{c.org ? ` · ${c.org}` : ""}</div>
                        </div>
                        <button onClick={() => { setEditCandidate({ id: c.id, name: c.name, college: c.college, org: c.org ?? "", platform: c.platform, positionId: pos.id }); setCandidateForm({ id: c.id, name: c.name, college: c.college, org: c.org ?? "", platform: c.platform, positionId: pos.id }); }}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setManagedPositions(ps => ps.map(p => p.id === pos.id ? { ...p, candidates: p.candidates.filter(x => x.id !== c.id) } : p))}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-[#DC2626] cursor-pointer transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    ))}
                    {pos.candidates.length === 0 && (
                      <div className="text-xs text-slate-400 py-3 px-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center">No candidates yet — add one above</div>
                    )}
                  </div>
                </div>
              ))}

              {/* Add Candidate Modal */}
              {showAddCandidate && (
                <Modal title="Add Candidate" onClose={() => setShowAddCandidate(false)} width="max-w-lg">
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-[#0F172A]">Position<span className="text-[#DC2626] ml-0.5">*</span></label>
                      <div className="relative">
                        <select value={candidateForm.positionId} onChange={e => setCandidateForm(f => ({ ...f, positionId: Number(e.target.value) }))}
                          className="w-full appearance-none px-3.5 py-2.5 pr-10 rounded-xl border border-slate-200 bg-white text-[#0F172A] text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]">
                          {managedPositions.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                    <Field label="Full Name" placeholder="Carlo Dela Cruz" value={candidateForm.name} onChange={v => setCandidateForm(f => ({ ...f, name: v }))} required />
                    <div className="grid grid-cols-2 gap-4">
                      <DropField label="College" value={candidateForm.college} onChange={v => setCandidateForm(f => ({ ...f, college: v }))} options={COLLEGES} placeholder="Select college" required />
                      <DropField label="Organization" value={candidateForm.org} onChange={v => setCandidateForm(f => ({ ...f, org: v }))} options={ORGS} placeholder="None" />
                    </div>
                    <Field label="Platform / Campaign Message" as="textarea" placeholder="Brief platform statement..." value={candidateForm.platform} onChange={v => setCandidateForm(f => ({ ...f, platform: v }))} />
                    <div>
                      <label className="text-sm font-medium text-[#0F172A] block mb-1.5">Candidate Photo</label>
                      <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-[#2563EB] transition-colors cursor-pointer">
                        <UserCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-sm text-slate-400">Click to upload photo</p>
                        <p className="text-xs text-slate-300 mt-0.5">JPG, PNG · Recommended 2:3 ratio</p>
                      </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <Btn variant="ghost" onClick={() => setShowAddCandidate(false)} className="flex-1">Cancel</Btn>
                      <Btn variant="primary" onClick={() => {
                        if (candidateForm.name && candidateForm.college) {
                          setManagedPositions(ps => ps.map(p => p.id === candidateForm.positionId ? { ...p, candidates: [...p.candidates, { id: Date.now(), name: candidateForm.name, college: candidateForm.college, org: candidateForm.org, platform: candidateForm.platform }] } : p));
                          setShowAddCandidate(false);
                        }
                      }} className="flex-1">Add Candidate</Btn>
                    </div>
                  </div>
                </Modal>
              )}

              {/* Edit Candidate Modal */}
              {editCandidate && (
                <Modal title="Edit Candidate" onClose={() => setEditCandidate(null)} width="max-w-lg">
                  <div className="flex flex-col gap-4">
                    <Field label="Full Name" value={candidateForm.name} onChange={v => setCandidateForm(f => ({ ...f, name: v }))} required />
                    <div className="grid grid-cols-2 gap-4">
                      <DropField label="College" value={candidateForm.college} onChange={v => setCandidateForm(f => ({ ...f, college: v }))} options={COLLEGES} required />
                      <DropField label="Organization" value={candidateForm.org} onChange={v => setCandidateForm(f => ({ ...f, org: v }))} options={ORGS} placeholder="None" />
                    </div>
                    <Field label="Platform / Campaign Message" as="textarea" value={candidateForm.platform} onChange={v => setCandidateForm(f => ({ ...f, platform: v }))} />
                    <div>
                      <label className="text-sm font-medium text-[#0F172A] block mb-1.5">Candidate Photo</label>
                      <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-[#2563EB] transition-colors cursor-pointer">
                        <UserCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-sm text-slate-400">Click to replace photo</p>
                      </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <Btn variant="ghost" onClick={() => setEditCandidate(null)} className="flex-1">Cancel</Btn>
                      <Btn variant="primary" onClick={() => {
                        setManagedPositions(ps => ps.map(p => ({
                          ...p,
                          candidates: p.candidates.map(c => c.id === editCandidate.id ? { ...c, name: candidateForm.name, college: candidateForm.college, org: candidateForm.org, platform: candidateForm.platform } : c)
                        })));
                        setEditCandidate(null);
                      }} className="flex-1">Save Changes</Btn>
                    </div>
                  </div>
                </Modal>
              )}
            </div>
          )}
          {activeTab === "positions" && (
            <div className="w-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-[#0F172A] text-sm">Positions</h3>
                <Btn size="sm" variant="primary" onClick={() => { setPositionForm({ title: "", college: "" }); setShowAddPosition(true); }}><Plus className="w-3.5 h-3.5" /> Add Position</Btn>
              </div>
              <div className="flex flex-col gap-2">
                {managedPositions.map((p, i) => (
                  <div key={p.id} className="bg-white rounded-xl border border-slate-100 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-[#0A2540] flex items-center justify-center text-white text-[10px] font-bold">{i + 1}</div>
                      <div>
                        <div className="font-medium text-[#0F172A] text-sm">{p.title}</div>
                        <div className="text-xs text-slate-400">{p.candidates.length} candidates</div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => { setEditPosition({ id: p.id, title: p.title, college: (p as any).college ?? "" }); setPositionForm({ id: p.id, title: p.title, college: (p as any).college ?? "" }); }}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setManagedPositions(ps => ps.filter(x => x.id !== p.id))}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-[#DC2626] cursor-pointer transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Position Modal */}
              {showAddPosition && (
                <Modal title="Add Position" onClose={() => setShowAddPosition(false)}>
                  <div className="flex flex-col gap-4">
                    <Field label="Position Name" placeholder="e.g. President, CCS Representative" value={positionForm.title} onChange={v => setPositionForm(f => ({ ...f, title: v }))} required />
                    <DropField label="College Restriction (optional)" value={positionForm.college} onChange={v => setPositionForm(f => ({ ...f, college: v }))} options={COLLEGES} placeholder="All colleges (no restriction)" />
                    <div className="flex gap-3 pt-2">
                      <Btn variant="ghost" onClick={() => setShowAddPosition(false)} className="flex-1">Cancel</Btn>
                      <Btn variant="primary" onClick={() => {
                        if (positionForm.title) {
                          setManagedPositions(ps => [...ps, { id: Date.now(), title: positionForm.title, ...(positionForm.college ? { college: positionForm.college } : {}), candidates: [] }]);
                          setShowAddPosition(false);
                        }
                      }} className="flex-1">Add Position</Btn>
                    </div>
                  </div>
                </Modal>
              )}

              {/* Edit Position Modal */}
              {editPosition && (
                <Modal title="Edit Position" onClose={() => setEditPosition(null)}>
                  <div className="flex flex-col gap-4">
                    <Field label="Position Name" value={positionForm.title} onChange={v => setPositionForm(f => ({ ...f, title: v }))} required />
                    <DropField label="College Restriction (optional)" value={positionForm.college} onChange={v => setPositionForm(f => ({ ...f, college: v }))} options={COLLEGES} placeholder="All colleges (no restriction)" />
                    <div className="flex gap-3 pt-2">
                      <Btn variant="ghost" onClick={() => setEditPosition(null)} className="flex-1">Cancel</Btn>
                      <Btn variant="primary" onClick={() => {
                        setManagedPositions(ps => ps.map(p => p.id === editPosition.id ? { ...p, title: positionForm.title } : p));
                        setEditPosition(null);
                      }} className="flex-1">Save Changes</Btn>
                    </div>
                  </div>
                </Modal>
              )}
            </div>
          )}
          {activeTab === "results" && (
            <div className="w-full">
              {[{ position: "President", data: presidentResults }, { position: "Vice President", data: vpResults }, { position: "Secretary", data: secretaryResults }].map((r) => (
                <div key={r.position} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-[#0F172A] text-sm">{r.position}</h3>
                    <span className="text-xs text-slate-400 font-mono">{r.data.reduce((a, c) => a + c.votes, 0).toLocaleString()} votes</span>
                  </div>
                  <div className="flex flex-col gap-4">
                    {[...r.data].sort((a, b) => b.votes - a.votes).map((c, i) => {
                      const isAbstain = c.name === "Abstain";
                      return (
                      <div key={c.name}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            {!isAbstain && i === 0 && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                            <span className={`text-sm font-medium ${isAbstain ? "text-slate-400 italic" : "text-[#0F172A]"}`}>{c.name}</span>
                            {isAbstain && <span className="text-[10px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded font-medium">abstain</span>}
                          </div>
                          <span className={`text-sm font-bold font-mono ${isAbstain ? "text-slate-400" : ""}`}>{c.percentage}%</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${c.percentage}%`, backgroundColor: c.color, opacity: isAbstain ? 0.5 : 1 }} />
                        </div>
                      </div>
                    );})}
                  </div>
                </div>
              ))}
            </div>
          )}
          {activeTab === "settings" && (
            <div className="w-full">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col gap-4">
                <h3 className="font-semibold text-[#0F172A] text-sm">Election Settings</h3>
                <DropField label="Result Visibility" value={selected.visibility} onChange={() => {}} options={["Live Results", "Hidden Results", "Scheduled Release", "Partial Results", "Manual Release"]} />
                <DropField label="Eligibility" value={selected.eligibility} onChange={() => {}} options={["All Students", "CCS Students", "CBA Students", "CED Students", "CHSS Students", "CON Students", "COL Students", "JPCS Members"]} />
                <div className="pt-2"><Btn variant="primary" size="sm">Save Settings</Btn></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── ADMIN ORGANIZATIONS ──────────────────────────────────────────────────────

function AdminOrganizations() {
  const initialOrgs = ORGS.map((name, i) => ({
    id: i + 1, name,
    desc: ["Computer Science Society", "Junior Philippine Computer Society", "Photography & Film Arts", "The Pillars Publication", "Debate Society", "Leadership & Empowerment", "Guidance & Advocacy", "Tactical Studies"][i],
    status: i === 7 ? "inactive" : "active",
    members: [145, 312, 87, 64, 43, 98, 76, 54][i],
  }));
  const [orgs, setOrgs] = useState(initialOrgs);
  const [editOrg, setEditOrg] = useState<typeof initialOrgs[0] | null>(null);
  const [deleteOrg, setDeleteOrg] = useState<typeof initialOrgs[0] | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newOrg, setNewOrg] = useState({ name: "", desc: "" });

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#0F172A]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Organizations</h1>
        <Btn variant="primary" size="sm" onClick={() => setShowAdd(true)}><Plus className="w-4 h-4" /> Add</Btn>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {orgs.map((org) => (
          <div key={org.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-all">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-[#0A2540] flex items-center justify-center text-white text-xs font-bold">{org.name.slice(0, 2)}</div>
              <StatusBadge status={org.status} />
            </div>
            <h3 className="font-semibold text-[#0F172A] text-sm mb-0.5">{org.name}</h3>
            <p className="text-xs text-slate-500 mb-3 line-clamp-1">{org.desc}</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-mono">{org.members} members</span>
              <div className="flex gap-1">
                <button onClick={() => setEditOrg({ ...org })} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"><Edit2 className="w-3.5 h-3.5" /></button>
                <button onClick={() => setOrgs((os) => os.map((o) => o.id === org.id ? { ...o, status: o.status === "active" ? "inactive" : "active" } : o))} className="p-1.5 rounded-lg hover:bg-amber-50 text-slate-400 hover:text-amber-600 transition-colors cursor-pointer"><Archive className="w-3.5 h-3.5" /></button>
                <button onClick={() => setDeleteOrg(org)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-[#DC2626] transition-colors cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {showAdd && (
        <Modal title="Add Organization" onClose={() => setShowAdd(false)}>
          <div className="flex flex-col gap-4">
            <Field label="Organization Name" placeholder="e.g. CSS" value={newOrg.name} onChange={(v) => setNewOrg((f) => ({ ...f, name: v }))} required />
            <Field label="Description" placeholder="Brief description..." value={newOrg.desc} onChange={(v) => setNewOrg((f) => ({ ...f, desc: v }))} as="textarea" />
            <div className="flex gap-3 pt-2">
              <Btn variant="ghost" onClick={() => setShowAdd(false)} className="flex-1">Cancel</Btn>
              <Btn variant="primary" onClick={() => { if (newOrg.name) { setOrgs((os) => [...os, { id: Date.now(), name: newOrg.name, desc: newOrg.desc, status: "active", members: 0 }]); setShowAdd(false); setNewOrg({ name: "", desc: "" }); } }} className="flex-1">Create</Btn>
            </div>
          </div>
        </Modal>
      )}
      {editOrg && (
        <Modal title="Edit Organization" onClose={() => setEditOrg(null)}>
          <div className="flex flex-col gap-4">
            <Field label="Organization Name" value={editOrg.name} onChange={(v) => setEditOrg((o) => o ? { ...o, name: v } : null)} required />
            <Field label="Description" value={editOrg.desc} onChange={(v) => setEditOrg((o) => o ? { ...o, desc: v } : null)} as="textarea" />
            <div className="flex gap-3 pt-2">
              <Btn variant="ghost" onClick={() => setEditOrg(null)} className="flex-1">Cancel</Btn>
              <Btn variant="primary" onClick={() => { setOrgs((os) => os.map((o) => o.id === editOrg!.id ? editOrg! : o)); setEditOrg(null); }} className="flex-1">Save Changes</Btn>
            </div>
          </div>
        </Modal>
      )}
      {deleteOrg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
            <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mb-4"><Trash2 className="w-6 h-6 text-[#DC2626]" /></div>
            <h3 className="text-lg font-bold text-[#0F172A] mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Delete Organization?</h3>
            <p className="text-slate-500 text-sm mb-6">Are you sure you want to delete <strong>{deleteOrg.name}</strong>? This action cannot be undone.</p>
            <div className="flex gap-3">
              <Btn variant="ghost" onClick={() => setDeleteOrg(null)} className="flex-1">Cancel</Btn>
              <Btn variant="danger" onClick={() => { setOrgs((os) => os.filter((o) => o.id !== deleteOrg!.id)); setDeleteOrg(null); }} className="flex-1">Confirm Delete</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ELECTION CREATE WIZARD ───────────────────────────────────────────────────

function ElectionCreate({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState(1);
  const TOTAL = 5;
  const [form, setForm] = useState({ title: "", description: "", openDate: "", openTime: "", closeDate: "", closeTime: "", eligibility: "all", colleges: [] as string[], visibility: "live", positions: ["President", "Vice President", "Secretary"] });
  const [customPos, setCustomPos] = useState("");
  const stepLabels = ["Details", "Schedule", "Eligibility", "Visibility", "Positions"];
  const PRESET_POSITIONS = ["President", "Vice President", "Secretary", "Treasurer", "Auditor", "Public Relations Officer", "Business Manager", "Public Information Officer", "Logistics Coordinator", "Year Level Representative", "Program Representative", "Board Member", "Senator", "CCS Representative", "CBA Representative", "CED Representative", "CHSS Representative", "CON Representative", "COL Representative"];
  const addCustomPosition = () => { const val = customPos.trim(); if (val && !form.positions.includes(val)) { setForm((f) => ({ ...f, positions: [...f.positions, val] })); setCustomPos(""); } };

  const stepContent = () => {
    switch (step) {
      case 1: return (
        <div className="flex flex-col gap-5">
          <Field label="Election Title" placeholder="Ateneo Student Government Elections 2025" value={form.title} onChange={(v) => setForm((f) => ({ ...f, title: v }))} required />
          <Field label="Description" as="textarea" placeholder="Brief description..." value={form.description} onChange={(v) => setForm((f) => ({ ...f, description: v }))} required />
          <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:border-[#2563EB] transition-colors cursor-pointer">
            <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" /><p className="text-sm text-slate-400">Click to upload election banner</p><p className="text-xs text-slate-300 mt-1">PNG, JPG up to 5MB</p>
          </div>
        </div>
      );
      case 2: return (
        <div className="grid grid-cols-2 gap-4">
          <Field label="Opening Date" type="date" value={form.openDate} onChange={(v) => setForm((f) => ({ ...f, openDate: v }))} required />
          <Field label="Opening Time" type="time" value={form.openTime} onChange={(v) => setForm((f) => ({ ...f, openTime: v }))} required />
          <Field label="Closing Date" type="date" value={form.closeDate} onChange={(v) => setForm((f) => ({ ...f, closeDate: v }))} required />
          <Field label="Closing Time" type="time" value={form.closeTime} onChange={(v) => setForm((f) => ({ ...f, closeTime: v }))} required />
        </div>
      );
      case 3: return (
        <div className="flex flex-col gap-3">
          {[{ id: "all", label: "All Students", desc: "Open to all enrolled students" }, { id: "college", label: "College-Based", desc: "Restricted to specific colleges" }, { id: "org", label: "Organization-Based", desc: "Members of selected organizations only" }].map((opt) => (
            <label key={opt.id} className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${form.eligibility === opt.id ? "border-[#2563EB] bg-blue-50" : "border-slate-200 hover:border-slate-300"}`}>
              <input type="radio" name="elig" checked={form.eligibility === opt.id} onChange={() => setForm((f) => ({ ...f, eligibility: opt.id }))} className="mt-0.5" />
              <div><div className="text-sm font-medium text-[#0F172A]">{opt.label}</div><div className="text-xs text-slate-500 mt-0.5">{opt.desc}</div></div>
            </label>
          ))}
          {form.eligibility === "college" && (
            <div className="flex flex-wrap gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
              {COLLEGES.map((c) => (
                <label key={c} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.colleges.includes(c)} onChange={(e) => setForm((f) => ({ ...f, colleges: e.target.checked ? [...f.colleges, c] : f.colleges.filter((x) => x !== c) }))} />
                  <span className="text-sm font-medium text-slate-700">{c}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      );
      case 4: return (
        <div className="flex flex-col gap-3">
          {[{ id: "live", label: "Live Results", desc: "Results visible as votes are cast" }, { id: "hidden", label: "Hidden Results", desc: "Results hidden until manually released" }, { id: "scheduled", label: "Scheduled Release", desc: "Results released at a set date and time" }, { id: "partial", label: "Partial Results", desc: "Show turnout only, hide candidate counts" }, { id: "manual", label: "Manual Release", desc: "Admin releases results manually" }].map((opt) => (
            <label key={opt.id} className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${form.visibility === opt.id ? "border-[#2563EB] bg-blue-50" : "border-slate-200 hover:border-slate-300"}`}>
              <input type="radio" name="vis" checked={form.visibility === opt.id} onChange={() => setForm((f) => ({ ...f, visibility: opt.id }))} className="mt-0.5" />
              <div><div className="text-sm font-medium text-[#0F172A]">{opt.label}</div><div className="text-xs text-slate-500 mt-0.5">{opt.desc}</div></div>
            </label>
          ))}
        </div>
      );
      case 5: return (
        <div className="flex flex-col gap-5">
          <div>
            <label className="text-sm font-medium text-[#0F172A] block mb-2">Current Positions</label>
            <div className="flex flex-wrap gap-2 min-h-10 p-3 bg-slate-50 rounded-xl border border-slate-200">
              {form.positions.length === 0 && <span className="text-xs text-slate-400 self-center">No positions added yet</span>}
              {form.positions.map((p, i) => (
                <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0A2540] text-white text-xs font-medium">
                  {p}
                  <button onClick={() => setForm((f) => ({ ...f, positions: f.positions.filter((_, j) => j !== i) }))} className="text-white/60 hover:text-white cursor-pointer ml-0.5"><X className="w-3 h-3" /></button>
                </div>
              ))}
            </div>
          </div>
          <DropField label="Add from Suggestions" value="" onChange={(v) => { if (v && !form.positions.includes(v)) setForm((f) => ({ ...f, positions: [...f.positions, v] })); }} options={PRESET_POSITIONS.filter((p) => !form.positions.includes(p))} placeholder="Select a preset position..." />
          <div>
            <label className="text-sm font-medium text-[#0F172A] block mb-1.5">Add Custom Position</label>
            <div className="flex gap-2">
              <input placeholder="e.g. Business Manager, Senator, PRO..." value={customPos} onChange={(e) => setCustomPos(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomPosition(); } }} className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-[#0F172A] placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-all" />
              <Btn variant="secondary" size="sm" onClick={addCustomPosition} disabled={!customPos.trim()}><Plus className="w-4 h-4" /> Add</Btn>
            </div>
            <p className="text-xs text-slate-400 mt-1.5">Press Enter or click Add to include a custom position</p>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={onBack} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors cursor-pointer"><ChevronLeft className="w-5 h-5" /></button>
        <div><h1 className="text-2xl font-bold text-[#0F172A]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Create Election</h1><p className="text-slate-500 text-sm">Step {step} of {TOTAL} · {stepLabels[step - 1]}</p></div>
      </div>
      <div className="flex items-center gap-2 mb-8">
        {stepLabels.map((s, i) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all ${i + 1 < step ? "bg-emerald-500 text-white" : i + 1 === step ? "bg-[#0A2540] text-white" : "bg-slate-200 text-slate-400"}`}>{i + 1 < step ? <Check className="w-3.5 h-3.5" /> : i + 1}</div>
            {i < stepLabels.length - 1 && <div className={`flex-1 h-0.5 transition-all ${i + 1 < step ? "bg-emerald-500" : "bg-slate-200"}`} />}
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 mb-6">
        <h2 className="text-sm font-semibold text-[#0F172A] mb-6">{stepLabels[step - 1]}</h2>
        {stepContent()}
      </div>
      <div className="flex justify-between">
        <Btn variant="ghost" onClick={() => step > 1 ? setStep((s) => s - 1) : onBack()} className="text-slate-600">{step === 1 ? "Cancel" : "Back"}</Btn>
        <Btn variant="primary" onClick={() => step < TOTAL ? setStep((s) => s + 1) : onBack()}>{step === TOTAL ? "Create Election" : "Continue"} <ChevronRight className="w-4 h-4" /></Btn>
      </div>
    </div>
  );
}

// ─── CANDIDATES ANALYTICS TAB (extracted to satisfy React hook rules) ─────────

function CandidatesAnalyticsTab() {
  const positionNames = Object.keys(positionAnalyticsData);
  const [selPos, setSelPos] = useState(positionNames[0]);
  const posData = positionAnalyticsData[selPos] ?? [];
  const totalVotes = posData.reduce((a, c) => a + c.votes, 0);

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Position selector */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest shrink-0">Position</span>
        <div className="flex gap-1.5 flex-wrap">
          {positionNames.map(name => (
            <button key={name} onClick={() => setSelPos(name)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${selPos === name ? "bg-[#0A2540] text-white" : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300"}`}>
              {name}
            </button>
          ))}
        </div>
      </div>

      {/* Head-to-head summary */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-[#0F172A] text-sm">{selPos} — Candidate Comparison</h3>
          <span className="text-xs text-slate-400 font-mono">{totalVotes.toLocaleString()} votes cast</span>
        </div>
        <div className="flex flex-wrap gap-3 mb-6">
          {posData.map((c, i) => (
            <div key={c.name} className={`flex-1 min-w-[130px] p-4 rounded-xl border-2 ${i === 0 ? "border-[#2563EB] bg-blue-50" : "border-slate-200 bg-slate-50"}`}>
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0" style={{ backgroundColor: c.color }}>{initials(c.name)}</div>
                <div className="min-w-0">
                  <div className="font-bold text-[#0F172A] text-xs truncate">{c.name}</div>
                  {c.rank === 1 && <div className="text-[10px] text-emerald-600 font-bold">● Leading</div>}
                </div>
              </div>
              <div className="flex items-end gap-1 mt-2">
                <span className="text-xl font-bold font-[JetBrains_Mono,monospace] text-[#0F172A]">{c.percentage}%</span>
                <span className="text-slate-400 text-[10px] mb-0.5">{c.votes.toLocaleString()}v</span>
              </div>
            </div>
          ))}
        </div>
        {/* Stacked bar */}
        <div className="h-4 rounded-full overflow-hidden flex gap-0.5">
          {posData.map(c => (
            <div key={c.name} className="h-full rounded-sm transition-all duration-700" title={`${c.name}: ${c.percentage}%`}
              style={{ width: `${c.percentage}%`, backgroundColor: c.color, opacity: c.name === "Abstain" ? 0.4 : 1 }} />
          ))}
        </div>
        <div className="flex flex-wrap gap-3 mt-3">
          {posData.map(c => (
            <div key={c.name} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: c.color }} />
              <span className="text-[11px] text-slate-500">{c.name} <span className="font-bold">{c.percentage}%</span></span>
            </div>
          ))}
        </div>
      </div>

      {/* College support breakdown */}
      {posData.filter(c => c.name !== "Abstain").length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="font-semibold text-[#0F172A] text-sm mb-5">College-Based Support Distribution</h3>
          <div className="overflow-x-auto">
            <div style={{ minWidth: 320 }}>
              <ResponsiveContainer width="100%" height={posData.length > 2 ? 300 : 240}>
                <BarChart data={analyticsCollegeData.map(col => ({
                  college: col.college,
                  ...Object.fromEntries(posData.filter(c => c.name !== "Abstain").map(c => [c.name.split(" ")[0], c.byCollege.find(b => b.college === col.college)?.support ?? 0])),
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="college" tick={{ fontSize: 10, fill: "#94A3B8" }} />
                  <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} tickFormatter={v => `${v}%`} />
                  <Tooltip formatter={(v: number) => [`${v}%`, "Support"]} contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E2E8F0" }} />
                  <Legend formatter={(v) => <span style={{ fontSize: 11, color: "#64748B" }}>{v}</span>} />
                  {posData.filter(c => c.name !== "Abstain").map(c => (
                    <Bar key={c.name} dataKey={c.name.split(" ")[0]} fill={c.color} radius={[3, 3, 0, 0]} name={c.name} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Per-candidate breakdown cards */}
      <div className="grid sm:grid-cols-2 gap-5">
        {posData.filter(c => c.name !== "Abstain").map(c => (
          <div key={c.name} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shrink-0" style={{ backgroundColor: c.color }}>{initials(c.name)}</div>
              <div className="min-w-0">
                <div className="font-bold text-[#0F172A] truncate">{c.name}</div>
                <div className="text-xs text-slate-400">Rank #{c.rank} · {c.votes.toLocaleString()} votes · {c.percentage}%</div>
              </div>
            </div>
            <div className="mb-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Strongest Colleges</p>
              {[...c.byCollege].sort((a, b) => b.support - a.support).slice(0, 3).map(b => (
                <div key={b.college} className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-slate-600">{b.college}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${b.support}%`, backgroundColor: c.color }} /></div>
                    <span className="text-xs font-bold font-mono" style={{ color: c.color }}>{b.support}%</span>
                  </div>
                </div>
              ))}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">By Year Level</p>
              {c.byYear.map(b => (
                <div key={b.year} className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-slate-600">{b.year} Year</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${b.pct}%`, backgroundColor: c.color }} /></div>
                    <span className="text-xs font-bold font-mono" style={{ color: c.color }}>{b.pct}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Abstain summary */}
      {posData.find(c => c.name === "Abstain") && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-slate-200 flex items-center justify-center shrink-0">
            <span className="text-slate-500 text-lg font-light">—</span>
          </div>
          <div>
            <div className="font-semibold text-slate-700 text-sm mb-1">Abstain — {selPos}</div>
            <div className="text-2xl font-bold font-mono text-slate-600">
              {posData.find(c => c.name === "Abstain")?.percentage}%
              <span className="text-base text-slate-400 font-normal ml-2">
                ({posData.find(c => c.name === "Abstain")?.votes.toLocaleString()} voters)
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1.5">
              These voters intentionally chose not to support any listed candidate. Abstain is a valid vote, distinct from a blank ballot.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ANALYTICS PAGE ───────────────────────────────────────────────────────────

const CHART_COLORS = ["#2563EB", "#7C3AED", "#059669", "#D97706", "#DC2626", "#0891B2", "#64748B"];

function AnalyticsPage() {
  const [selectedElId, setSelectedElId] = useState(elections[0].id);
  const [activeTab, setActiveTab] = useState("overview");
  const [compareElId, setCompareElId] = useState(elections[3].id);
  const [tick, setTick] = useState(0);
  const [showExportModal, setShowExportModal] = useState(false);

  useEffect(() => {
    if (elections.find(e => e.id === selectedElId)?.status === "active") {
      const t = setInterval(() => setTick(n => n + 5), 5000);
      return () => clearInterval(t);
    }
  }, [selectedElId]);

  const sel = elections.find(e => e.id === selectedElId) ?? elections[0];
  const isLive = sel.status === "active";

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "demographics", label: "Demographics" },
    { id: "candidates", label: "Candidates" },
    { id: "timeline", label: "Timeline" },
    { id: "health", label: "Health" },
    { id: "compare", label: "Compare" },
  ];

  const summaryMetrics = [
    { label: "Eligible Voters", value: "3,500", delta: 8.2, sub: "Total registered", icon: Users2 },
    { label: "Votes Cast", value: "2,947", delta: 12.1, sub: "Ballots submitted", icon: Vote },
    { label: "Participation Rate", value: "84.2%", delta: 5.4, sub: "vs. 78.8% last year", icon: TrendingUp },
    { label: "Abstention Rate", value: "15.8%", delta: -5.4, sub: "Non-voters (no selection)", icon: Activity },
    { label: "Candidates", value: "12", sub: "Across 4 positions", icon: UserCircle },
    { label: "Positions", value: "4", sub: "Open for voting", icon: FileText },
    { label: "Duration", value: "48 hrs", sub: "Jun 25–27, 2025", icon: Clock },
    { label: "Avg. Vote Time", value: "4.2 min", sub: "Per voter session", icon: Zap },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 lg:px-6 py-4 shrink-0">
        <div className="flex flex-col gap-3 mb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                <h1 className="text-lg font-bold text-[#0F172A]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Election Analytics</h1>
                {isLive && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" /> LIVE</span>}
              </div>
              <p className="text-xs text-slate-400 truncate">
                {isLive ? `Updated ${tick === 0 ? "just now" : `${tick}s ago`}` : "Historical data"}
              </p>
            </div>
            <Btn variant="ghost" size="sm" onClick={() => setShowExportModal(true)} className="text-slate-600 border border-slate-200 shrink-0 hidden sm:inline-flex">
              <Download className="w-4 h-4" /> Export
            </Btn>
          </div>
          {/* Election selector — full width on mobile */}
          <div className="relative">
            <select value={selectedElId} onChange={(e) => { setSelectedElId(Number(e.target.value)); setTick(0); setActiveTab("overview"); }}
              className="w-full appearance-none pl-3.5 pr-9 py-2.5 rounded-xl border border-slate-200 bg-white text-[#0F172A] text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]">
              {elections.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${activeTab === tab.id ? "bg-[#0A2540] text-white" : "text-slate-500 hover:text-[#0F172A] hover:bg-slate-100"}`}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 bg-[#F8FAFC]">

        {/* ── OVERVIEW ─────────────────────────────────────────────────────── */}
        {activeTab === "overview" && (
          <div className="max-w-6xl mx-auto space-y-5">
            {/* 8 metric cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {summaryMetrics.map(m => <AnalyticCard key={m.label} {...m} />)}
            </div>

            {/* College bars + Voting trend */}
            <div className="grid lg:grid-cols-5 gap-5">
              <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-semibold text-[#0F172A] text-sm">Participation by College</h3>
                  <span className="text-xs text-slate-400">% of eligible voters</span>
                </div>
                <div className="flex flex-col gap-3">
                  {analyticsCollegeData.map((d) => (
                    <div key={d.college}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-semibold text-[#0F172A]">{d.college}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-slate-400 font-mono">{d.votes.toLocaleString()} votes</span>
                          <span className="text-xs font-bold text-[#0F172A] w-10 text-right font-mono">{d.rate}%</span>
                        </div>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${d.rate}%`, backgroundColor: d.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <h3 className="font-semibold text-[#0F172A] text-sm mb-1">College Distribution</h3>
                <p className="text-xs text-slate-400 mb-4">Share of total votes cast</p>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={analyticsCollegeData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="votes" paddingAngle={3}>
                      {analyticsCollegeData.map((entry, i) => <Cell key={i} fill={entry.color} stroke="none" />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => [v.toLocaleString(), "Votes"]} contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E2E8F0" }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                  {analyticsCollegeData.map(d => (
                    <div key={d.college} className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                      <span className="text-[10px] text-slate-500">{d.college}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Key insights strip */}
            <div className="bg-[#0A2540] rounded-2xl p-6 text-white">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-4 h-4 text-[#60A5FA]" />
                <h3 className="font-semibold text-sm">Key Insights</h3>
                {isLive && <span className="ml-auto text-[10px] text-emerald-400 font-bold">● Updating live</span>}
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { value: "12:00–2:00 PM", label: "Peak voting window", sub: "35% of all votes cast" },
                  { value: "72%", label: "Voted in 24 hrs", sub: "Of final total" },
                  { value: "6.8%", label: "Avg. abstain rate", sub: "Across all positions" },
                  { value: "COL", label: "Lowest participation", sub: "50.0% turnout rate" },
                ].map(s => (
                  <div key={s.label} className="bg-white/8 rounded-xl p-4">
                    <div className="text-xl font-bold text-white font-[JetBrains_Mono,monospace]">{s.value}</div>
                    <div className="text-xs font-medium text-slate-200 mt-1">{s.label}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{s.sub}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── DEMOGRAPHICS ─────────────────────────────────────────────────── */}
        {activeTab === "demographics" && (
          <div className="max-w-6xl mx-auto space-y-5">
            {/* College ranked table */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h3 className="font-semibold text-[#0F172A] text-sm">Participation by College — Ranked</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      {["Rank", "College", "Full Name", "Votes Cast", "Eligible", "Turnout", "Vs. Average"].map(h => (
                        <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...analyticsCollegeData].sort((a, b) => b.rate - a.rate).map((d, i) => {
                      const avg = 75;
                      const diff = d.rate - avg;
                      return (
                        <tr key={d.college} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                          <td className="px-5 py-3.5 font-bold text-slate-400 font-mono text-xs">#{i + 1}</td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                              <span className="font-bold text-[#0F172A] text-sm">{d.college}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-slate-500 text-xs">{d.fullName}</td>
                          <td className="px-5 py-3.5 font-mono font-medium text-[#0F172A]">{d.votes.toLocaleString()}</td>
                          <td className="px-5 py-3.5 font-mono text-slate-500">{d.eligible.toLocaleString()}</td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2">
                              <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${d.rate}%`, backgroundColor: d.color }} /></div>
                              <span className="font-bold font-mono text-xs text-[#0F172A]">{d.rate}%</span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${diff > 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
                              {diff > 0 ? "+" : ""}{diff.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Year Level */}
            <div className="grid lg:grid-cols-2 gap-5">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <h3 className="font-semibold text-[#0F172A] text-sm mb-5">Participation by Year Level</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={analyticsYearData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis dataKey="year" tick={{ fontSize: 10, fill: "#94A3B8" }} />
                    <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} domain={[0, 100]} tickFormatter={v => `${v}%`} />
                    <Tooltip formatter={(v: number) => [`${v}%`, "Turnout"]} contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E2E8F0" }} />
                    <Bar dataKey="rate" radius={[4, 4, 0, 0]}>
                      {analyticsYearData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <h3 className="font-semibold text-[#0F172A] text-sm mb-1">Year Level Breakdown</h3>
                <p className="text-xs text-slate-400 mb-4">Votes cast by academic year</p>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={analyticsYearData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="votes" paddingAngle={2}>
                      {analyticsYearData.map((entry, i) => <Cell key={i} fill={entry.color} stroke="none" />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => [v.toLocaleString(), "Votes"]} contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E2E8F0" }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {analyticsYearData.map(d => (
                    <div key={d.year} className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                      <span className="text-[10px] text-slate-500">{d.year} <span className="font-bold text-slate-700">{d.rate}%</span></span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Organization participation */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h3 className="font-semibold text-[#0F172A] text-sm">Organization Participation — Ranked by Rate</h3>
              </div>
              <div className="divide-y divide-slate-50">
                {[...analyticsOrgData].sort((a, b) => b.rate - a.rate).map((o, i) => (
                  <div key={o.org} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors">
                    <span className="text-xs font-bold text-slate-400 font-mono w-5 shrink-0">#{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-semibold text-[#0F172A]">{o.org}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-slate-400">{o.votes}/{o.members} members</span>
                          <span className="text-xs font-bold text-[#0F172A] font-mono">{o.rate}%</span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-[#2563EB] transition-all" style={{ width: `${o.rate}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Program breakdown */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h3 className="font-semibold text-[#0F172A] text-sm">Participation by Academic Program</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      {["Program", "Votes Cast", "Eligible", "Turnout"].map(h => (
                        <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {programData.map((p) => (
                      <tr key={p.program} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-3.5 font-medium text-[#0F172A] text-sm">{p.program}</td>
                        <td className="px-5 py-3.5 font-mono text-slate-600">{p.votes.toLocaleString()}</td>
                        <td className="px-5 py-3.5 font-mono text-slate-400">{p.eligible.toLocaleString()}</td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-[#2563EB] rounded-full" style={{ width: `${p.rate}%` }} />
                            </div>
                            <span className="text-xs font-bold font-mono text-[#0F172A]">{p.rate}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── CANDIDATES ───────────────────────────────────────────────────── */}
        {activeTab === "candidates" && <CandidatesAnalyticsTab />}

        {/* ── TIMELINE ─────────────────────────────────────────────────────── */}
        {activeTab === "timeline" && (
          <div className="max-w-5xl mx-auto space-y-5">
            {/* Hourly votes */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-semibold text-[#0F172A] text-sm">Votes Per Hour</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Day 1 voting activity</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-[#2563EB] font-medium">
                  <Zap className="w-3.5 h-3.5" /> Peak: 12 PM (521 votes)
                </div>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={hourlyVotingData}>
                  <defs>
                    <linearGradient id="hvg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="time" tick={{ fontSize: 11, fill: "#94A3B8" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E2E8F0" }} />
                  <Area type="monotone" dataKey="votes" stroke="#2563EB" strokeWidth={2.5} fill="url(#hvg)" name="Votes/hr" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Cumulative */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-semibold text-[#0F172A] text-sm">Cumulative Votes</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Running total throughout election day</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={hourlyVotingData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="time" tick={{ fontSize: 11, fill: "#94A3B8" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E2E8F0" }} />
                  <Line type="monotone" dataKey="cumulative" stroke="#0A2540" strokeWidth={2.5} dot={false} name="Cumulative" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Insight cards */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { icon: TrendingUp, color: "bg-blue-50 text-[#2563EB]", title: "Peak Voting Window", body: "Highest activity between 12:00 PM and 2:00 PM with 1,008 votes — 34% of the daily total." },
                { icon: Zap, color: "bg-amber-50 text-amber-600", title: "First-Day Surge", body: "72% of all votes were cast during the first 24 hours of the election window." },
                { icon: Activity, color: "bg-emerald-50 text-emerald-600", title: "Morning Engagement", body: "9 AM saw a sharp spike of 285 votes, indicating strong awareness among morning students." },
              ].map(s => (
                <div key={s.title} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${s.color}`}>
                    <s.icon className="w-5 h-5" />
                  </div>
                  <div className="font-semibold text-[#0F172A] text-sm mb-1.5">{s.title}</div>
                  <p className="text-xs text-slate-500 leading-relaxed">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── HEALTH ───────────────────────────────────────────────────────── */}
        {activeTab === "health" && (
          <div className="max-w-4xl mx-auto space-y-5">
            {/* Health metric cards */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { label: "Participation Rate", value: "84.2%", status: "excellent", icon: TrendingUp, note: "Above 80% target" },
                { label: "Incomplete Ballots", value: "0.8%", status: "good", icon: FileText, note: "28 incomplete of 2,975" },
                { label: "Abandoned Sessions", value: "2.1%", status: "good", icon: Activity, note: "62 abandoned sessions" },
                { label: "Avg. Completion Time", value: "4.2 min", status: "excellent", icon: Clock, note: "Within expected range" },
                { label: "Repeat Login Attempts", value: "14", status: "warning", icon: Shield, note: "Under investigation" },
                { label: "Invalid Access Attempts", value: "3", status: "good", icon: ShieldCheck, note: "All blocked successfully" },
              ].map(m => {
                const statusMap: Record<string, string> = { excellent: "bg-emerald-50 text-emerald-700 border-emerald-200", good: "bg-blue-50 text-blue-700 border-blue-200", warning: "bg-amber-50 text-amber-700 border-amber-200" };
                const statusLabel: Record<string, string> = { excellent: "Excellent", good: "Good", warning: "Monitor" };
                return (
                  <div key={m.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                    <div className="flex items-start justify-between mb-3">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{m.label}</p>
                      <m.icon className="w-4 h-4 text-slate-400 shrink-0" />
                    </div>
                    <div className="text-2xl font-bold text-[#0F172A] font-[JetBrains_Mono,monospace] mb-2">{m.value}</div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">{m.note}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusMap[m.status]}`}>{statusLabel[m.status]}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Overall health score */}
            <div className="bg-[#0A2540] rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-sm">Overall Election Health Score</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Based on participation, integrity, and completion metrics</p>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold font-[JetBrains_Mono,monospace]">94<span className="text-2xl text-slate-400">/100</span></div>
                  <div className="text-emerald-400 text-xs font-bold mt-1">● Excellent</div>
                </div>
              </div>
              <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-400 rounded-full" style={{ width: "94%" }} />
              </div>
              <div className="grid grid-cols-3 gap-4 mt-5">
                {[
                  { label: "Integrity Score", value: "98/100" },
                  { label: "Participation Score", value: "91/100" },
                  { label: "Completion Score", value: "96/100" },
                ].map(s => (
                  <div key={s.label} className="bg-white/8 rounded-xl p-3 text-center">
                    <div className="text-lg font-bold font-mono">{s.value}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {isLive && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <h3 className="font-semibold text-[#0F172A] text-sm">Real-Time Election Monitor</h3>
                  <span className="ml-auto text-xs text-slate-400">Auto-refreshing every 30s</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: "Current Votes", value: (2947 + tick * 2).toLocaleString() },
                    { label: "Active Voters", value: String(34 + (tick % 20)) },
                    { label: "Rate (last hr)", value: "142/hr" },
                    { label: "Est. Final", value: "~3,200" },
                  ].map(s => (
                    <div key={s.label} className="bg-slate-50 rounded-xl p-4 text-center border border-slate-100">
                      <div className="text-xl font-bold text-[#0A2540] font-mono">{s.value}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── COMPARE ──────────────────────────────────────────────────────── */}
        {activeTab === "compare" && (
          <div className="max-w-5xl mx-auto space-y-5">
            {/* Selector */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <h3 className="font-semibold text-[#0F172A] text-sm mb-4">Compare Elections</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">Election A</label>
                  <div className="relative">
                    <select value={selectedElId} onChange={e => setSelectedElId(Number(e.target.value))}
                      className="w-full appearance-none pl-3.5 pr-9 py-2.5 rounded-xl border border-[#2563EB] bg-blue-50 text-[#0F172A] text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]">
                      {elections.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#2563EB] pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">Election B</label>
                  <div className="relative">
                    <select value={compareElId} onChange={e => setCompareElId(Number(e.target.value))}
                      className="w-full appearance-none pl-3.5 pr-9 py-2.5 rounded-xl border border-[#0A2540] bg-slate-50 text-[#0F172A] text-sm focus:outline-none focus:ring-2 focus:ring-[#0A2540]">
                      {elections.filter(e => e.id !== selectedElId).map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0A2540] pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            {/* Side-by-side metrics */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Turnout Difference", valueA: "84.2%", valueB: "72.4%", delta: "+11.8pp", positive: true },
                { label: "Votes Difference", valueA: "2,947", valueB: "2,411", delta: "+536", positive: true },
                { label: "Participation Growth", valueA: "84.2%", valueB: "72.4%", delta: "+16.3%", positive: true },
                { label: "Avg College Rate", valueA: "75.1%", valueB: "64.8%", delta: "+10.3pp", positive: true },
              ].map(s => (
                <div key={s.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">{s.label}</p>
                  <div className="flex items-end gap-2 mb-2">
                    <span className="text-xl font-bold text-[#2563EB] font-mono">{s.valueA}</span>
                    <span className="text-sm text-slate-400 mb-0.5">vs</span>
                    <span className="text-xl font-bold text-[#0A2540] font-mono">{s.valueB}</span>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${s.positive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>{s.delta}</span>
                </div>
              ))}
            </div>

            {/* Grouped bar chart */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-semibold text-[#0F172A] text-sm">College Participation Comparison</h3>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-[#2563EB]" /><span className="text-xs text-slate-500">ASG 2025</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-[#0A2540]" /><span className="text-xs text-slate-500">ASG 2024</span></div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={compareData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="college" tick={{ fontSize: 11, fill: "#94A3B8" }} />
                  <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} tickFormatter={v => `${v}%`} />
                  <Tooltip formatter={(v: number) => [`${v}%`, "Turnout"]} contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E2E8F0" }} />
                  <Bar dataKey="ASG 2025" fill="#2563EB" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="ASG 2024" fill="#0A2540" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Trend line */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h3 className="font-semibold text-[#0F172A] text-sm mb-5">Participation Growth Trend</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={[
                  { year: "2022", rate: 61.2 }, { year: "2023", rate: 68.5 },
                  { year: "2024", rate: 72.4 }, { year: "2025", rate: 84.2 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="year" tick={{ fontSize: 11, fill: "#94A3B8" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} tickFormatter={v => `${v}%`} domain={[50, 100]} />
                  <Tooltip formatter={(v: number) => [`${v}%`, "Participation"]} contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E2E8F0" }} />
                  <Line type="monotone" dataKey="rate" stroke="#2563EB" strokeWidth={3} dot={{ fill: "#2563EB", strokeWidth: 2, r: 5 }} name="Turnout Rate" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

      </div>

      {/* Export Overview Modal */}
      {showExportModal && (
        <Modal title="Export Election Data" onClose={() => setShowExportModal(false)} width="max-w-lg">
          <div className="flex flex-col gap-5">
            <p className="text-sm text-slate-500">Review the data that will be included in your export for <strong className="text-[#0F172A]">{sel.title}</strong>.</p>

            <div className="flex flex-col gap-2">
              {[
                { label: "Election Summary", desc: "Title, dates, eligibility, turnout statistics", included: true },
                { label: "Participation by College", desc: "Vote counts and rates for all 7 colleges", included: true },
                { label: "Participation by Year Level", desc: "Breakdown across 1st–Graduate year levels", included: true },
                { label: "Organization Participation", desc: "Member participation rates for all organizations", included: true },
                { label: "Candidate Results", desc: "Vote counts, percentages, rankings per position", included: true },
                { label: "Abstain Rates", desc: "Intentional abstain data per position", included: true },
                { label: "Voting Timeline", desc: "Hourly votes data across election period", included: true },
                { label: "Election Health Metrics", desc: "Participation score, completion rates, integrity score", included: true },
              ].map(item => (
                <div key={item.label} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-[#0F172A]">{item.label}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <div>
              <label className="text-sm font-medium text-[#0F172A] block mb-2">Export Format</label>
              <div className="grid grid-cols-2 gap-2">
                {["PDF Report", "CSV Spreadsheet"].map(fmt => (
                  <label key={fmt} className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 cursor-pointer hover:border-[#2563EB] transition-colors">
                    <input type="radio" name="exportFmt" defaultChecked={fmt === "PDF Report"} />
                    <span className="text-sm font-medium text-[#0F172A]">{fmt}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex gap-3">
              <Btn variant="ghost" onClick={() => setShowExportModal(false)} className="flex-1">Cancel</Btn>
              <Btn variant="primary" onClick={() => setShowExportModal(false)} className="flex-1">
                <Download className="w-4 h-4" /> Export Now
              </Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── APP ──────────────────────────────────────────────────────────────────────

export default function App() {
  const getInitialView = (): View => {
    if (typeof window === "undefined") return "landing";
    return ["/admin", "/auth/admin"].includes(window.location.pathname) ? "admin-login" : "landing";
  };

  const [view, setView] = useState<View>(getInitialView);
  const [role, setRole] = useState<Role>(null);
  const [currentUser, setCurrentUser] = useState<AppUser>(mockStudent);

  const goTo = (nextView: View, path?: string) => {
    setView(nextView);
    if (typeof window !== "undefined" && path && window.location.pathname !== path) {
      window.history.pushState(null, "", path);
    }
  };

  useEffect(() => {
    const syncPath = () => {
      if (["/admin", "/auth/admin"].includes(window.location.pathname)) {
        setRole(null);
        setView("admin-login");
      } else if (window.location.pathname === "/" && (view === "admin-login" || role === null)) {
        setView("landing");
      }
    };
    window.addEventListener("popstate", syncPath);
    return () => window.removeEventListener("popstate", syncPath);
  }, [role, view]);

  const handleLogin = (r: Role) => {
    setRole(r);
    setCurrentUser(r === "admin" ? mockAdmin : mockStudent);
    setView(r === "admin" ? "admin-dashboard" : "student-dashboard");
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", r === "admin" ? "/admin" : "/");
    }
  };

  const handleSignOut = () => {
    const nextView = role === "admin" ? "admin-login" : "landing";
    const nextPath = role === "admin" ? "/admin" : "/";
    setRole(null);
    goTo(nextView, nextPath);
  };

  if (view === "landing") return <LandingPage onSignIn={() => goTo("login", "/")} onRegister={() => goTo("register", "/")} />;
  if (view === "login") return <LoginPage onLogin={handleLogin} onRegister={() => goTo("register", "/")} />;
  if (view === "admin-login") return <LoginPage mode="admin" onLogin={handleLogin} />;
  if (view === "register") return <RegisterPage onBack={() => goTo("login", "/")} onRegister={() => goTo("login", "/")} />;

  const page = () => {
    switch (view) {
      case "student-dashboard": return <StudentDashboard user={currentUser} onVote={() => setView("voting")} onResults={() => setView("results")} />;
      case "elections-list": return <ElectionsList onVote={() => setView("voting")} onResults={() => setView("results")} />;
      case "voting": return <VotingPage user={currentUser} onBack={() => setView("student-dashboard")} />;
      case "results": return <ResultsPage />;
      case "profile": return <ProfilePage user={currentUser} onSignOut={handleSignOut} />;
      case "notifications": return <NotificationsPage />;
      case "analytics": return <AnalyticsPage />;
      case "admin-dashboard": return <AdminDashboard onCreateElection={() => setView("election-create")} onAnalytics={() => setView("analytics")} />;
      case "admin-users": return <AdminUsers />;
      case "admin-elections": return <AdminElections onCreateElection={() => setView("election-create")} onAnalytics={() => setView("analytics")} />;
      case "admin-organizations": return <AdminOrganizations />;
      case "election-create": return <ElectionCreate onBack={() => setView(role === "admin" ? "admin-elections" : "student-dashboard")} />;
      default: return <StudentDashboard user={currentUser} onVote={() => setView("voting")} onResults={() => setView("results")} />;
    }
  };

  return (
    <AppShell view={view} onNavigate={(v) => setView(v as View)} onSignOut={handleSignOut} role={role} user={currentUser}>
      {page()}
    </AppShell>
  );
}

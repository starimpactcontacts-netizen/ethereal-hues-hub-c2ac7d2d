// Mock data for Loopgate events and rankings
export interface LoopgateEvent {
  id: string;
  title: string;
  subtitle: string;
  ip: string; // Film, Series, Song, Studio
  status: "live" | "pending" | "closed";
  startDate: string;
  endDate: string;
  location: string;
  league: "open" | "elite" | "regional";
  prizePool?: string;
  imageUrl?: string;
  rules: string[];
}

export interface Editor {
  id: string;
  alias: string;
  rank: number;
  indexScore: number;
  winRate: number;
  finalsReached: number;
  league: "open" | "pro" | "elite";
  qualificationStatus: "qualified" | "pending" | "eliminated";
  externalLinks: {
    tiktok?: string;
    instagram?: string;
    youtube?: string;
    portfolio?: string;
  };
  activeEvents: string[];
  pastEvents: string[];
  achievements: string[];
}

export const mockEvents: LoopgateEvent[] = [
  {
    id: "1",
    title: "#LOOPGATE",
    subtitle: "Open Index",
    ip: "Film",
    status: "live",
    startDate: "2025-12-15T00:00:00Z",
    endDate: "2025-12-31T23:59:59Z",
    location: "Loopgate Arena",
    league: "open",
    prizePool: "$10,000",
    rules: [
      "Maximum 60 seconds",
      "Original audio only",
      "No AI-generated content",
      "Submit via TikTok with #LOOPGATE",
    ],
  },
  {
    id: "2",
    title: "VELOCITY CUT",
    subtitle: "Speed Challenge",
    ip: "Series",
    status: "pending",
    startDate: "2026-01-15T00:00:00Z",
    endDate: "2026-01-30T23:59:59Z",
    location: "Loopgate Arena",
    league: "open",
    rules: [
      "Maximum 30 seconds",
      "Theme: Action sequences",
      "Transition minimum: 8",
    ],
  },
  {
    id: "3",
    title: "SYNC MASTERS",
    subtitle: "Audio Visual",
    ip: "Song",
    status: "pending",
    startDate: "2026-02-01T00:00:00Z",
    endDate: "2026-02-14T23:59:59Z",
    location: "Loopgate Arena",
    league: "elite",
    prizePool: "$25,000",
    rules: [
      "Beat sync mandatory",
      "Original footage preferred",
      "Invite only",
    ],
  },
  {
    id: "4",
    title: "FRAME PERFECT",
    subtitle: "Precision Edit",
    ip: "Studio",
    status: "closed",
    startDate: "2025-11-01T00:00:00Z",
    endDate: "2025-11-15T23:59:59Z",
    location: "Loopgate Arena",
    league: "regional",
    rules: [
      "Technical excellence focus",
      "No filters",
    ],
  },
  {
    id: "5",
    title: "MOTION BLUR",
    subtitle: "Transition Wars",
    ip: "Film",
    status: "closed",
    startDate: "2025-10-01T00:00:00Z",
    endDate: "2025-10-31T23:59:59Z",
    location: "Loopgate Arena",
    league: "open",
    rules: [
      "Minimum 12 transitions",
      "Theme: Movement",
    ],
  },
];

export const mockEditors: Editor[] = [
  {
    id: "1",
    alias: "VELOCITY_X",
    rank: 1,
    indexScore: 98.7,
    winRate: 89,
    finalsReached: 12,
    league: "elite",
    qualificationStatus: "qualified",
    externalLinks: {
      tiktok: "https://tiktok.com/@velocity_x",
      instagram: "https://instagram.com/velocity_x",
    },
    activeEvents: ["1"],
    pastEvents: ["4", "5"],
    achievements: ["Champion 2024", "Perfect Score", "10 Win Streak"],
  },
  {
    id: "2",
    alias: "FRAME_HUNTER",
    rank: 2,
    indexScore: 96.4,
    winRate: 82,
    finalsReached: 9,
    league: "elite",
    qualificationStatus: "qualified",
    externalLinks: {
      youtube: "https://youtube.com/@framehunter",
    },
    activeEvents: ["1", "2"],
    pastEvents: ["5"],
    achievements: ["Finals 2024", "Most Improved"],
  },
  {
    id: "3",
    alias: "CUT_MASTER",
    rank: 3,
    indexScore: 94.2,
    winRate: 78,
    finalsReached: 7,
    league: "pro",
    qualificationStatus: "qualified",
    externalLinks: {
      tiktok: "https://tiktok.com/@cutmaster",
      portfolio: "https://cutmaster.io",
    },
    activeEvents: ["1"],
    pastEvents: ["4"],
    achievements: ["Rising Star"],
  },
  {
    id: "4",
    alias: "SYNC_WAVE",
    rank: 4,
    indexScore: 91.8,
    winRate: 74,
    finalsReached: 5,
    league: "pro",
    qualificationStatus: "pending",
    externalLinks: {},
    activeEvents: ["1", "2"],
    pastEvents: [],
    achievements: [],
  },
  {
    id: "5",
    alias: "LOOP_KING",
    rank: 5,
    indexScore: 89.3,
    winRate: 71,
    finalsReached: 4,
    league: "pro",
    qualificationStatus: "pending",
    externalLinks: {
      instagram: "https://instagram.com/loopking",
    },
    activeEvents: ["1"],
    pastEvents: ["5"],
    achievements: ["Community Pick"],
  },
];

// Generate more editors for realistic rankings
export const generateRankings = (count: number): Editor[] => {
  const baseEditors = [...mockEditors];
  for (let i = 6; i <= count; i++) {
    baseEditors.push({
      id: String(i),
      alias: `EDITOR_${String(i).padStart(3, "0")}`,
      rank: i,
      indexScore: Math.max(50, 89 - (i - 5) * 0.8),
      winRate: Math.max(30, 70 - (i - 5) * 1.2),
      finalsReached: Math.max(0, 4 - Math.floor((i - 5) / 10)),
      league: i <= 20 ? "pro" : "open",
      qualificationStatus: i <= 30 ? "qualified" : "pending",
      externalLinks: {},
      activeEvents: [],
      pastEvents: [],
      achievements: [],
    });
  }
  return baseEditors;
};

export const currentUser: Editor = {
  id: "current",
  alias: "YOUR_ALIAS",
  rank: 47,
  indexScore: 72.4,
  winRate: 58,
  finalsReached: 1,
  league: "open",
  qualificationStatus: "pending",
  externalLinks: {
    tiktok: "https://tiktok.com/@youralias",
  },
  activeEvents: ["1"],
  pastEvents: ["5"],
  achievements: ["First Entry"],
};

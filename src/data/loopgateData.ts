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
  posterUrl?: string;
  rules: string[];
  updatedAt?: string;
}

export interface EditorPlatform {
  platform: "tiktok" | "instagram" | "youtube";
  handle: string;
  followers: number;
}

export interface Editor {
  id: string;
  alias: string;
  region: string;
  rank: number;
  indexScore: number;
  winRate: number;
  league: "open" | "pro" | "elite";
  qualificationStatus: "qualified" | "pending" | "eliminated";
  platforms: EditorPlatform[];
  activeEvents: string[];
  recentEvents: string[];
  achievements: string[];
  lastActive?: string;
}

export interface EventRanking {
  editorId: string;
  alias: string;
  rank: number;
  qoiTotal: number;
  quality: number;
  originality: number;
  impact: number;
}

export const mockEvents: LoopgateEvent[] = [
  {
    id: "1",
    title: "#LOOPGATE",
    subtitle: "Open Index",
    ip: "Film",
    status: "live",
    startDate: "2025-12-15T00:00:00Z",
    endDate: "2026-01-15T23:59:59Z",
    location: "Loopgate Arena",
    league: "open",
    prizePool: "$10,000",
    posterUrl: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&q=80",
    rules: [
      "Maximum 60 seconds",
      "Original audio only",
      "No AI-generated content",
      "Submit via TikTok with #LOOPGATE",
    ],
    updatedAt: "2h ago",
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
    posterUrl: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=800&q=80",
    rules: [
      "Maximum 30 seconds",
      "Theme: Action sequences",
      "Transition minimum: 8",
    ],
    updatedAt: "1d ago",
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
    posterUrl: "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800&q=80",
    rules: [
      "Beat sync mandatory",
      "Original footage preferred",
      "Invite only",
    ],
    updatedAt: "3d ago",
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
    posterUrl: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800&q=80",
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
    posterUrl: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=800&q=80",
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
    region: "NA",
    rank: 1,
    indexScore: 98.7,
    winRate: 89,
    league: "elite",
    qualificationStatus: "qualified",
    platforms: [
      { platform: "tiktok", handle: "@velocity_x", followers: 2400000 },
      { platform: "instagram", handle: "@velocity_x", followers: 890000 },
    ],
    activeEvents: ["1"],
    recentEvents: ["4", "5"],
    achievements: ["Champion 2024", "Perfect Score", "10 Win Streak"],
    lastActive: "2h ago",
  },
  {
    id: "2",
    alias: "FRAME_HUNTER",
    region: "EU",
    rank: 2,
    indexScore: 96.4,
    winRate: 82,
    league: "elite",
    qualificationStatus: "qualified",
    platforms: [
      { platform: "youtube", handle: "@framehunter", followers: 1200000 },
    ],
    activeEvents: ["1", "2"],
    recentEvents: ["5"],
    achievements: ["Finalist 2024", "Most Improved"],
    lastActive: "5h ago",
  },
  {
    id: "3",
    alias: "CUT_MASTER",
    region: "APAC",
    rank: 3,
    indexScore: 94.2,
    winRate: 78,
    league: "pro",
    qualificationStatus: "qualified",
    platforms: [
      { platform: "tiktok", handle: "@cutmaster", followers: 3100000 },
    ],
    activeEvents: ["1"],
    recentEvents: ["4"],
    achievements: ["Rising Star"],
    lastActive: "1d ago",
  },
  {
    id: "4",
    alias: "SYNC_WAVE",
    region: "LATAM",
    rank: 4,
    indexScore: 91.8,
    winRate: 74,
    league: "pro",
    qualificationStatus: "pending",
    platforms: [
      { platform: "tiktok", handle: "@syncwave", followers: 560000 },
      { platform: "instagram", handle: "@syncwave_", followers: 120000 },
    ],
    activeEvents: ["1", "2"],
    recentEvents: [],
    achievements: [],
    lastActive: "3h ago",
  },
  {
    id: "5",
    alias: "LOOP_KING",
    region: "EU",
    rank: 5,
    indexScore: 89.3,
    winRate: 71,
    league: "pro",
    qualificationStatus: "pending",
    platforms: [
      { platform: "instagram", handle: "@loopking", followers: 450000 },
      { platform: "youtube", handle: "@loopking", followers: 89000 },
    ],
    activeEvents: ["1"],
    recentEvents: ["5"],
    achievements: ["Community Pick"],
    lastActive: "12h ago",
  },
];

// Generate more editors for realistic rankings
export const generateEditors = (count: number): Editor[] => {
  const regions = ["NA", "EU", "APAC", "LATAM", "MEA"];
  const baseEditors = [...mockEditors];
  for (let i = 6; i <= count; i++) {
    baseEditors.push({
      id: String(i),
      alias: `EDITOR_${String(i).padStart(3, "0")}`,
      region: regions[i % regions.length],
      rank: i,
      indexScore: Math.max(50, 89 - (i - 5) * 0.8),
      winRate: Math.max(30, 70 - (i - 5) * 1.2),
      league: i <= 10 ? "elite" : i <= 30 ? "pro" : "open",
      qualificationStatus: i <= 30 ? "qualified" : "pending",
      platforms: [
        { platform: "tiktok", handle: `@editor${i}`, followers: Math.floor(Math.random() * 500000) + 10000 },
      ],
      activeEvents: [],
      recentEvents: [],
      achievements: [],
      lastActive: `${Math.floor(Math.random() * 24)}h ago`,
    });
  }
  return baseEditors;
};

// Generate event-specific rankings with QOI breakdown
export const generateEventRankings = (eventId: string, count: number): EventRanking[] => {
  const editors = generateEditors(count);
  return editors.slice(0, count).map((editor, index) => {
    const quality = Math.floor(Math.random() * 30) + 70;
    const originality = Math.floor(Math.random() * 30) + 70;
    const impact = Math.floor(Math.random() * 30) + 70;
    return {
      editorId: editor.id,
      alias: editor.alias,
      rank: index + 1,
      qoiTotal: Math.round((quality + originality + impact) / 3 * 10) / 10,
      quality,
      originality,
      impact,
    };
  }).sort((a, b) => b.qoiTotal - a.qoiTotal).map((r, i) => ({ ...r, rank: i + 1 }));
};

export const currentUser: Editor = {
  id: "current",
  alias: "YOUR_ALIAS",
  region: "NA",
  rank: 47,
  indexScore: 72.4,
  winRate: 58,
  league: "open",
  qualificationStatus: "pending",
  platforms: [
    { platform: "tiktok", handle: "@youralias", followers: 45000 },
  ],
  activeEvents: ["1"],
  recentEvents: ["5"],
  achievements: ["First Entry"],
  lastActive: "Just now",
};

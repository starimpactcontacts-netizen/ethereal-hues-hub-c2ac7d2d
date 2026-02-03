import type { Tournament } from "@/components/loopgate/TournamentCard";

// Helper to create dates relative to now
const hoursFromNow = (hours: number) => new Date(Date.now() + hours * 60 * 60 * 1000);

export const mockTournaments: Tournament[] = [
  // Ready-Up Tournaments
  {
    id: "t1",
    name: "Neon Nights Cup",
    hostCrew: "Edit Lords",
    isSanctioned: true,
    phase: "ready-up",
    playerCount: 42,
    minPlayers: 20,
    maxPlayers: 64,
    readyCount: 38,
    phaseEndsAt: hoursFromNow(18),
    prizePool: "$250",
    theme: "Create a VFX-heavy edit using neon color grading and urban nightlife footage. No audio swaps allowed.",
  },
  {
    id: "t2",
    name: "Velocity Showdown",
    hostCrew: "Motion Unit",
    isSanctioned: true,
    phase: "ready-up",
    playerCount: 28,
    minPlayers: 20,
    maxPlayers: 50,
    readyCount: 22,
    phaseEndsAt: hoursFromNow(6),
    prizePool: "$100",
    theme: "Speed ramping focus. Must include at least 3 velocity changes.",
  },
  {
    id: "t3",
    name: "Unit Wars: Round 4",
    hostCrew: "The Collective",
    isSanctioned: false,
    phase: "ready-up",
    playerCount: 35,
    minPlayers: 30,
    maxPlayers: 100,
    readyCount: 30,
    phaseEndsAt: hoursFromNow(12),
    theme: "Open theme. Unit vs Unit elimination format.",
  },

  // Live / Submission Phase
  {
    id: "t4",
    name: "Golden Hour Challenge",
    hostCrew: "Sunset Editors",
    isSanctioned: true,
    phase: "submission",
    playerCount: 52,
    minPlayers: 20,
    maxPlayers: 64,
    phaseEndsAt: hoursFromNow(8),
    prizePool: "$500",
    theme: "Cinematic edits using golden hour footage only. 30-60 second limit.",
  },
  {
    id: "t5",
    name: "Weekend Warriors",
    hostCrew: "Casual Cuts",
    isSanctioned: false,
    phase: "submission",
    playerCount: 45,
    minPlayers: 20,
    maxPlayers: 80,
    phaseEndsAt: hoursFromNow(4),
    theme: "Any style, any footage. Just have fun!",
  },

  // Bracket Running
  {
    id: "t6",
    name: "Pro League Invitational",
    hostCrew: "Loopgate Official",
    isSanctioned: true,
    phase: "bracket",
    playerCount: 32,
    minPlayers: 32,
    maxPlayers: 32,
    phaseEndsAt: hoursFromNow(24),
    prizePool: "$1,000",
    theme: "Invite-only tournament. Top 32 ranked editors.",
  },
  {
    id: "t7",
    name: "Anime Edit Royale",
    hostCrew: "Weeb Warriors",
    isSanctioned: true,
    phase: "bracket",
    playerCount: 64,
    minPlayers: 32,
    maxPlayers: 64,
    phaseEndsAt: hoursFromNow(36),
    prizePool: "$300",
    theme: "Anime AMV tournament. Single elimination.",
  },

  // Upcoming (these show as "upcoming" in the future)
  {
    id: "t8",
    name: "Summer Slam 2026",
    hostCrew: "Loopgate Official",
    isSanctioned: true,
    phase: "ready-up",
    playerCount: 12,
    minPlayers: 50,
    maxPlayers: 100,
    readyCount: 8,
    phaseEndsAt: hoursFromNow(72),
    prizePool: "$2,500",
    theme: "The biggest tournament of the summer. All styles welcome.",
  },

  // Practice / Scrims
  {
    id: "t9",
    name: "Practice Lobby #47",
    hostCrew: "Training Grounds",
    isSanctioned: false,
    phase: "submission",
    playerCount: 8,
    minPlayers: 4,
    maxPlayers: 20,
    phaseEndsAt: hoursFromNow(2),
    theme: "Casual practice. No prizes, just vibes.",
  },
  {
    id: "t10",
    name: "1v1 Scrim Arena",
    hostCrew: "Duel Masters",
    isSanctioned: false,
    phase: "ready-up",
    playerCount: 6,
    minPlayers: 2,
    maxPlayers: 16,
    readyCount: 4,
    phaseEndsAt: hoursFromNow(1),
    theme: "Quick 1v1 scrimmages. Best of 3.",
  },
];

// Categorized lists
export const readyUpTournaments = mockTournaments.filter(t => t.phase === "ready-up" && t.isSanctioned);
export const liveTournaments = mockTournaments.filter(t => t.phase === "submission" || t.phase === "bracket");
export const upcomingTournaments = mockTournaments.filter(t => t.phase === "ready-up" && t.playerCount < t.minPlayers);
export const practiceScrims = mockTournaments.filter(t => !t.isSanctioned && t.maxPlayers <= 20);

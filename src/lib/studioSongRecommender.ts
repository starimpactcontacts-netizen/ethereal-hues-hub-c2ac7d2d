/**
 * AI Song Recommender — Loopgate Studio
 * Suggests music based on video pacing, mood, and genre.
 */

export type SongMood = "hype" | "chill" | "dark" | "emotional" | "epic" | "funny" | "retro";
export type SongGenre = "phonk" | "trap" | "lofi" | "edm" | "rock" | "cinematic" | "pop" | "ambient";
export type EditPacing = "slow" | "medium" | "fast" | "extreme";

export type SongRecommendation = {
  id: string;
  title: string;
  artist: string;
  genre: SongGenre;
  mood: SongMood;
  bpm: number;
  previewUrl?: string;
  thumbnailUrl?: string;
  duration: number;
  matchScore: number;
};

export type VideoAnalysis = {
  averageCutRate: number; // cuts per minute
  motionIntensity: number; // 0-1
  colorTemperature: "warm" | "neutral" | "cool";
  brightness: "dark" | "normal" | "bright";
  estimatedMood: SongMood;
  estimatedPacing: EditPacing;
};

// ─── Analyze Video for Song Matching ───
export async function analyzeVideoForMusic(
  video: HTMLVideoElement,
  sceneChanges: { time: number }[]
): Promise<VideoAnalysis> {
  const duration = video.duration;
  const cutRate = (sceneChanges.length / duration) * 60; // cuts per minute

  // Estimate pacing from cut rate
  let pacing: EditPacing = "medium";
  if (cutRate < 10) pacing = "slow";
  else if (cutRate < 30) pacing = "medium";
  else if (cutRate < 60) pacing = "fast";
  else pacing = "extreme";

  // Sample frames for color analysis
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  canvas.width = 64;
  canvas.height = 36;

  let totalR = 0, totalG = 0, totalB = 0, totalBrightness = 0;
  const samples = 10;

  for (let i = 0; i < samples; i++) {
    video.currentTime = (duration / samples) * i;
    await new Promise((r) => (video.onseeked = r));
    ctx.drawImage(video, 0, 0, 64, 36);
    const data = ctx.getImageData(0, 0, 64, 36).data;

    for (let j = 0; j < data.length; j += 4) {
      totalR += data[j];
      totalG += data[j + 1];
      totalB += data[j + 2];
      totalBrightness += (data[j] + data[j + 1] + data[j + 2]) / 3;
    }
  }

  const pixelCount = samples * 64 * 36;
  const avgR = totalR / pixelCount;
  const avgG = totalG / pixelCount;
  const avgB = totalB / pixelCount;
  const avgBrightness = totalBrightness / pixelCount;

  // Determine color temperature
  let colorTemp: "warm" | "neutral" | "cool" = "neutral";
  if (avgR > avgB + 20) colorTemp = "warm";
  else if (avgB > avgR + 20) colorTemp = "cool";

  // Determine brightness
  let brightness: "dark" | "normal" | "bright" = "normal";
  if (avgBrightness < 80) brightness = "dark";
  else if (avgBrightness > 170) brightness = "bright";

  // Estimate mood from combined factors
  let mood: SongMood = "chill";
  if (pacing === "extreme" && brightness === "dark") mood = "dark";
  else if (pacing === "fast" && colorTemp === "warm") mood = "hype";
  else if (pacing === "slow" && brightness === "dark") mood = "emotional";
  else if (pacing === "extreme") mood = "epic";
  else if (pacing === "slow") mood = "chill";

  return {
    averageCutRate: cutRate,
    motionIntensity: Math.min(cutRate / 60, 1),
    colorTemperature: colorTemp,
    brightness,
    estimatedMood: mood,
    estimatedPacing: pacing,
  };
}

// ─── Song Database (Mock - would integrate with real API) ───
const SONG_DATABASE: Omit<SongRecommendation, "matchScore">[] = [
  // Phonk
  { id: "phonk-1", title: "Murder in My Mind", artist: "Kordhell", genre: "phonk", mood: "dark", bpm: 140, duration: 180 },
  { id: "phonk-2", title: "DVRST - Close Eyes", artist: "DVRST", genre: "phonk", mood: "hype", bpm: 135, duration: 210 },
  { id: "phonk-3", title: "OVERRIDE", artist: "KSLV Noh", genre: "phonk", mood: "dark", bpm: 145, duration: 195 },
  // Trap
  { id: "trap-1", title: "Sicko Mode", artist: "Travis Scott", genre: "trap", mood: "hype", bpm: 155, duration: 312 },
  { id: "trap-2", title: "HUMBLE", artist: "Kendrick Lamar", genre: "trap", mood: "hype", bpm: 150, duration: 177 },
  // Lo-fi
  { id: "lofi-1", title: "Snowman", artist: "WYS", genre: "lofi", mood: "chill", bpm: 85, duration: 180 },
  { id: "lofi-2", title: "Coffee", artist: "Beabadoobee", genre: "lofi", mood: "chill", bpm: 90, duration: 195 },
  // EDM
  { id: "edm-1", title: "Levels", artist: "Avicii", genre: "edm", mood: "epic", bpm: 126, duration: 210 },
  { id: "edm-2", title: "Titanium", artist: "David Guetta", genre: "edm", mood: "epic", bpm: 126, duration: 245 },
  // Cinematic
  { id: "cine-1", title: "Time", artist: "Hans Zimmer", genre: "cinematic", mood: "emotional", bpm: 70, duration: 275 },
  { id: "cine-2", title: "Experience", artist: "Ludovico Einaudi", genre: "cinematic", mood: "emotional", bpm: 60, duration: 310 },
  // Rock
  { id: "rock-1", title: "Enter Sandman", artist: "Metallica", genre: "rock", mood: "epic", bpm: 123, duration: 331 },
  { id: "rock-2", title: "Smells Like Teen Spirit", artist: "Nirvana", genre: "rock", mood: "hype", bpm: 117, duration: 301 },
  // Ambient
  { id: "amb-1", title: "Weightless", artist: "Marconi Union", genre: "ambient", mood: "chill", bpm: 60, duration: 480 },
  // Retro
  { id: "retro-1", title: "Blinding Lights", artist: "The Weeknd", genre: "pop", mood: "retro", bpm: 171, duration: 200 },
];

// ─── BPM Mapping for Pacing ───
const PACING_BPM: Record<EditPacing, [number, number]> = {
  slow: [60, 90],
  medium: [90, 120],
  fast: [120, 150],
  extreme: [140, 180],
};

// ─── Generate Recommendations ───
export function getRecommendations(
  analysis: VideoAnalysis,
  preferredGenres?: SongGenre[],
  limit: number = 6
): SongRecommendation[] {
  const [minBpm, maxBpm] = PACING_BPM[analysis.estimatedPacing];

  const scored = SONG_DATABASE.map((song) => {
    let score = 0;

    // BPM match (0-30 points)
    if (song.bpm >= minBpm && song.bpm <= maxBpm) {
      score += 30;
    } else {
      const bpmDiff = Math.min(Math.abs(song.bpm - minBpm), Math.abs(song.bpm - maxBpm));
      score += Math.max(0, 20 - bpmDiff / 2);
    }

    // Mood match (0-40 points)
    if (song.mood === analysis.estimatedMood) {
      score += 40;
    } else if (
      (song.mood === "hype" && analysis.estimatedMood === "epic") ||
      (song.mood === "dark" && analysis.estimatedMood === "emotional") ||
      (song.mood === "chill" && analysis.estimatedMood === "emotional")
    ) {
      score += 20;
    }

    // Genre preference (0-20 points)
    if (preferredGenres?.includes(song.genre)) {
      score += 20;
    }

    // Color temperature bonus
    if (
      (song.mood === "dark" && analysis.brightness === "dark") ||
      (song.mood === "hype" && analysis.colorTemperature === "warm")
    ) {
      score += 10;
    }

    return { ...song, matchScore: score };
  });

  // Sort by score and return top results
  return scored
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, limit);
}

// ─── Quick Preset Recommendations ───
export const QUICK_PRESETS: { id: string; label: string; mood: SongMood; genres: SongGenre[] }[] = [
  { id: "viral", label: "🔥 Viral Edit", mood: "hype", genres: ["phonk", "trap"] },
  { id: "cinematic", label: "🎬 Cinematic", mood: "epic", genres: ["cinematic", "ambient"] },
  { id: "chill", label: "☁️ Chill Vibes", mood: "chill", genres: ["lofi", "ambient"] },
  { id: "dark", label: "🖤 Dark Aesthetic", mood: "dark", genres: ["phonk"] },
  { id: "retro", label: "📼 Retro Wave", mood: "retro", genres: ["pop", "edm"] },
  { id: "emotional", label: "💔 Emotional", mood: "emotional", genres: ["cinematic", "lofi"] },
];

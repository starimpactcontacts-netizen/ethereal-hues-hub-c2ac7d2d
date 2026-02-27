/**
 * Studio Font System — Loopgate Studio
 * 50+ curated fonts loaded from Google Fonts, organized by category.
 */

export type FontCategory = "display" | "sans" | "serif" | "mono" | "script" | "decorative";

export type StudioFont = {
  family: string;
  label: string;
  category: FontCategory;
  weights: number[];
  googleName: string; // name for Google Fonts URL
};

// ─── Curated Font Library ───
export const STUDIO_FONTS: StudioFont[] = [
  // Display — Big bold headlines
  { family: "'Bebas Neue'", label: "Bebas Neue", category: "display", weights: [400], googleName: "Bebas+Neue" },
  { family: "'Anton'", label: "Anton", category: "display", weights: [400], googleName: "Anton" },
  { family: "'Oswald'", label: "Oswald", category: "display", weights: [300, 400, 500, 600, 700], googleName: "Oswald:wght@300;400;500;600;700" },
  { family: "'Archivo Black'", label: "Archivo Black", category: "display", weights: [400], googleName: "Archivo+Black" },
  { family: "'Righteous'", label: "Righteous", category: "display", weights: [400], googleName: "Righteous" },
  { family: "'Bungee'", label: "Bungee", category: "display", weights: [400], googleName: "Bungee" },
  { family: "'Fredoka One'", label: "Fredoka", category: "display", weights: [400], googleName: "Fredoka" },
  { family: "'Permanent Marker'", label: "Marker", category: "display", weights: [400], googleName: "Permanent+Marker" },
  { family: "'Black Ops One'", label: "Black Ops", category: "display", weights: [400], googleName: "Black+Ops+One" },
  { family: "'Bangers'", label: "Bangers", category: "display", weights: [400], googleName: "Bangers" },
  { family: "'Passion One'", label: "Passion", category: "display", weights: [400, 700, 900], googleName: "Passion+One:wght@400;700;900" },
  { family: "'Alfa Slab One'", label: "Alfa Slab", category: "display", weights: [400], googleName: "Alfa+Slab+One" },
  
  // Sans — Clean modern
  { family: "'Inter'", label: "Inter", category: "sans", weights: [300, 400, 500, 600, 700, 800, 900], googleName: "Inter:wght@300;400;500;600;700;800;900" },
  { family: "'Montserrat'", label: "Montserrat", category: "sans", weights: [300, 400, 500, 600, 700, 800, 900], googleName: "Montserrat:wght@300;400;500;600;700;800;900" },
  { family: "'Poppins'", label: "Poppins", category: "sans", weights: [300, 400, 500, 600, 700, 800, 900], googleName: "Poppins:wght@300;400;500;600;700;800;900" },
  { family: "'Raleway'", label: "Raleway", category: "sans", weights: [300, 400, 500, 600, 700, 800, 900], googleName: "Raleway:wght@300;400;500;600;700;800;900" },
  { family: "'Space Grotesk'", label: "Space Grotesk", category: "sans", weights: [300, 400, 500, 600, 700], googleName: "Space+Grotesk:wght@300;400;500;600;700" },
  { family: "'DM Sans'", label: "DM Sans", category: "sans", weights: [400, 500, 700], googleName: "DM+Sans:wght@400;500;700" },
  { family: "'Outfit'", label: "Outfit", category: "sans", weights: [300, 400, 500, 600, 700, 800], googleName: "Outfit:wght@300;400;500;600;700;800" },
  { family: "'Sora'", label: "Sora", category: "sans", weights: [300, 400, 500, 600, 700, 800], googleName: "Sora:wght@300;400;500;600;700;800" },
  { family: "'Urbanist'", label: "Urbanist", category: "sans", weights: [300, 400, 500, 600, 700, 800, 900], googleName: "Urbanist:wght@300;400;500;600;700;800;900" },
  { family: "'Plus Jakarta Sans'", label: "Jakarta Sans", category: "sans", weights: [400, 500, 600, 700, 800], googleName: "Plus+Jakarta+Sans:wght@400;500;600;700;800" },
  
  // Serif — Editorial premium
  { family: "'Playfair Display'", label: "Playfair", category: "serif", weights: [400, 500, 600, 700, 800, 900], googleName: "Playfair+Display:wght@400;500;600;700;800;900" },
  { family: "'Merriweather'", label: "Merriweather", category: "serif", weights: [300, 400, 700, 900], googleName: "Merriweather:wght@300;400;700;900" },
  { family: "'Lora'", label: "Lora", category: "serif", weights: [400, 500, 600, 700], googleName: "Lora:wght@400;500;600;700" },
  { family: "'Cormorant Garamond'", label: "Cormorant", category: "serif", weights: [300, 400, 500, 600, 700], googleName: "Cormorant+Garamond:wght@300;400;500;600;700" },
  { family: "'DM Serif Display'", label: "DM Serif", category: "serif", weights: [400], googleName: "DM+Serif+Display" },
  { family: "'Bitter'", label: "Bitter", category: "serif", weights: [300, 400, 500, 600, 700, 800], googleName: "Bitter:wght@300;400;500;600;700;800" },
  
  // Mono — Tech/code
  { family: "'JetBrains Mono'", label: "JetBrains", category: "mono", weights: [300, 400, 500, 600, 700, 800], googleName: "JetBrains+Mono:wght@300;400;500;600;700;800" },
  { family: "'Fira Code'", label: "Fira Code", category: "mono", weights: [300, 400, 500, 600, 700], googleName: "Fira+Code:wght@300;400;500;600;700" },
  { family: "'Space Mono'", label: "Space Mono", category: "mono", weights: [400, 700], googleName: "Space+Mono:wght@400;700" },
  { family: "'Source Code Pro'", label: "Source Code", category: "mono", weights: [300, 400, 500, 600, 700], googleName: "Source+Code+Pro:wght@300;400;500;600;700" },
  { family: "'IBM Plex Mono'", label: "IBM Plex", category: "mono", weights: [300, 400, 500, 600, 700], googleName: "IBM+Plex+Mono:wght@300;400;500;600;700" },
  
  // Script — Handwritten/cursive
  { family: "'Dancing Script'", label: "Dancing", category: "script", weights: [400, 500, 600, 700], googleName: "Dancing+Script:wght@400;500;600;700" },
  { family: "'Pacifico'", label: "Pacifico", category: "script", weights: [400], googleName: "Pacifico" },
  { family: "'Sacramento'", label: "Sacramento", category: "script", weights: [400], googleName: "Sacramento" },
  { family: "'Great Vibes'", label: "Great Vibes", category: "script", weights: [400], googleName: "Great+Vibes" },
  { family: "'Caveat'", label: "Caveat", category: "script", weights: [400, 500, 600, 700], googleName: "Caveat:wght@400;500;600;700" },
  { family: "'Shadows Into Light'", label: "Shadows", category: "script", weights: [400], googleName: "Shadows+Into+Light" },
  
  // Decorative — Unique/themed
  { family: "'Press Start 2P'", label: "Pixel", category: "decorative", weights: [400], googleName: "Press+Start+2P" },
  { family: "'Orbitron'", label: "Orbitron", category: "decorative", weights: [400, 500, 600, 700, 800, 900], googleName: "Orbitron:wght@400;500;600;700;800;900" },
  { family: "'Creepster'", label: "Creepster", category: "decorative", weights: [400], googleName: "Creepster" },
  { family: "'Bungee Shade'", label: "Bungee 3D", category: "decorative", weights: [400], googleName: "Bungee+Shade" },
  { family: "'Monoton'", label: "Monoton", category: "decorative", weights: [400], googleName: "Monoton" },
  { family: "'Rubik Glitch'", label: "Glitch", category: "decorative", weights: [400], googleName: "Rubik+Glitch" },
  { family: "'Silkscreen'", label: "Silkscreen", category: "decorative", weights: [400, 700], googleName: "Silkscreen:wght@400;700" },
];

// ─── Text Animation Presets ───
export type TextAnimation = {
  id: string;
  label: string;
  icon: string;
};

export const TEXT_ANIMATIONS: TextAnimation[] = [
  { id: "none", label: "None", icon: "—" },
  { id: "fade_in", label: "Fade In", icon: "✨" },
  { id: "slide_up", label: "Slide Up", icon: "⬆" },
  { id: "slide_down", label: "Slide Down", icon: "⬇" },
  { id: "scale_in", label: "Pop In", icon: "💥" },
  { id: "typewriter", label: "Typewriter", icon: "⌨️" },
  { id: "bounce", label: "Bounce", icon: "🏀" },
  { id: "shake", label: "Shake", icon: "📳" },
  { id: "glitch", label: "Glitch", icon: "⚡" },
  { id: "wave", label: "Wave", icon: "🌊" },
  { id: "rotate_in", label: "Rotate In", icon: "🔄" },
  { id: "blur_in", label: "Blur In", icon: "💨" },
];

// ─── Preset Text Colors ───
export const TEXT_COLORS = [
  "#FFFFFF", "#000000", "#FF0000", "#FF4444", "#FF8800", "#FFCC00",
  "#FFFF00", "#88FF00", "#00FF00", "#00FFCC", "#00CCFF", "#0088FF",
  "#0000FF", "#4400FF", "#8800FF", "#CC00FF", "#FF00CC", "#FF0088",
  "#FF6B6B", "#C084FC", "#818CF8", "#22D3EE", "#34D399", "#FBBF24",
  "#F97316", "#EF4444", "#EC4899", "#A855F7", "#6366F1", "#14B8A6",
];

// ─── Font Loader ───
const loadedFonts = new Set<string>();

export function loadFont(font: StudioFont): void {
  if (loadedFonts.has(font.label)) return;
  loadedFonts.add(font.label);
  
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${font.googleName}&display=swap`;
  document.head.appendChild(link);
}

export function loadAllFonts(): void {
  // Batch load in groups of 10 to avoid overwhelming the browser
  const families = STUDIO_FONTS.map(f => f.googleName).join("&family=");
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${families}&display=swap`;
  document.head.appendChild(link);
  STUDIO_FONTS.forEach(f => loadedFonts.add(f.label));
}

// Preconnect for faster loading
export function preconnectGoogleFonts(): void {
  if (document.querySelector('link[href*="fonts.googleapis.com"][rel="preconnect"]')) return;
  const preconnect1 = document.createElement("link");
  preconnect1.rel = "preconnect";
  preconnect1.href = "https://fonts.googleapis.com";
  const preconnect2 = document.createElement("link");
  preconnect2.rel = "preconnect";
  preconnect2.href = "https://fonts.gstatic.com";
  preconnect2.crossOrigin = "anonymous";
  document.head.appendChild(preconnect1);
  document.head.appendChild(preconnect2);
}

export const FONT_CATEGORIES: { id: FontCategory | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "display", label: "Display" },
  { id: "sans", label: "Sans" },
  { id: "serif", label: "Serif" },
  { id: "mono", label: "Mono" },
  { id: "script", label: "Script" },
  { id: "decorative", label: "Fun" },
];

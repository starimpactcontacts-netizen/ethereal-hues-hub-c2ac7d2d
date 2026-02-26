import { ExternalLink, Monitor, Smartphone } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

type Software = {
  name: string;
  tagline: string;
  price: "Free" | "Paid" | "Freemium";
  platforms: ("desktop" | "ios" | "android" | "web")[];
  desktopUrl: string;
  mobileUrl?: string;
  webUrl?: string;
  color: string;
};

const SOFTWARE_LIST: Software[] = [
  {
    name: "CapCut",
    tagline: "Fast mobile & desktop editing",
    price: "Free",
    platforms: ["desktop", "ios", "android", "web"],
    desktopUrl: "https://www.capcut.com/download",
    mobileUrl: "https://www.capcut.com/download",
    webUrl: "https://www.capcut.com/editor",
    color: "hsl(0, 0%, 95%)",
  },
  {
    name: "DaVinci Resolve",
    tagline: "Hollywood-grade color & editing",
    price: "Freemium",
    platforms: ["desktop"],
    desktopUrl: "https://www.blackmagicdesign.com/products/davinciresolve",
    color: "hsl(25, 95%, 53%)",
  },
  {
    name: "Adobe Premiere Pro",
    tagline: "Industry standard NLE",
    price: "Paid",
    platforms: ["desktop"],
    desktopUrl: "https://www.adobe.com/products/premiere.html",
    color: "hsl(270, 80%, 60%)",
  },
  {
    name: "After Effects",
    tagline: "Motion graphics & VFX",
    price: "Paid",
    platforms: ["desktop"],
    desktopUrl: "https://www.adobe.com/products/aftereffects.html",
    color: "hsl(240, 70%, 60%)",
  },
  {
    name: "Final Cut Pro",
    tagline: "Apple's pro editing suite",
    price: "Paid",
    platforms: ["desktop", "ios"],
    desktopUrl: "https://www.apple.com/final-cut-pro/",
    mobileUrl: "https://apps.apple.com/app/final-cut-pro-for-ipad/id1631624924",
    color: "hsl(0, 0%, 60%)",
  },
  {
    name: "VN Video Editor",
    tagline: "Powerful free mobile editor",
    price: "Free",
    platforms: ["ios", "android", "desktop"],
    desktopUrl: "https://www.vlognow.me/",
    mobileUrl: "https://www.vlognow.me/",
    color: "hsl(200, 80%, 55%)",
  },
];

export default function SoftwareLauncherGrid() {
  const isMobile = useIsMobile();

  const getLink = (sw: Software) => {
    if (isMobile && sw.mobileUrl) return sw.mobileUrl;
    if (sw.webUrl) return sw.webUrl;
    return sw.desktopUrl;
  };

  return (
    <div className="grid grid-cols-2 gap-2">
      {SOFTWARE_LIST.map((sw) => (
        <a
          key={sw.name}
          href={getLink(sw)}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-surface-1 border border-border p-3 hover:border-foreground/30 transition-all group card-hover block"
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-2">
            <div
              className="w-8 h-8 flex items-center justify-center font-display text-lg"
              style={{ backgroundColor: sw.color + "20", color: sw.color }}
            >
              {sw.name.charAt(0)}
            </div>
            <span
              className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 ${
                sw.price === "Free"
                  ? "bg-emerald-500/15 text-emerald-400"
                  : sw.price === "Freemium"
                    ? "bg-gold/15 text-gold"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {sw.price}
            </span>
          </div>

          {/* Info */}
          <h4 className="font-display text-sm text-foreground leading-tight">{sw.name}</h4>
          <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{sw.tagline}</p>

          {/* Platforms */}
          <div className="flex items-center gap-1.5 mt-2">
            {sw.platforms.includes("desktop") && <Monitor className="w-3 h-3 text-muted-foreground" />}
            {(sw.platforms.includes("ios") || sw.platforms.includes("android")) && (
              <Smartphone className="w-3 h-3 text-muted-foreground" />
            )}
            {sw.platforms.includes("web") && (
              <span className="text-[8px] text-muted-foreground border border-border px-1">WEB</span>
            )}
            <ExternalLink className="w-3 h-3 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </a>
      ))}
    </div>
  );
}

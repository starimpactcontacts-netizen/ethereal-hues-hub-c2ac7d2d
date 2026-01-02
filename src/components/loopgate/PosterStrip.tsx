import { useEffect, useRef } from "react";

const posters = [
  "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&q=80",
  "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=400&q=80",
  "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=400&q=80",
  "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400&q=80",
  "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=400&q=80",
  "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&q=80",
  "https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=400&q=80",
  "https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?w=400&q=80",
];

export default function PosterStrip() {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    let animationId: number;
    let scrollPosition = 0;

    const animate = () => {
      scrollPosition += 0.5;
      if (scrollPosition >= container.scrollWidth / 2) {
        scrollPosition = 0;
      }
      container.scrollLeft = scrollPosition;
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, []);

  return (
    <section className="py-4 overflow-hidden">
      <div 
        ref={scrollRef}
        className="flex gap-3 overflow-hidden"
        style={{ scrollBehavior: "auto" }}
      >
        {[...posters, ...posters].map((poster, index) => (
          <div
            key={index}
            className="w-24 h-36 flex-shrink-0 rounded-lg bg-cover bg-center relative overflow-hidden"
            style={{ backgroundImage: `url(${poster})` }}
          >
            <div className="absolute inset-0 bg-black/40" />
          </div>
        ))}
      </div>
    </section>
  );
}

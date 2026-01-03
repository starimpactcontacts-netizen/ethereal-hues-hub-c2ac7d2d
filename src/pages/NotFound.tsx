import { Link } from "react-router-dom";
import loopgateLogo from "@/assets/loopgate-logo-white.png";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <img src={loopgateLogo} alt="LOOPGATE" className="h-8 mb-8 opacity-40" />
      <h1 className="font-display text-8xl text-gold mb-4">404</h1>
      <p className="text-muted-foreground mb-8">This page doesn't exist.</p>
      <Link 
        to="/" 
        className="text-gold hover:underline font-semibold uppercase tracking-widest text-sm"
      >
        Return Home
      </Link>
    </div>
  );
}

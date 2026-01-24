import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import loopgateLogo from "@/assets/loopgate-wordmark.png";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    // Log only in development to prevent information leakage
    if (import.meta.env.DEV) {
      console.error("404 Error: User attempted to access non-existent route:", location.pathname);
    }
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-surface-2 via-background to-background pointer-events-none" />
      
      <div className="relative z-10 text-center max-w-md">
        {/* Logo */}
        <img src={loopgateLogo} alt="Loopgate" className="h-6 mx-auto mb-8 opacity-60" />
        
        {/* 404 Display */}
        <div className="mb-6">
          <h1 className="font-display text-8xl text-gold mb-2">404</h1>
          <div className="h-px w-24 mx-auto bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
        </div>
        
        <h2 className="font-display text-2xl text-foreground mb-2">Page Not Found</h2>
        <p className="text-muted-foreground text-sm mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/">
            <Button className="bg-gold text-black hover:bg-gold/90 font-semibold w-full sm:w-auto">
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Button>
          </Link>
          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="border-border hover:border-gold/50 w-full sm:w-auto"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;

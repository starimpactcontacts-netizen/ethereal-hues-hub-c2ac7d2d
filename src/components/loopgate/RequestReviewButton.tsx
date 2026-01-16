import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gavel, Loader2, CheckCircle } from "lucide-react";
import { useReviewRequests } from "@/hooks/useReviewRequests";
import { Button } from "@/components/ui/button";

interface RequestReviewButtonProps {
  submissionUrl: string;
  platform: string;
  variant?: "default" | "compact" | "feed";
  className?: string;
}

export default function RequestReviewButton({ 
  submissionUrl, 
  platform, 
  variant = "default",
  className = ""
}: RequestReviewButtonProps) {
  const { requestReview, loading, canRequest, remainingRequests } = useReviewRequests();
  const [requested, setRequested] = useState(false);

  const handleRequest = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    const success = await requestReview(submissionUrl, platform);
    if (success) {
      setRequested(true);
    }
  };

  if (requested) {
    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`flex items-center gap-2 text-green-500 ${className}`}
      >
        <CheckCircle className="w-4 h-4" />
        <span className="text-xs font-medium">Review Requested</span>
      </motion.div>
    );
  }

  if (variant === "compact") {
    return (
      <button
        onClick={handleRequest}
        disabled={loading || !canRequest}
        className={`flex items-center gap-1.5 px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 rounded text-amber-500 text-[10px] font-medium uppercase tracking-wider transition-colors disabled:opacity-50 ${className}`}
      >
        {loading ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <Gavel className="w-3 h-3" />
        )}
        Request Review
      </button>
    );
  }

  if (variant === "feed") {
    return (
      <button
        onClick={handleRequest}
        disabled={loading || !canRequest}
        className={`flex flex-col items-center gap-1 ${className}`}
      >
        <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
          loading ? 'bg-white/10' : canRequest ? 'bg-amber-500/90 hover:bg-amber-500' : 'bg-white/10'
        }`}>
          {loading ? (
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          ) : (
            <Gavel className={`w-6 h-6 ${canRequest ? 'text-black' : 'text-white/50'}`} />
          )}
        </div>
        <span className="text-white text-[10px] font-medium">
          {canRequest ? 'Review' : `${remainingRequests}/3`}
        </span>
      </button>
    );
  }

  // Default variant
  return (
    <Button
      onClick={handleRequest}
      disabled={loading || !canRequest}
      variant="outline"
      className={`w-full border-amber-500/40 text-amber-500 hover:bg-amber-500/10 ${className}`}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <Gavel className="w-4 h-4 mr-2" />
      )}
      {canRequest ? `Request Judge Review (${remainingRequests}/3 today)` : 'Daily limit reached'}
    </Button>
  );
}

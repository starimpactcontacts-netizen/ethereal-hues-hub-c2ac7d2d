import { useState, useEffect } from "react";

interface CountdownTimerProps {
  endDate: string | Date;
  label?: string;
  large?: boolean;
  hideWhenExpired?: boolean;
  expiredLabel?: string;
}

export default function CountdownTimer({ 
  endDate, 
  label, 
  large = false, 
  hideWhenExpired = false,
  expiredLabel = "Ended"
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());
  const [isExpired, setIsExpired] = useState(false);

  function calculateTimeLeft() {
    const targetDate = typeof endDate === 'string' ? new Date(endDate) : endDate;
    const difference = targetDate.getTime() - new Date().getTime();
    
    if (difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
    }

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
      expired: false,
    };
  }

  useEffect(() => {
    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);
      setIsExpired(newTimeLeft.expired);
    }, 1000);

    return () => clearInterval(timer);
  }, [endDate]);

  // Hide component if expired and hideWhenExpired is true
  if (isExpired && hideWhenExpired) {
    return null;
  }

  // Show expired state
  if (isExpired) {
    if (large) {
      return (
        <div className="text-center">
          {label && (
            <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] mb-3">
              {label}
            </p>
          )}
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <span className="text-lg font-semibold">{expiredLabel}</span>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2">
        {label && (
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
            {label}
          </span>
        )}
        <span className="text-sm font-semibold text-muted-foreground">{expiredLabel}</span>
      </div>
    );
  }

  if (large) {
    return (
      <div className="text-center">
        {label && (
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] mb-3">
            {label}
          </p>
        )}
        <div className="flex items-center justify-center gap-3 font-mono">
          {timeLeft.days > 0 && (
            <div className="text-center">
              <p className="text-2xl font-bold">{String(timeLeft.days).padStart(2, "0")}</p>
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Days</p>
            </div>
          )}
          {timeLeft.days > 0 && <span className="text-xl text-muted-foreground">:</span>}
          <div className="text-center">
            <p className="text-2xl font-bold">{String(timeLeft.hours).padStart(2, "0")}</p>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Hrs</p>
          </div>
          <span className="text-xl text-muted-foreground">:</span>
          <div className="text-center">
            <p className="text-2xl font-bold">{String(timeLeft.minutes).padStart(2, "0")}</p>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Min</p>
          </div>
          <span className="text-xl text-muted-foreground">:</span>
          <div className="text-center">
            <p className="text-2xl font-bold">{String(timeLeft.seconds).padStart(2, "0")}</p>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Sec</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {label && (
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
          {label}
        </span>
      )}
      <div className="flex items-center gap-1 font-mono text-sm font-semibold">
        {timeLeft.days > 0 && (
          <>
            <span>{String(timeLeft.days).padStart(2, "0")}</span>
            <span className="text-muted-foreground">d</span>
          </>
        )}
        <span>{String(timeLeft.hours).padStart(2, "0")}</span>
        <span className="text-muted-foreground">:</span>
        <span>{String(timeLeft.minutes).padStart(2, "0")}</span>
        <span className="text-muted-foreground">:</span>
        <span>{String(timeLeft.seconds).padStart(2, "0")}</span>
      </div>
    </div>
  );
}

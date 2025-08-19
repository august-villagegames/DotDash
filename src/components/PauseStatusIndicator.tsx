
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { usePauseToggle } from "@/state/pause-toggle-store";
import { PauseToggleButton } from "@/components/PauseToggleButton";
import { cn } from "@/lib/utils";
import { Pause, AlertTriangle, Clock } from "lucide-react";

interface PauseStatusIndicatorProps {
  showReason?: boolean;
  showIcon?: boolean;
  variant?: 'banner' | 'badge' | 'tooltip';
  showResumeButton?: boolean;
  className?: string;
}

export function PauseStatusIndicator({
  showReason = true,
  showIcon = true,
  variant = 'banner',
  showResumeButton = false,
  className,
}: PauseStatusIndicatorProps) {
  const { isPaused, pauseReason, canResume, pauseTimestamp } = usePauseToggle();

  // Don't render if not paused
  if (!isPaused) return null;

  const getReasonText = () => {
    switch (pauseReason) {
      case 'user':
        return 'You have paused text expansions.';
      case 'secure-input':
        return 'Text expansions are paused due to secure input detection.';
      case 'both':
        return 'Text expansions are paused by you and secure input detection.';
      default:
        return 'Text expansions are currently paused.';
    }
  };

  const getReasonIcon = () => {
    if (!showIcon) return null;
    
    switch (pauseReason) {
      case 'secure-input':
      case 'both':
        return <AlertTriangle  />;
      default:
        return <Pause  />;
    }
  };

  const getTimeSincePause = () => {
    if (!pauseTimestamp) return null;
    
    const pauseTime = new Date(pauseTimestamp);
    const now = new Date();
    const diffMs = now.getTime() - pauseTime.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'just now';
    if (diffMins === 1) return '1 minute ago';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return '1 hour ago';
    return `${diffHours} hours ago`;
  };

  if (variant === 'badge') {
    return (
      <Badge 
        variant="secondary" 
        className={cn(
          "text-xs",
          pauseReason === 'secure-input' && "border-yellow-500 bg-yellow-50 text-yellow-800 dark:bg-yellow-950/30 dark:text-yellow-200",
          className
        )}
      >
        {getReasonIcon()}
        <span className={showIcon ? "ml-1" : ""}>
          Paused
          {showReason && pauseReason === 'secure-input' && " (secure input)"}
        </span>
      </Badge>
    );
  }

  if (variant === 'tooltip') {
    return (
      <div 
        className={cn(
          "inline-flex items-center text-xs text-muted-foreground",
          className
        )}
        title={getReasonText()}
      >
        {getReasonIcon()}
        <span className={showIcon ? "ml-1" : ""}>
          Paused
        </span>
      </div>
    );
  }

  // Banner variant (default)
  return (
    <Alert 
      variant="warning" 
      className={cn(
        "animate-in slide-in-from-top-2 duration-200",
        className
      )}
    >
      {getReasonIcon()}
      <AlertDescription>
        <div >
          <div >
            <div >
              Text expansions are paused
            </div>
            {showReason && (
              <div >
                {getReasonText()}
                {pauseTimestamp && (
                  <span >
                    <Clock  />
                    Paused {getTimeSincePause()}
                  </span>
                )}
              </div>
            )}
            {!canResume && pauseReason === 'secure-input' && (
              <div >
                Expansions will resume automatically when secure input ends.
              </div>
            )}
          </div>
          
          {showResumeButton && canResume && (
            <div >
              <PauseToggleButton 
                variant="compact" 
                showLabel={true}
                showStatus={false}
              />
            </div>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}

// Specialized component for app title bar
export function PauseTitleIndicator({ className }: { className?: string }) {
  const { isPaused, pauseReason } = usePauseToggle();

  if (!isPaused) return null;

  return (
    <span className={cn("text-xs text-muted-foreground", className)}>
      {pauseReason === 'secure-input' ? '(Auto-Paused)' : '(Paused)'}
    </span>
  );
}

// Specialized component for subtle status in corners
export function PauseCornerIndicator({ className }: { className?: string }) {
  const { isPaused, pauseReason } = usePauseToggle();

  if (!isPaused) return null;

  return (
    <div className={cn(
      "fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-200",
      className
    )}>
      <Badge 
        variant="secondary"
        className={cn(
          "shadow-lg",
          pauseReason === 'secure-input' && "border-yellow-500 bg-yellow-50 text-yellow-800 dark:bg-yellow-950/30 dark:text-yellow-200"
        )}
      >
        {pauseReason === 'secure-input' ? (
          <AlertTriangle  />
        ) : (
          <Pause  />
        )}
        Expansions Paused
      </Badge>
    </div>
  );
}
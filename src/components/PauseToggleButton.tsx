import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePauseToggle } from "@/state/pause-toggle-store";
import { cn } from "@/lib/utils";
import { Play, Pause, AlertTriangle } from "lucide-react";

interface PauseToggleButtonProps {
  variant?: 'default' | 'compact' | 'icon-only';
  showLabel?: boolean;
  showStatus?: boolean;
  className?: string;
  disabled?: boolean;
}

export function PauseToggleButton({
  variant = 'default',
  showLabel = true,
  showStatus = false,
  className,
  disabled = false,
}: PauseToggleButtonProps) {
  const { isPaused, pauseReason, canResume, togglePause } = usePauseToggle();
  const [isToggling, setIsToggling] = useState(false);

  const handleToggle = async () => {
    if (disabled || isToggling) return;
    
    setIsToggling(true);
    try {
      await togglePause();
      
      // Brief visual feedback on successful toggle
      const button = document.activeElement as HTMLButtonElement;
      if (button) {
        button.classList.add('scale-95');
        setTimeout(() => {
          button.classList.remove('scale-95');
        }, 150);
      }
    } catch (error) {
      console.error('Failed to toggle pause:', error);
      
      // Visual feedback for error
      const button = document.activeElement as HTMLButtonElement;
      if (button) {
        button.classList.add('animate-pulse', 'border-red-500');
        setTimeout(() => {
          button.classList.remove('animate-pulse', 'border-red-500');
        }, 1000);
      }
    } finally {
      setIsToggling(false);
    }
  };

  const getButtonText = () => {
    if (isToggling) return 'Updating...';
    if (isPaused) return 'Resume Expansions';
    return 'Pause Expansions';
  };

  const getButtonIcon = () => {
    if (isToggling) return null;
    if (isPaused) return <Play  />;
    return <Pause  />;
  };

  const getStatusBadge = () => {
    if (!showStatus) return null;

    const statusText = isPaused ? 'Paused' : 'Active';
    const statusVariant = isPaused ? 'secondary' : 'default';
    
    return (
      <Badge variant={statusVariant} >
        {pauseReason === 'secure-input' && <AlertTriangle  />}
        {statusText}
      </Badge>
    );
  };

  const getTooltipText = () => {
    if (isPaused) {
      switch (pauseReason) {
        case 'user':
          return 'Expansions paused by user. Click to resume.';
        case 'secure-input':
          return 'Expansions paused due to secure input detection.';
        case 'both':
          return 'Expansions paused by user and secure input detection.';
        default:
          return 'Expansions are paused. Click to resume.';
      }
    }
    return 'Expansions are active. Click to pause.';
  };

  const isDisabled = disabled || isToggling || (isPaused && !canResume);

  if (variant === 'icon-only') {
    return (
      <Button
        variant={isPaused ? "secondary" : "default"}
        size="icon"
        onClick={handleToggle}
        disabled={isDisabled}
        className={cn(className)}
        title={getTooltipText()}
        aria-label={getButtonText()}
      >
        {getButtonIcon()}
      </Button>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={cn("flex items-center", className)}>
        <Button
          variant={isPaused ? "secondary" : "default"}
          size="sm"
          onClick={handleToggle}
          disabled={isDisabled}
          
          title={getTooltipText()}
        >
          {getButtonIcon()}
          {showLabel && (
            <span >
              {isPaused ? 'Resume' : 'Pause'}
            </span>
          )}
        </Button>
        {getStatusBadge()}
      </div>
    );
  }

  // Default variant
  return (
    <div className={cn("flex items-center", className)}>
      <Button
        variant={isPaused ? "secondary" : "default"}
        onClick={handleToggle}
        disabled={isDisabled}
        title={getTooltipText()}
        className={cn(
          "transition-all duration-200 transform hover:scale-105 active:scale-95",
          isPaused && "border-yellow-500 bg-yellow-50 text-yellow-800 hover:bg-yellow-100 dark:bg-yellow-950/30 dark:text-yellow-200 dark:hover:bg-yellow-950/50",
          isToggling && "animate-pulse"
        )}
      >
        {getButtonIcon()}
        {showLabel && (
          <span >
            {getButtonText()}
          </span>
        )}
      </Button>
      {getStatusBadge()}
    </div>
  );
}

// Additional helper component for status-only display
export function PauseStatusBadge({ className }: { className?: string }) {
  const { isPaused, pauseReason } = usePauseToggle();

  if (!isPaused) return null;

  const getStatusText = () => {
    switch (pauseReason) {
      case 'user':
        return 'Paused by user';
      case 'secure-input':
        return 'Paused (secure input)';
      case 'both':
        return 'Paused (user + secure)';
      default:
        return 'Paused';
    }
  };

  return (
    <Badge 
      variant="secondary" 
      className={cn("text-xs", className)}
    >
      {pauseReason === 'secure-input' && <AlertTriangle  />}
      {getStatusText()}
    </Badge>
  );
}
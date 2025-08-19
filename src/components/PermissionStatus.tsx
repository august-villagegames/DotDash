import React from 'react';
import { usePermissionFlow } from '@/hooks/usePermissionFlow';

interface PermissionStatusProps {
  onStatusChange: (granted: boolean) => void;
  children?: (status: {
    isGranted: boolean;
    isLoading: boolean;
    error: string | null;
  }) => React.ReactNode;
}

/**
 * PermissionStatus component handles permission status detection and polling.
 * It provides status updates to parent components and can render children
 * with the current permission state.
 * 
 * Note: Polling interval is managed by the usePermissionFlow hook (1.5s default).
 */
export function PermissionStatus({ 
  onStatusChange, 
  children 
}: PermissionStatusProps) {
  const { isGranted, isLoading, error } = usePermissionFlow();
  const previousGrantedRef = React.useRef<boolean | null>(null);

  // Notify parent component when status changes
  React.useEffect(() => {
    if (previousGrantedRef.current !== isGranted) {
      onStatusChange(isGranted);
      previousGrantedRef.current = isGranted;
    }
  }, [isGranted, onStatusChange]);

  // If children render prop is provided, use it
  if (children) {
    return <>{children({ isGranted, isLoading, error })}</>;
  }

  // Default: render nothing (headless component)
  return null;
}

export default PermissionStatus;
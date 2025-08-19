import { useState, useEffect, useCallback, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { openUrl } from '@tauri-apps/plugin-opener';

export interface UsePermissionFlowReturn {
  isGranted: boolean;
  isLoading: boolean;
  error: string | null;
  retryCount: number;
  openSystemSettings: () => Promise<void>;
  checkPermission: () => Promise<void>;
  retryPermissionCheck: () => Promise<void>;
  resetError: () => void;
}

interface PermissionFlowState {
  isGranted: boolean;
  isLoading: boolean;
  error: string | null;
  retryCount: number;
}

const MACOS_ACCESSIBILITY_SETTINGS_URL = 'x-apple.systempreferences:com.apple.preference.universalaccess';
const DEFAULT_POLLING_INTERVAL = 1500; // 1.5 seconds, matching existing implementation
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_BASE_DELAY = 1000; // 1 second base delay for exponential backoff

export function usePermissionFlow(): UsePermissionFlowReturn {
  const [state, setState] = useState<PermissionFlowState>({
    isGranted: false,
    isLoading: true,
    error: null,
    retryCount: 0,
  });

  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  const checkPermission = useCallback(async (isRetry = false) => {
    if (!isMountedRef.current) return;

    try {
      setState(prev => ({ 
        ...prev, 
        isLoading: true, 
        error: null,
        retryCount: isRetry ? prev.retryCount + 1 : 0
      }));
      
      const isGranted = await invoke<boolean>('check_accessibility');
      
      if (isMountedRef.current) {
        setState(prev => ({
          ...prev,
          isGranted,
          isLoading: false,
          retryCount: 0, // Reset retry count on success
        }));
      }
    } catch (error) {
      if (isMountedRef.current) {
        const currentRetryCount = isRetry ? state.retryCount + 1 : 1;
        
        if (currentRetryCount < MAX_RETRY_ATTEMPTS) {
          // Retry with exponential backoff
          const delay = RETRY_BASE_DELAY * Math.pow(2, currentRetryCount - 1);
          
          setTimeout(() => {
            if (isMountedRef.current) {
              void checkPermission(true);
            }
          }, delay);
          
          setState(prev => ({
            ...prev,
            isLoading: true,
            retryCount: currentRetryCount,
            error: `Checking permissions... (attempt ${currentRetryCount}/${MAX_RETRY_ATTEMPTS})`,
          }));
        } else {
          // Max retries reached
          setState(prev => ({
            ...prev,
            isLoading: false,
            retryCount: currentRetryCount,
            error: 'Unable to check accessibility permissions. Please try refreshing or check your system settings.',
          }));
        }
      }
    }
  }, [state.retryCount]);

  const openSystemSettings = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, error: null }));
      await openUrl(MACOS_ACCESSIBILITY_SETTINGS_URL);
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Failed to open system settings. Please manually navigate to System Preferences > Privacy & Security > Accessibility',
      }));
    }
  }, []);

  const resetError = useCallback(() => {
    setState(prev => ({ ...prev, error: null, retryCount: 0 }));
  }, []);

  const retryPermissionCheck = useCallback(async () => {
    setState(prev => ({ ...prev, retryCount: 0 }));
    await checkPermission(false);
  }, [checkPermission]);

  const startPolling = useCallback(() => {
    // Clear any existing interval
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    // Start polling for permission status
    pollingIntervalRef.current = setInterval(() => {
      void checkPermission();
    }, DEFAULT_POLLING_INTERVAL);
  }, [checkPermission]);

  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  // Initial permission check and start polling
  useEffect(() => {
    void checkPermission();
    startPolling();

    return () => {
      isMountedRef.current = false;
      stopPolling();
    };
  }, [checkPermission, startPolling, stopPolling]);

  // Note: We continue polling even when permission is granted to detect revocation
  // This ensures we can handle requirement 3.4: graceful handling of permission revocation

  return {
    isGranted: state.isGranted,
    isLoading: state.isLoading,
    error: state.error,
    retryCount: state.retryCount,
    openSystemSettings,
    checkPermission,
    retryPermissionCheck,
    resetError,
  };
}
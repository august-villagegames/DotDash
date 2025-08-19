import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { mockInvoke, mockListen, shouldUseMocks } from "@/lib/dev-mocks";

interface PauseState {
  isPaused: boolean;
  pauseReason: 'user' | 'secure-input' | 'both' | 'none';
  canResume: boolean;
  pauseTimestamp?: string;
}

interface PauseActions {
  togglePause: () => Promise<void>;
  pauseExpansions: () => Promise<void>;
  resumeExpansions: () => Promise<void>;
  refreshPauseState: () => Promise<void>;
}

interface PauseStateInfo {
  is_paused: boolean;
  paused_by_user: boolean;
  paused_by_secure_input: boolean;
  pause_timestamp?: string;
  can_resume: boolean;
}

type PauseContextValue = PauseState & PauseActions;

const PauseToggleContext = createContext<PauseContextValue | null>(null);

function mapPauseReason(pausedByUser: boolean, pausedBySecureInput: boolean): PauseState['pauseReason'] {
  if (pausedByUser && pausedBySecureInput) return 'both';
  if (pausedByUser) return 'user';
  if (pausedBySecureInput) return 'secure-input';
  return 'none';
}

export function PauseToggleProvider({ children }: { children: React.ReactNode }) {
  const [pauseState, setPauseState] = useState<PauseState>({
    isPaused: false,
    pauseReason: 'none',
    canResume: true,
  });

  // Refresh pause state from backend with throttling
  const refreshPauseState = useCallback(async () => {
    try {
      const stateInfo = await invoke<PauseStateInfo>('get_pause_state');
      
      // Only update state if it actually changed
      setPauseState(prev => {
        const newState = {
          isPaused: stateInfo.is_paused,
          pauseReason: mapPauseReason(stateInfo.paused_by_user, stateInfo.paused_by_secure_input),
          canResume: stateInfo.can_resume,
          pauseTimestamp: stateInfo.pause_timestamp,
        };
        
        // Shallow comparison to avoid unnecessary re-renders
        if (prev.isPaused === newState.isPaused && 
            prev.pauseReason === newState.pauseReason &&
            prev.canResume === newState.canResume) {
          return prev;
        }
        
        return newState;
      });
    } catch (error) {
      console.error('Failed to refresh pause state:', error);
    }
  }, []);

  // Initialize pause state on mount
  useEffect(() => {
    refreshPauseState();
  }, [refreshPauseState]);

  // Listen for pause state changes from backend
  useEffect(() => {
    const setupPauseListeners = async () => {
      try {
        // Listen for pause state changes from tray or other sources
        const unlistenPause = await listen('pause-state-changed', () => {
          refreshPauseState();
        });

        // Listen for secure input detection events
        const listenFn = shouldUseMocks() ? mockListen : listen;
        const invokeFn = shouldUseMocks() ? mockInvoke : invoke;
        
        const unlistenSecure = await listenFn('secure-input-detected', (event) => {
          const { detected } = event.payload as { detected: boolean };
          invokeFn('set_pause_state', { 
            paused: detected, 
            byUser: false 
          }).then(() => {
            refreshPauseState();
          }).catch(error => {
            console.error('Failed to handle secure input detection:', error);
          });
        });

        return () => {
          unlistenPause();
          unlistenSecure();
        };
      } catch (error) {
        console.error('Failed to setup pause listeners:', error);
      }
    };

    setupPauseListeners();
  }, [refreshPauseState]);

  const togglePause = useCallback(async () => {
    const startTime = performance.now();
    
    try {
      const newState = await invoke<boolean>('toggle_global_pause');
      
      setPauseState(prev => ({
        ...prev,
        isPaused: newState,
        pauseReason: newState ? 'user' : 'none',
        canResume: true,
        pauseTimestamp: newState ? new Date().toISOString() : undefined,
      }));
      
      const duration = performance.now() - startTime;
      if (duration > 100) {
        console.warn(`Pause toggle took ${duration.toFixed(2)}ms`);
      }
    } catch (error) {
      console.error('Failed to toggle pause:', error);
      // Refresh state to ensure consistency
      refreshPauseState();
    }
  }, [refreshPauseState]);

  const pauseExpansions = useCallback(async () => {
    try {
      const invokeFn = shouldUseMocks() ? mockInvoke : invoke;
      await invokeFn('set_pause_state', { 
        paused: true, 
        byUser: true 
      });
      
      setPauseState(prev => ({
        ...prev,
        isPaused: true,
        pauseReason: prev.pauseReason === 'secure-input' ? 'both' : 'user',
        canResume: true,
        pauseTimestamp: new Date().toISOString(),
      }));
    } catch (error) {
      console.error('Failed to pause expansions:', error);
      refreshPauseState();
    }
  }, [refreshPauseState]);

  const resumeExpansions = useCallback(async () => {
    try {
      const invokeFn = shouldUseMocks() ? mockInvoke : invoke;
      await invokeFn('set_pause_state', { 
        paused: false, 
        byUser: true 
      });
      
      // Refresh state to get accurate pause reason after resume
      await refreshPauseState();
    } catch (error) {
      console.error('Failed to resume expansions:', error);
      refreshPauseState();
    }
  }, [refreshPauseState]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue: PauseContextValue = useMemo(() => ({
    ...pauseState,
    togglePause,
    pauseExpansions,
    resumeExpansions,
    refreshPauseState,
  }), [
    pauseState,
    togglePause,
    pauseExpansions,
    resumeExpansions,
    refreshPauseState,
  ]);

  return (
    <PauseToggleContext.Provider value={contextValue}>
      {children}
    </PauseToggleContext.Provider>
  );
}

export function usePauseToggle(): PauseContextValue {
  const context = useContext(PauseToggleContext);
  if (!context) {
    throw new Error('usePauseToggle must be used within PauseToggleProvider');
  }
  return context;
}

export type { PauseState, PauseActions };
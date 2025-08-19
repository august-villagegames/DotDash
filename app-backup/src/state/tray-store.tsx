import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

interface TrayState {
  isVisible: boolean;
  expansionEnabled: boolean;
  showInDock: boolean;
  startMinimized: boolean;
  iconState: 'active' | 'paused' | 'warning' | 'error';
}

interface TrayActions {
  toggleExpansions: () => Promise<void>;
  showMainWindow: () => Promise<void>;
  updateTrayPreferences: (prefs: Partial<TrayPreferences>) => Promise<void>;
  setIconState: (state: TrayState['iconState']) => void;
  retryTrayInitialization: () => Promise<boolean>;
}

interface TrayPreferences {
  showInDock: boolean;
  startMinimized: boolean;
  trayIconStyle: 'auto' | 'light' | 'dark';
  showNotifications: boolean;
}

type TrayContextValue = TrayState & TrayActions;

const TrayContext = createContext<TrayContextValue | null>(null);

const TRAY_STORAGE_KEY = 'dotdashdash.tray.preferences';

function loadTrayPreferences(): TrayPreferences {
  try {
    const stored = localStorage.getItem(TRAY_STORAGE_KEY);
    if (stored) {
      return { ...getDefaultTrayPreferences(), ...JSON.parse(stored) };
    }
  } catch (error) {
    console.warn('Failed to load tray preferences:', error);
  }
  return getDefaultTrayPreferences();
}

function saveTrayPreferences(prefs: TrayPreferences): void {
  try {
    localStorage.setItem(TRAY_STORAGE_KEY, JSON.stringify(prefs));
  } catch (error) {
    console.warn('Failed to save tray preferences:', error);
  }
}

function getDefaultTrayPreferences(): TrayPreferences {
  return {
    showInDock: false,
    startMinimized: true,
    trayIconStyle: 'auto',
    showNotifications: true,
  };
}

export function TrayStateProvider({ children }: { children: React.ReactNode }) {
  const [trayState, setTrayState] = useState<TrayState>(() => {
    const prefs = loadTrayPreferences();
    return {
      isVisible: false, // Will be set after checking availability
      expansionEnabled: true,
      showInDock: prefs.showInDock,
      startMinimized: prefs.startMinimized,
      iconState: 'active',
    };
  });

  // Check tray availability on mount
  useEffect(() => {
    const checkTrayAvailability = async () => {
      try {
        const available = await invoke<boolean>('is_tray_available');
        setTrayState(prev => ({ ...prev, isVisible: available }));
        
        if (!available) {
          console.warn('System tray is not available');
          // Could show a notification or fallback UI
        }
      } catch (error) {
        console.error('Failed to check tray availability:', error);
        setTrayState(prev => ({ ...prev, isVisible: false }));
      }
    };

    checkTrayAvailability();
  }, []);

  // Listen for tray events from the backend
  useEffect(() => {
    const setupTrayListeners = async () => {
      try {
        // Listen for pause state changes from tray
        const unlistenPause = await listen('pause-state-changed', () => {
          // The pause toggle provider will handle the state update
          console.log('Pause state changed from tray');
        });

        // Listen for navigation requests from tray
        const unlistenNavigate = await listen('navigate-to-diagnostics', () => {
          // This would be handled by the main app router
          console.log('Navigate to diagnostics requested from tray');
        });

        // Listen for app quit events
        const unlistenQuit = await listen('app-will-quit', () => {
          console.log('App will quit - performing cleanup');
        });

        return () => {
          unlistenPause();
          unlistenNavigate();
          unlistenQuit();
        };
      } catch (error) {
        console.error('Failed to setup tray listeners:', error);
      }
    };

    setupTrayListeners();
  }, []);

  const toggleExpansions = useCallback(async () => {
    try {
      const newState = await invoke<boolean>('toggle_expansions_from_tray');
      setTrayState(prev => ({
        ...prev,
        expansionEnabled: newState,
        iconState: newState ? 'active' : 'paused',
      }));
    } catch (error) {
      console.error('Failed to toggle expansions:', error);
      setTrayState(prev => ({ ...prev, iconState: 'error' }));
    }
  }, []);

  const showMainWindow = useCallback(async () => {
    try {
      await invoke('show_main_window');
    } catch (error) {
      console.error('Failed to show main window:', error);
    }
  }, []);

  const updateTrayPreferences = useCallback(async (prefs: Partial<TrayPreferences>) => {
    const currentPrefs = loadTrayPreferences();
    const newPrefs = { ...currentPrefs, ...prefs };
    
    try {
      saveTrayPreferences(newPrefs);
      
      setTrayState(prev => ({
        ...prev,
        showInDock: newPrefs.showInDock,
        startMinimized: newPrefs.startMinimized,
      }));

      // TODO: Call Tauri commands to update system-level preferences
      // await invoke('set_tray_preferences', { config: newPrefs });
    } catch (error) {
      console.error('Failed to update tray preferences:', error);
      // Revert state on error
      setTrayState(prev => ({
        ...prev,
        showInDock: currentPrefs.showInDock,
        startMinimized: currentPrefs.startMinimized,
      }));
    }
  }, []);

  const setIconState = useCallback(async (state: TrayState['iconState']) => {
    // Avoid unnecessary updates if state hasn't changed
    setTrayState(prev => {
      if (prev.iconState === state) {
        return prev; // No change, prevent re-render
      }
      return { ...prev, iconState: state };
    });
    
    // Update tray icon in backend (throttled on backend side)
    try {
      await invoke('update_tray_icon_state', { stateStr: state });
    } catch (error) {
      console.error('Failed to update tray icon state:', error);
    }
  }, []);

  const retryTrayInitialization = useCallback(async (): Promise<boolean> => {
    try {
      const success = await invoke<boolean>('retry_tray_initialization');
      if (success) {
        setTrayState(prev => ({ ...prev, isVisible: true, iconState: 'active' }));
        console.log('Tray initialization retry successful');
      } else {
        console.warn('Tray initialization retry failed');
      }
      return success;
    } catch (error) {
      console.error('Failed to retry tray initialization:', error);
      return false;
    }
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue: TrayContextValue = useMemo(() => ({
    ...trayState,
    toggleExpansions,
    showMainWindow,
    updateTrayPreferences,
    setIconState,
    retryTrayInitialization,
  }), [
    trayState,
    toggleExpansions,
    showMainWindow,
    updateTrayPreferences,
    setIconState,
    retryTrayInitialization,
  ]);

  return (
    <TrayContext.Provider value={contextValue}>
      {children}
    </TrayContext.Provider>
  );
}

export function useTrayState(): TrayContextValue {
  const context = useContext(TrayContext);
  if (!context) {
    throw new Error('useTrayState must be used within TrayStateProvider');
  }
  return context;
}

export type { TrayState, TrayActions, TrayPreferences };
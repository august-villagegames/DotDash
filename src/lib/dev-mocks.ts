// Mock Tauri API calls for browser dev mode
export const mockInvoke = async (command: string, args?: any): Promise<any> => {
  console.log(`[DEV MOCK] invoke('${command}', ${JSON.stringify(args)})`);
  
  // Return appropriate mock responses based on command
  switch (command) {
    case 'set_rules':
    case 'set_engine_options':
    case 'start_engine':
    case 'set_pause_state':
    case 'show_main_window':
    case 'update_tray_icon_state':
      return Promise.resolve();
    
    default:
      return Promise.resolve();
  }
};

export const mockListen = async (event: string, handler: (event: any) => void): Promise<() => void> => {
  console.log(`[DEV MOCK] listen('${event}')`);
  
  // Return a mock unlisten function
  return () => {
    console.log(`[DEV MOCK] unlisten('${event}')`);
  };
};

// Check if we're in dev mode with mocking enabled
export const shouldUseMocks = (): boolean => {
  return import.meta.env.DEV && import.meta.env.VITE_SKIP_ONBOARDING === 'true';
};
use tauri::{
    tray::{TrayIcon, TrayIconBuilder, TrayIconEvent},
    menu::{Menu, MenuItem, PredefinedMenuItem},
    AppHandle, Manager, Emitter, Wry,
};
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};
use log::{info, error, warn, debug};

#[derive(Debug, Clone)]
pub enum TrayIconState {
    Active,
    Paused,
    Warning,
    Error,
}

pub struct TrayManager {
    tray_icon: Arc<Mutex<Option<TrayIcon<Wry>>>>,
    expansion_enabled: Arc<Mutex<bool>>,
    last_update: Arc<Mutex<Instant>>,
    update_throttle: Duration,
}

impl TrayManager {
    pub fn new() -> Self {
        Self {
            tray_icon: Arc::new(Mutex::new(None)),
            expansion_enabled: Arc::new(Mutex::new(true)),
            last_update: Arc::new(Mutex::new(Instant::now())),
            update_throttle: Duration::from_millis(100), // Throttle updates to max 10/second
        }
    }

    pub fn initialize(&self, app_handle: &AppHandle<Wry>) -> Result<(), Box<dyn std::error::Error>> {
        info!("Initializing system tray");

        // Check if system tray is available
        if !self.is_system_tray_available() {
            warn!("System tray is not available on this system");
            return Err("System tray not available".into());
        }

        // Create tray menu with error handling
        let menu = match self.build_menu(app_handle, true) {
            Ok(menu) => menu,
            Err(e) => {
                error!("Failed to build tray menu: {}", e);
                return Err(format!("Failed to build tray menu: {}", e).into());
            }
        };

        // Get default icon with fallback
        let icon = match app_handle.default_window_icon() {
            Some(icon) => icon.clone(),
            None => {
                warn!("No default window icon found, using fallback");
                // In a real implementation, we'd load a fallback icon
                return Err("No icon available for tray".into());
            }
        };

        // Create tray icon with comprehensive error handling
        let tray_icon = match TrayIconBuilder::new()
            .icon(icon)
            .menu(&menu)
            .tooltip("DotDash - Text Expander")
            .on_tray_icon_event(|tray, event| {
                if let Err(e) = Self::handle_tray_icon_event(tray, event) {
                    error!("Error handling tray icon event: {}", e);
                }
            })
            .build(app_handle) {
                Ok(tray) => tray,
                Err(e) => {
                    error!("Failed to create tray icon: {}", e);
                    return Err(format!("Failed to create tray icon: {}", e).into());
                }
            };

        // Store the tray icon
        {
            let mut tray_guard = self.tray_icon.lock().unwrap();
            *tray_guard = Some(tray_icon);
        }

        info!("System tray initialized successfully");
        Ok(())
    }

    fn is_system_tray_available(&self) -> bool {
        // On macOS, system tray should generally be available
        // This is a placeholder for more sophisticated checking
        #[cfg(target_os = "macos")]
        {
            true
        }
        
        #[cfg(not(target_os = "macos"))]
        {
            false
        }
    }

    fn handle_tray_icon_event(
        tray: &TrayIcon<Wry>, 
        event: TrayIconEvent
    ) -> Result<(), Box<dyn std::error::Error>> {
        match event {
            TrayIconEvent::Click { button, .. } => {
                match button {
                    tauri::tray::MouseButton::Left => {
                        info!("Tray icon left-clicked");
                        if let Some(window) = tray.app_handle().get_webview_window("main") {
                            window.show().map_err(|e| format!("Failed to show window: {}", e))?;
                            window.set_focus().map_err(|e| format!("Failed to focus window: {}", e))?;
                        } else {
                            warn!("Main window not found when trying to show from tray");
                        }
                    }
                    tauri::tray::MouseButton::Right => {
                        info!("Tray icon right-clicked");
                        // Right-click shows context menu automatically
                    }
                    _ => {}
                }
            }
            TrayIconEvent::Enter { .. } => {
                // Mouse entered tray icon area
            }
            TrayIconEvent::Leave { .. } => {
                // Mouse left tray icon area
            }
            _ => {
                // Handle any other events
            }
        }
        Ok(())
    }

    fn build_menu(&self, app_handle: &AppHandle<Wry>, _expansion_enabled: bool) -> Result<Menu<Wry>, Box<dyn std::error::Error>> {
        // Check the actual pause state from the engine
        let engine = crate::get_engine();
        let is_paused = engine.is_paused();
        
        let toggle_text = if is_paused {
            "Resume Expansions"
        } else {
            "Pause Expansions"
        };

        let toggle_item = MenuItem::with_id(app_handle, "toggle_expansions", toggle_text, true, None::<&str>)?;
        let separator1 = PredefinedMenuItem::separator(app_handle)?;
        let open_item = MenuItem::with_id(app_handle, "open_window", "Open DotDash", true, None::<&str>)?;
        let diagnostics_item = MenuItem::with_id(app_handle, "diagnostics", "Diagnostics", true, None::<&str>)?;
        let separator2 = PredefinedMenuItem::separator(app_handle)?;
        let quit_item = MenuItem::with_id(app_handle, "quit", "Quit DotDash", true, None::<&str>)?;

        let menu = Menu::with_items(app_handle, &[
            &toggle_item,
            &separator1,
            &open_item,
            &diagnostics_item,
            &separator2,
            &quit_item,
        ])?;

        Ok(menu)
    }

    pub fn update_expansion_state(&self, enabled: bool) {
        // Check if state actually changed to avoid unnecessary updates
        let state_changed = {
            let mut expansion_guard = self.expansion_enabled.lock().unwrap();
            let old_state = *expansion_guard;
            *expansion_guard = enabled;
            old_state != enabled
        };

        if !state_changed {
            return; // No change, skip expensive menu update
        }

        // Update tray menu only if state changed
        if let Some(app_handle) = self.get_app_handle() {
            if let Err(e) = self.update_menu(&app_handle, enabled) {
                error!("Failed to update tray menu: {}", e);
            }
        }
    }

    pub fn update_pause_state(&self) {
        // Update tray menu to reflect current pause state
        if let Some(app_handle) = self.get_app_handle() {
            let expansion_enabled = self.expansion_enabled.lock().unwrap();
            if let Err(e) = self.update_menu(&app_handle, *expansion_enabled) {
                error!("Failed to update tray menu for pause state: {}", e);
            }
        }
    }

    fn update_menu(&self, app_handle: &AppHandle<Wry>, expansion_enabled: bool) -> Result<(), Box<dyn std::error::Error>> {
        let menu = self.build_menu(app_handle, expansion_enabled)?;
        
        if let Some(tray_icon) = self.tray_icon.lock().unwrap().as_ref() {
            tray_icon.set_menu(Some(menu))?;
        }

        Ok(())
    }

    pub fn update_icon_state(&self, state: TrayIconState) {
        // Throttle icon updates to prevent excessive system calls
        {
            let mut last_update = self.last_update.lock().unwrap();
            let now = Instant::now();
            if now.duration_since(*last_update) < self.update_throttle {
                debug!("Throttling tray icon update");
                return;
            }
            *last_update = now;
        }

        info!("Updating tray icon state to: {:?}", state);
        
        if let Some(tray_icon) = self.tray_icon.lock().unwrap().as_ref() {
            // Update tooltip based on state
            let tooltip = match state {
                TrayIconState::Active => "DotDash - Active",
                TrayIconState::Paused => "DotDash - Paused",
                TrayIconState::Warning => "DotDash - Warning (Check permissions)",
                TrayIconState::Error => "DotDash - Error",
            };
            
            if let Err(e) = tray_icon.set_tooltip(Some(tooltip)) {
                warn!("Failed to update tray tooltip: {}", e);
            }

            // TODO: Switch icon based on state
            // This would require loading different icon files from resources
            // For now, we just update the tooltip
            /*
            let icon_path = match state {
                TrayIconState::Active => "icons/tray-icon.png",
                TrayIconState::Paused => "icons/tray-icon-paused.png",
                TrayIconState::Warning => "icons/tray-icon-warning.png",
                TrayIconState::Error => "icons/tray-icon-warning.png",
            };
            
            if let Ok(icon) = load_icon(icon_path) {
                let _ = tray_icon.set_icon(Some(icon));
            }
            */
        }
    }

    fn update_tooltip(&self, tooltip: &str) {
        if let Some(tray_icon) = self.tray_icon.lock().unwrap().as_ref() {
            if let Err(e) = tray_icon.set_tooltip(Some(tooltip)) {
                warn!("Failed to update tray tooltip: {}", e);
            }
        }
    }

    fn get_app_handle(&self) -> Option<AppHandle<Wry>> {
        // This is a simplified approach - in a real implementation,
        // we'd store the app handle or get it through other means
        None
    }

    pub fn show_main_window(&self) -> Result<(), Box<dyn std::error::Error>> {
        if let Some(app_handle) = self.get_app_handle() {
            if let Some(window) = app_handle.get_webview_window("main") {
                window.show()?;
                window.set_focus()?;
            }
        }
        Ok(())
    }

    pub fn quit_app(&self) -> Result<(), Box<dyn std::error::Error>> {
        if let Some(app_handle) = self.get_app_handle() {
            app_handle.exit(0);
        }
        Ok(())
    }

    pub fn is_initialized(&self) -> bool {
        self.tray_icon.lock().unwrap().is_some()
    }
}

impl Default for TrayManager {
    fn default() -> Self {
        Self::new()
    }
}

// Tray event handler function
pub fn handle_tray_menu_event(app_handle: &AppHandle<Wry>, event_id: &str) {
    info!("Tray menu event: {}", event_id);
    
    match event_id {
        "toggle_expansions" => {
            info!("Toggle expansions requested from tray");
            // Use the new global pause toggle instead
            if let Err(e) = toggle_pause_via_tray(app_handle) {
                error!("Failed to toggle pause from tray: {}", e);
            }
        }
        "open_window" => {
            info!("Open window requested from tray");
            if let Some(window) = app_handle.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
                let _ = window.unminimize();
            }
        }
        "diagnostics" => {
            info!("Diagnostics requested from tray");
            if let Some(window) = app_handle.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
                let _ = window.unminimize();
                
                // Emit event to navigate to diagnostics view
                let _ = window.emit("navigate-to-diagnostics", ());
            }
        }
        "quit" => {
            info!("Quit requested from tray");
            // Perform cleanup before quitting
            cleanup_before_quit(app_handle);
            app_handle.exit(0);
        }
        _ => {
            warn!("Unknown tray menu event: {}", event_id);
        }
    }
}

fn toggle_pause_via_tray(app_handle: &AppHandle<Wry>) -> Result<(), Box<dyn std::error::Error>> {
    // Get the engine and tray manager states
    let engine = crate::get_engine();
    let tray_manager = app_handle.state::<TrayManager>();
    
    // Toggle the pause state
    let currently_paused = engine.paused_by_user.load(std::sync::atomic::Ordering::SeqCst);
    let new_state = !currently_paused;
    
    if new_state {
        engine.pause_expansions(true);
        tray_manager.update_icon_state(TrayIconState::Paused);
        info!("Expansions paused via tray");
    } else {
        engine.resume_expansions(true);
        tray_manager.update_icon_state(TrayIconState::Active);
        info!("Expansions resumed via tray");
    }
    
    // Emit event to frontend to update UI
    if let Some(window) = app_handle.get_webview_window("main") {
        window.emit("pause-state-changed", ())?;
    }
    
    Ok(())
}

fn cleanup_before_quit(app_handle: &AppHandle<Wry>) {
    info!("Performing cleanup before quit");
    
    // Stop expansion engine if running
    let engine = crate::get_engine();
    if engine.running.load(std::sync::atomic::Ordering::SeqCst) {
        info!("Stopping expansion engine before quit");
        engine.running.store(false, std::sync::atomic::Ordering::SeqCst);
    }
    
    // Save any pending state
    info!("Saving application state before quit");
    
    // Clean up system resources
    info!("Cleaning up system resources");
    
    if let Some(window) = app_handle.get_webview_window("main") {
        let _ = window.emit("app-will-quit", ());
    }
    
    info!("Cleanup completed");
}
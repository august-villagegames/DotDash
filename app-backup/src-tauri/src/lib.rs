// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use tauri::{State, Manager};
use std::sync::{Mutex, Arc};
use std::thread;
use std::time::Duration;
use log::{info, debug, warn, error};

mod tray;
use tray::{TrayManager, handle_tray_menu_event};

use serde::{Deserialize, Serialize};
use once_cell::sync::OnceCell;
use enigo::KeyboardControllable;
use std::sync::atomic::{AtomicBool, Ordering, AtomicUsize};
use std::ffi::c_void;
use core_foundation::runloop::{CFRunLoopAddSource, CFRunLoopGetCurrent, CFRunLoopRun, kCFRunLoopDefaultMode};
use core_foundation::base::TCFType;

#[derive(Default, Clone)]
struct AppLogState {
    entries: Arc<Mutex<Vec<String>>>,
}

fn log_line(state: &State<AppLogState>, line: impl AsRef<str>) {
    let mut entries = state.entries.lock().unwrap();
    let msg = format!("{}", line.as_ref());
    info!("{}", msg);
    entries.push(msg);
    if entries.len() > 1000 { entries.remove(0); }
}

#[tauri::command]
fn get_logs(state: State<AppLogState>) -> Vec<String> {
    state.entries.lock().unwrap().clone()
}

#[tauri::command]
fn greet(state: State<AppLogState>, name: &str) -> String {
    log_line(&state, format!("greet called with name={}", name));
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn check_accessibility(state: State<AppLogState>) -> bool {
    #[cfg(target_os = "macos")]
    {
        log_line(&state, "check_accessibility: calling AXIsProcessTrusted()");
        let trusted = macos_accessibility::is_trusted();
        log_line(&state, format!("check_accessibility: trusted={}", trusted));
        return trusted;
    }
    #[allow(unreachable_code)]
    {
        log_line(&state, "check_accessibility: not macOS, returning false");
        false
    }
}

#[tauri::command]
fn prompt_accessibility(state: State<AppLogState>) -> bool {
    #[cfg(target_os = "macos")]
    {
        log_line(&state, "prompt_accessibility: calling AXIsProcessTrustedWithOptions(prompt=true)");
        let trusted = macos_accessibility::prompt_and_check();
        log_line(&state, format!("prompt_accessibility: trusted={}", trusted));
        return trusted;
    }
    #[allow(unreachable_code)]
    {
        log_line(&state, "prompt_accessibility: not macOS, returning false");
        false
    }
}

// ===== Expansion engine state =====

#[derive(Debug, Clone, Serialize, Deserialize)]
struct RuleDto {
    command: String,
    replacementText: String,
}

#[derive(Clone)]
struct EngineState {
    rules: Arc<Mutex<Vec<RuleDto>>>,
    running: Arc<AtomicBool>,
    verbose: Arc<AtomicBool>,
    injecting: Arc<AtomicBool>,
    dry_run: Arc<AtomicBool>,
    event_count: Arc<AtomicUsize>,
    // Pause functionality
    paused_by_user: Arc<AtomicBool>,
    paused_by_secure_input: Arc<AtomicBool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum PauseReason {
    UserRequested,
    SecureInput,
    Both,
    NotPaused,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PauseStateInfo {
    pub is_paused: bool,
    pub paused_by_user: bool,
    pub paused_by_secure_input: bool,
    pub pause_timestamp: Option<String>,
    pub can_resume: bool,
}

impl Default for EngineState {
    fn default() -> Self {
        Self {
            rules: Arc::new(Mutex::new(Vec::new())),
            running: Arc::new(AtomicBool::new(false)),
            verbose: Arc::new(AtomicBool::new(false)),
            injecting: Arc::new(AtomicBool::new(false)),
            dry_run: Arc::new(AtomicBool::new(true)),
            event_count: Arc::new(AtomicUsize::new(0)),
            paused_by_user: Arc::new(AtomicBool::new(false)),
            paused_by_secure_input: Arc::new(AtomicBool::new(false)),
        }
    }
}

impl EngineState {
    pub fn pause_expansions(&self, by_user: bool) {
        if by_user {
            self.paused_by_user.store(true, Ordering::SeqCst);
            info!("Expansions paused by user");
        } else {
            self.paused_by_secure_input.store(true, Ordering::SeqCst);
            info!("Expansions paused by secure input detection");
        }
    }

    pub fn resume_expansions(&self, by_user: bool) {
        if by_user {
            self.paused_by_user.store(false, Ordering::SeqCst);
            info!("Expansions resumed by user");
        } else {
            self.paused_by_secure_input.store(false, Ordering::SeqCst);
            info!("Expansions resumed after secure input ended");
        }
    }

    pub fn is_paused(&self) -> bool {
        self.paused_by_user.load(Ordering::SeqCst) || 
        self.paused_by_secure_input.load(Ordering::SeqCst)
    }

    pub fn get_pause_reason(&self) -> PauseReason {
        let user_paused = self.paused_by_user.load(Ordering::SeqCst);
        let secure_paused = self.paused_by_secure_input.load(Ordering::SeqCst);

        match (user_paused, secure_paused) {
            (true, true) => PauseReason::Both,
            (true, false) => PauseReason::UserRequested,
            (false, true) => PauseReason::SecureInput,
            (false, false) => PauseReason::NotPaused,
        }
    }

    pub fn get_pause_state_info(&self) -> PauseStateInfo {
        let user_paused = self.paused_by_user.load(Ordering::SeqCst);
        let secure_paused = self.paused_by_secure_input.load(Ordering::SeqCst);
        let is_paused = user_paused || secure_paused;

        PauseStateInfo {
            is_paused,
            paused_by_user: user_paused,
            paused_by_secure_input: secure_paused,
            pause_timestamp: if is_paused { 
                Some(chrono::Utc::now().to_rfc3339()) 
            } else { 
                None 
            },
            can_resume: user_paused, // Can only manually resume user-initiated pauses
        }
    }
}

static ENGINE: OnceCell<EngineState> = OnceCell::new();

fn get_engine() -> &'static EngineState {
    ENGINE.get_or_init(|| EngineState::default())
}

fn push_log(entries: &Arc<Mutex<Vec<String>>>, line: &str) {
    // Also send to tauri-plugin-log → Console/DotDashDash.log
    info!("{}", line);
    if let Ok(mut v) = entries.lock() {
        v.push(line.to_string());
        if v.len() > 1000 { let _ = v.remove(0); }
    }
}

#[tauri::command]
fn set_rules(state: State<AppLogState>, rules: Vec<RuleDto>) {
    let engine = get_engine();
    {
        let mut w = engine.rules.lock().unwrap();
        *w = rules;
    }
    log_line(&state, &format!("set_rules: updated rules in engine ({} rules)", get_engine().rules.lock().map(|r| r.len()).unwrap_or(0)));
}

#[tauri::command]
fn start_engine(state: State<AppLogState>, verbose: Option<bool>) -> bool {
    let engine = get_engine().clone();
    if engine.running.load(Ordering::SeqCst) {
        log_line(&state, "start_engine: already running");
        return true;
    }
    if let Some(v) = verbose { engine.verbose.store(v, Ordering::SeqCst); }
    engine.running.store(true, Ordering::SeqCst);

    // Clone for thread
    let log_entries = state.entries.clone();
    thread::spawn(move || {
        push_log(&log_entries, "engine: starting key listener thread (CGEventTap)");

        // Rolling buffer stored behind Arc for callback
        let buffer = Arc::new(Mutex::new(String::new()));

        // Prepare callback state
        #[repr(C)]
        struct CallbackState {
            engine: EngineState,
            logs: Arc<Mutex<Vec<String>>>,
            buffer: Arc<Mutex<String>>,
        }

        extern "C" fn tap_callback(
            _proxy: *mut c_void,
            event_type: u32,
            event: *mut c_void,
            user_info: *mut c_void,
        ) -> *mut c_void {
            // kCGEventKeyDown = 10
            if event_type != 10 { return event; }
            let state = unsafe { &*(user_info as *const CallbackState) };
            if !state.engine.running.load(Ordering::SeqCst) { return event; }
            if state.engine.injecting.load(Ordering::SeqCst) { return event; }
            // Fast pause check - avoid method call overhead
            if state.engine.paused_by_user.load(Ordering::SeqCst) || 
               state.engine.paused_by_secure_input.load(Ordering::SeqCst) { 
                return event; 
            }

            // Extract unicode from event
            extern "C" {
                fn CGEventKeyboardGetUnicodeString(
                    event: *mut c_void,
                    max_string_length: usize,
                    actual_string_length: *mut usize,
                    unicode_string: *mut u16,
                );
            }
            let mut buf: [u16; 8] = [0; 8];
            let mut len: usize = 0;
            unsafe { CGEventKeyboardGetUnicodeString(event, buf.len(), &mut len, buf.as_mut_ptr()); }
            let ch = String::from_utf16_lossy(&buf[..len]);

            state.engine.event_count.fetch_add(1, Ordering::SeqCst);
            if state.engine.verbose.load(Ordering::SeqCst) {
                push_log(&state.logs, &format!("engine: key ch='{}'", ch));
            }

            // Update buffer and try match
            if let Ok(mut b) = state.buffer.lock() {
                if ch == "\u{8}" { let _ = b.pop(); return event; }
                b.push_str(&ch);
                if b.len() > 128 { let drain_to = b.len() - 128; b.drain(..drain_to); }

                let is_delim = ch == " " || ch == "\n" || ch == "\t";
                if is_delim {
                    let rules = state.engine.rules.lock().unwrap().clone();
                    for rule in rules {
                        // Require delimiter after trigger to avoid partial matches
                        if b.ends_with(&(rule.command.clone() + &ch)) {
                            push_log(&state.logs, &format!("engine: matched rule '{}'", rule.command));
                            let mut backspaces = rule.command.chars().count();
                            backspaces += 1; // include delimiter
                            if state.engine.dry_run.load(Ordering::SeqCst) {
                                push_log(&state.logs, &format!(
                                    "engine: DRY-RUN would delete {} and type {} chars",
                                    backspaces,
                                    rule.replacementText.chars().count()
                                ));
                            } else {
                                state.engine.injecting.store(true, Ordering::SeqCst);
                                let mut en = enigo::Enigo::new();
                                for _ in 0..backspaces { let _ = en.key_click(enigo::Key::Backspace); }
                                en.key_sequence(&rule.replacementText);
                                std::thread::sleep(Duration::from_millis(10));
                                state.engine.injecting.store(false, Ordering::SeqCst);
                            }
                            b.clear();
                            break;
                        }
                    }
                }
            }

            event
        }

        unsafe {
            // CoreGraphics / CoreFoundation symbols
            extern "C" {
                fn CGEventTapCreate(tap: u32, place: u32, options: u32, events_of_interest: u64, callback: extern "C" fn(*mut c_void, u32, *mut c_void, *mut c_void) -> *mut c_void, user_info: *mut c_void) -> *mut c_void;
                fn CFMachPortCreateRunLoopSource(allocator: *const c_void, port: *mut c_void, order: isize) -> *mut c_void;
                fn CFRunLoopGetCurrent() -> *mut c_void;
                fn CFRunLoopAddSource(rl: *mut c_void, source: *mut c_void, mode: *const c_void);
                static kCFRunLoopDefaultMode: *const c_void;
                fn CFRunLoopRun();
                fn CGEventTapEnable(tap: *mut c_void, enable: bool);
            }

            // Create one tap: try Session first; if it fails, fall back to HID
            let state_ptr = Box::into_raw(Box::new(CallbackState { engine: engine.clone(), logs: log_entries.clone(), buffer: buffer.clone() })) as *mut c_void;
            let mut chosen_tap: *mut c_void = std::ptr::null_mut();
            let tap_session = CGEventTapCreate(1, 0, 1, 1u64 << 10, tap_callback, state_ptr);
            if tap_session.is_null() {
                push_log(&log_entries, "engine: CGEventTapCreate Session failed; trying HID");
                let tap_hid = CGEventTapCreate(0, 0, 1, 1u64 << 10, tap_callback, state_ptr);
                if tap_hid.is_null() {
                    push_log(&log_entries, "engine: CGEventTapCreate HID failed; no tap installed");
                } else {
                    push_log(&log_entries, "engine: CGEventTapCreate HID ok");
                    chosen_tap = tap_hid;
                }
            } else {
                push_log(&log_entries, "engine: CGEventTapCreate Session ok");
                chosen_tap = tap_session;
            }

            let rl = CFRunLoopGetCurrent();
            if !chosen_tap.is_null() {
                let source = CFMachPortCreateRunLoopSource(std::ptr::null(), chosen_tap, 0);
                CFRunLoopAddSource(rl, source, kCFRunLoopDefaultMode);
                CGEventTapEnable(chosen_tap, true);
            }

            // Periodic heartbeat to confirm events arrival
            {
                let logs = log_entries.clone();
                let engine_clone = engine.clone();
                thread::spawn(move || {
                    for _ in 0..10 {
                        let n = engine_clone.event_count.load(Ordering::SeqCst);
                        push_log(&logs, &format!("engine: heartbeat events={} running={}", n, engine_clone.running.load(Ordering::SeqCst)));
                        thread::sleep(Duration::from_secs(3));
                    }
                });
            }

            push_log(&log_entries, "engine: tap setup complete; entering CFRunLoopRun()");
            CFRunLoopRun();
        }

        // never returns
    });

    log_line(&state, "start_engine: started");
    true
}

#[tauri::command]
fn set_engine_options(state: State<AppLogState>, verbose: Option<bool>, dry_run: Option<bool>) {
    let engine = get_engine();
    if let Some(v) = verbose { engine.verbose.store(v, Ordering::SeqCst); }
    if let Some(d) = dry_run { engine.dry_run.store(d, Ordering::SeqCst); }
    log_line(&state, &format!("set_engine_options: verbose={} dry_run=\"{}\"",
        engine.verbose.load(Ordering::SeqCst), engine.dry_run.load(Ordering::SeqCst)));
}

#[tauri::command]
fn inject_text_now(state: State<AppLogState>, text: String) {
    let engine = get_engine();
    engine.injecting.store(true, Ordering::SeqCst);
    let mut enigo = enigo::Enigo::new();
    push_log(&state.entries, &format!("inject_text_now: typing {} chars", text.len()));
    enigo.key_sequence(&text);
    thread::sleep(Duration::from_millis(10));
    engine.injecting.store(false, Ordering::SeqCst);
}

#[tauri::command]
fn toggle_global_pause(
    state: State<AppLogState>,
    tray_manager: State<TrayManager>
) -> Result<bool, String> {
    let engine = get_engine();
    let currently_paused = engine.paused_by_user.load(Ordering::SeqCst);
    let new_state = !currently_paused;
    
    if new_state {
        engine.pause_expansions(true);
        tray_manager.update_icon_state(crate::tray::TrayIconState::Paused);
        push_log(&state.entries, "Global pause: Expansions paused by user");
    } else {
        engine.resume_expansions(true);
        tray_manager.update_icon_state(crate::tray::TrayIconState::Active);
        push_log(&state.entries, "Global pause: Expansions resumed by user");
    }
    
    Ok(new_state)
}

#[tauri::command]
fn get_pause_state(state: State<AppLogState>) -> Result<PauseStateInfo, String> {
    let engine = get_engine();
    let pause_info = engine.get_pause_state_info();
    
    push_log(&state.entries, &format!(
        "get_pause_state: paused={}, reason={:?}", 
        pause_info.is_paused, 
        engine.get_pause_reason()
    ));
    
    Ok(pause_info)
}

#[tauri::command]
fn set_pause_state(
    paused: bool,
    by_user: Option<bool>,
    state: State<AppLogState>,
    tray_manager: State<TrayManager>
) -> Result<(), String> {
    let engine = get_engine();
    let is_user_action = by_user.unwrap_or(true);
    
    if paused {
        engine.pause_expansions(is_user_action);
        tray_manager.update_icon_state(crate::tray::TrayIconState::Paused);
        let reason = if is_user_action { "user" } else { "secure input" };
        push_log(&state.entries, &format!("set_pause_state: Paused by {}", reason));
    } else {
        engine.resume_expansions(is_user_action);
        // Only update tray to active if not paused by other means
        if !engine.is_paused() {
            tray_manager.update_icon_state(crate::tray::TrayIconState::Active);
        }
        let reason = if is_user_action { "user" } else { "secure input ended" };
        push_log(&state.entries, &format!("set_pause_state: Resumed by {}", reason));
    }
    
    Ok(())
}

#[tauri::command]
fn show_main_window(app_handle: tauri::AppHandle) -> Result<(), String> {
    if let Some(window) = app_handle.get_webview_window("main") {
        window.show().map_err(|e| e.to_string())?;
        window.set_focus().map_err(|e| e.to_string())?;
        Ok(())
    } else {
        Err("Main window not found".to_string())
    }
}

#[tauri::command]
fn toggle_expansions_from_tray(
    state: State<AppLogState>,
    tray_manager: State<TrayManager>
) -> Result<bool, String> {
    let engine = get_engine();
    let current_state = engine.running.load(Ordering::SeqCst);
    let new_state = !current_state;
    
    engine.running.store(new_state, Ordering::SeqCst);
    tray_manager.update_expansion_state(new_state);
    
    let status = if new_state { "enabled" } else { "disabled" };
    push_log(&state.entries, &format!("Expansions {} from tray", status));
    
    Ok(new_state)
}

#[tauri::command]
fn update_tray_icon_state(
    state_str: String,
    tray_manager: State<TrayManager>
) -> Result<(), String> {
    use crate::tray::TrayIconState;
    
    let state = match state_str.as_str() {
        "active" => TrayIconState::Active,
        "paused" => TrayIconState::Paused,
        "warning" => TrayIconState::Warning,
        "error" => TrayIconState::Error,
        _ => return Err(format!("Invalid tray icon state: {}", state_str)),
    };
    
    tray_manager.update_icon_state(state);
    Ok(())
}

#[tauri::command]
fn is_tray_available(tray_manager: State<TrayManager>) -> bool {
    // Check if tray is currently available and initialized
    tray_manager.tray_icon.lock().unwrap().is_some()
}

#[tauri::command]
fn retry_tray_initialization(
    app_handle: tauri::AppHandle,
    tray_manager: State<TrayManager>
) -> Result<bool, String> {
    info!("Retrying tray initialization");
    
    match tray_manager.initialize(&app_handle) {
        Ok(()) => {
            info!("Tray initialization retry successful");
            Ok(true)
        }
        Err(e) => {
            error!("Tray initialization retry failed: {}", e);
            Ok(false)
        }
    }
}

// rdev mapping removed; CGEventKeyboardGetUnicodeString provides characters

#[cfg(target_os = "macos")]
mod macos_accessibility {
    use core_foundation::base::TCFType;
    use core_foundation::boolean::CFBoolean;
    use core_foundation::dictionary::CFMutableDictionary;
    use core_foundation::string::CFString;

    #[link(name = "ApplicationServices", kind = "framework")]
    extern "C" {
        fn AXIsProcessTrusted() -> bool;
        fn AXIsProcessTrustedWithOptions(options: *const std::ffi::c_void) -> bool;
    }

    pub fn is_trusted() -> bool {
        unsafe { AXIsProcessTrusted() }
    }

    pub fn prompt_and_check() -> bool {
        unsafe {
            let key = CFString::new("kAXTrustedCheckOptionPrompt");
            let value = CFBoolean::true_value();
            let mut dict = CFMutableDictionary::new();
            dict.add(&key, &value);
            let dict = dict.to_immutable();
            AXIsProcessTrustedWithOptions(dict.as_concrete_TypeRef() as *const std::ffi::c_void)
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_log::Builder::default().level(log::LevelFilter::Debug).build())
        .manage(AppLogState::default())
        .manage(TrayManager::new())
        .setup(|app| {
            // Initialize system tray with fallback
            let tray_manager = app.state::<TrayManager>();
            let tray_initialized = match tray_manager.initialize(app.handle()) {
                Ok(()) => {
                    info!("System tray initialized successfully");
                    true
                }
                Err(e) => {
                    error!("Failed to initialize system tray: {}", e);
                    warn!("Falling back to dock-only mode");
                    false
                }
            };

            // Handle window visibility based on tray availability
            if let Some(window) = app.get_webview_window("main") {
                if tray_initialized {
                    // Hide main window on startup (will be shown via tray)
                    let _ = window.hide();
                } else {
                    // Keep window visible if tray is not available
                    let _ = window.show();
                    warn!("System tray not available - keeping main window visible");
                }
            }

            // Store tray availability status for frontend
            // This could be used to show/hide tray-related UI elements
            
            Ok(())
        })
        .on_menu_event(|app, event| {
            handle_tray_menu_event(app, event.id().as_ref());
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            get_logs,
            check_accessibility,
            prompt_accessibility,
            set_rules,
            start_engine,
            set_engine_options,
            inject_text_now,
            toggle_global_pause,
            get_pause_state,
            set_pause_state,
            show_main_window,
            toggle_expansions_from_tray,
            update_tray_icon_state,
            is_tray_available,
            retry_tray_initialization
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

use serde::Serialize;
use std::sync::{Mutex, OnceLock};
use tauri::{
    webview::{PageLoadEvent, WebviewBuilder},
    AppHandle, Emitter, LogicalPosition, LogicalSize, Manager, Url, WebviewUrl,
};

const SHIELDS_SCRIPT: &str = include_str!("shields.js");

#[derive(Clone, Copy)]
struct ShieldConfig {
    enabled: bool,
    block_trackers: bool,
    fast_forward_youtube_ads: bool,
}

impl Default for ShieldConfig {
    fn default() -> Self {
        Self {
            enabled: true,
            block_trackers: true,
            fast_forward_youtube_ads: true,
        }
    }
}

static SHIELD_CONFIG: OnceLock<Mutex<ShieldConfig>> = OnceLock::new();

fn shield_config() -> &'static Mutex<ShieldConfig> {
    SHIELD_CONFIG.get_or_init(|| Mutex::new(ShieldConfig::default()))
}

fn current_shield_config() -> ShieldConfig {
    shield_config()
        .lock()
        .map(|config| *config)
        .unwrap_or_default()
}

fn build_shields_script(config: ShieldConfig) -> String {
    SHIELDS_SCRIPT
        .replace("__W3B_ENABLED__", if config.enabled { "true" } else { "false" })
        .replace(
            "__W3B_BLOCK_TRACKERS__",
            if config.block_trackers { "true" } else { "false" },
        )
        .replace(
            "__W3B_FAST_FORWARD_YOUTUBE_ADS__",
            if config.fast_forward_youtube_ads { "true" } else { "false" },
        )
}

fn apply_shields(webview: &tauri::Webview) -> Result<(), String> {
    webview
        .eval(&build_shields_script(current_shield_config()))
        .map_err(|error| error.to_string())
}

fn validate_browser_label(label: &str) -> Result<(), String> {
    if label.starts_with("browser-tab-") {
        Ok(())
    } else {
        Err("Invalid browser tab label".to_string())
    }
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct BrowserPageLoadPayload {
    label: String,
    url: String,
    status: &'static str,
    title: Option<String>,
}

fn browser_webview(app: &AppHandle, label: &str) -> Result<tauri::Webview, String> {
    validate_browser_label(label)?;
    app.get_webview(label)
        .ok_or_else(|| format!("Browser tab webview not found: {label}"))
}

#[tauri::command]
fn browser_set_shields(
    enabled: bool,
    block_trackers: bool,
    fast_forward_youtube_ads: bool,
) -> Result<(), String> {
    let mut config = shield_config()
        .lock()
        .map_err(|_| "Could not update browser shield settings".to_string())?;
    *config = ShieldConfig {
        enabled,
        block_trackers,
        fast_forward_youtube_ads,
    };
    Ok(())
}

#[tauri::command]
async fn browser_create_webview(
    app: AppHandle,
    label: String,
    url: String,
    x: f64,
    y: f64,
    width: f64,
    height: f64,
    focus: bool,
    incognito: bool,
) -> Result<(), String> {
    validate_browser_label(&label)?;

    if app.get_webview(&label).is_some() {
        return Ok(());
    }

    let target = Url::parse(&url).map_err(|error| format!("Invalid URL: {error}"))?;
    let window = app
        .get_window("main")
        .ok_or_else(|| "Main browser window not found".to_string())?;

    // Creating the child view in Rust lets the shield script run at document start,
    // before the remote page parses HTML or executes its own scripts.
    let builder = WebviewBuilder::new(label, WebviewUrl::External(target))
        .initialization_script(build_shields_script(current_shield_config()))
        .incognito(incognito)
        .devtools(true)
        .zoom_hotkeys_enabled(true)
        .focused(focus);

    window
        .add_child(
            builder,
            LogicalPosition::new(x, y),
            LogicalSize::new(width.max(1.0), height.max(1.0)),
        )
        .map(|_| ())
        .map_err(|error| error.to_string())
}

#[tauri::command]
async fn browser_apply_shields(app: AppHandle, label: String) -> Result<(), String> {
    apply_shields(&browser_webview(&app, &label)?)
}

#[tauri::command]
async fn browser_navigate(app: AppHandle, label: String, url: String) -> Result<(), String> {
    let target = Url::parse(&url).map_err(|error| format!("Invalid URL: {error}"))?;
    browser_webview(&app, &label)?
        .navigate(target)
        .map_err(|error| error.to_string())
}

#[tauri::command]
async fn browser_reload(app: AppHandle, label: String) -> Result<(), String> {
    browser_webview(&app, &label)?
        .reload()
        .map_err(|error| error.to_string())
}

#[tauri::command]
async fn browser_back(app: AppHandle, label: String) -> Result<(), String> {
    browser_webview(&app, &label)?
        .eval("window.history.back()")
        .map_err(|error| error.to_string())
}

#[tauri::command]
async fn browser_forward(app: AppHandle, label: String) -> Result<(), String> {
    browser_webview(&app, &label)?
        .eval("window.history.forward()")
        .map_err(|error| error.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            browser_set_shields,
            browser_create_webview,
            browser_apply_shields,
            browser_navigate,
            browser_reload,
            browser_back,
            browser_forward
        ])
        .on_page_load(|webview, payload| {
            let label = webview.label();
            if !label.starts_with("browser-tab-") {
                return;
            }

            // Re-apply after load as a compatibility pass for dynamically replaced
            // documents and single-page applications. The script is idempotent.
            let _ = apply_shields(webview);

            let status = match payload.event() {
                PageLoadEvent::Started => "started",
                PageLoadEvent::Finished => "finished",
            };

            let event = BrowserPageLoadPayload {
                label: label.to_string(),
                url: payload.url().to_string(),
                status,
                title: None,
            };

            let _ = webview.emit_to("main", "browser-page-load", event);
        })
        .run(tauri::generate_context!())
        .expect("error while running Web 3 Browser");
}

//! R&D Workbench — native desktop entry point.
//!
//! Pure native window (winit + OpenGL via eframe). No webview, no embedded browser.

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod app;
mod background;
mod extraction;
mod fonts;
mod screen;
mod screens;
mod secrets;
mod storage;
mod theme;
mod worker;

fn main() -> eframe::Result {
    let options = eframe::NativeOptions {
        viewport: eframe::egui::ViewportBuilder::default()
            .with_title("R&D Workbench")
            .with_inner_size([1280.0, 800.0])
            .with_min_inner_size([900.0, 560.0]),
        ..Default::default()
    };
    eframe::run_native(
        "R&D Workbench",
        options,
        Box::new(|cc| {
            fonts::install(&cc.egui_ctx);
            theme::apply(&cc.egui_ctx);
            Ok(Box::new(app::WorkbenchApp::new()))
        }),
    )
}

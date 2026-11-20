//! One module per screen. Each exposes `show(app, ui)`.
//! Screens not yet ported render a pointer to their prototype reference.

mod home;
mod library;
mod map;
mod projects;
mod research;
mod tasks;

use crate::app::WorkbenchApp;
use crate::screen::Screen;
use crate::theme;
use eframe::egui::{self, RichText};

pub fn show(app: &mut WorkbenchApp, ui: &mut egui::Ui) {
    match app.screen {
        Screen::Home => home::show(app, ui),
        Screen::Projects => projects::show(app, ui),
        Screen::Research => research::show(app, ui),
        Screen::Library => library::show(app, ui),
        Screen::Map => map::show(app, ui),
        Screen::Tasks => tasks::show(app, ui),
        other => not_ported(ui, other),
    }
}

/// Section heading used by every screen.
pub fn title(ui: &mut egui::Ui, text: &str, subtitle: &str) {
    ui.add_space(8.0);
    ui.heading(RichText::new(text).strong());
    if !subtitle.is_empty() {
        ui.label(RichText::new(subtitle).color(theme::MUTED));
    }
    ui.add_space(12.0);
}

/// Solid tonal card (no outline), matching the prototype's `Surface`.
pub fn card<R>(ui: &mut egui::Ui, add: impl FnOnce(&mut egui::Ui) -> R) -> R {
    egui::Frame::new()
        .fill(theme::RAISED)
        .corner_radius(14)
        .inner_margin(14)
        .show(ui, |ui| {
            ui.set_width(ui.available_width());
            add(ui)
        })
        .inner
}

fn not_ported(ui: &mut egui::Ui, screen: Screen) {
    title(ui, screen.label(), "Not ported yet");
    card(ui, |ui| {
        ui.label("This screen is still only in the web UX prototype.");
        ui.label(
            RichText::new(format!("Reference: prototype/web/src/app/{}", screen.prototype_path()))
                .monospace()
                .color(theme::MUTED),
        );
        ui.label("See docs/MIGRATION.md for the porting checklist.");
    });
}

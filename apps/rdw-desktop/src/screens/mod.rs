//! One module per screen. Each exposes `show(app, ui)`.
//! Screens not yet ported render a pointer to their prototype reference.

mod home;
mod imports;
mod library;
mod map;
mod projects;
mod research;
mod settings;
mod tasks;
mod verify;

use crate::app::WorkbenchApp;
use crate::background::Outcome;
use crate::screen::Screen;
use crate::theme;
use eframe::egui::{self, RichText};
use rdw_core::model::Project;
use rdw_core::store::Store;

/// Per-screen UI state, owned by the app.
#[derive(Debug, Default)]
pub struct ScreenStates {
    pub projects: projects::State,
    pub map: map::State,
    pub settings: settings::State,
    pub assistant: research::assistant::State,
    pub verify: verify::State,
    pub imports: imports::State,
}

impl ScreenStates {
    pub fn load(store: &dyn Store) -> Self {
        Self { settings: settings::State::load(store), ..Self::default() }
    }
}

/// Drains results from background work (network calls) into app state.
pub fn poll_background(app: &mut WorkbenchApp, ctx: &egui::Context) {
    imports::handle_drops(app, ctx);
    app.extraction.poll(&mut app.ws);
    app.extraction.pump(&app.ws, ctx);
    for outcome in app.jobs.drain() {
        match outcome {
            Outcome::Chat(result) => research::assistant::receive(app, result),
            Outcome::Doi { doi, source, project, result } => {
                verify::receive(app, &doi, source, &project, result)
            }
        }
    }
}

/// The project selected on the Projects screen, else the first one.
pub fn current_project(app: &WorkbenchApp) -> Option<Project> {
    let selected = app.states.projects.selected.as_ref().and_then(|id| app.ws.project(id));
    selected.or_else(|| app.ws.projects.first()).cloned()
}

pub fn show(app: &mut WorkbenchApp, ui: &mut egui::Ui) {
    match app.screen {
        Screen::Home => home::show(app, ui),
        Screen::Projects => projects::show(app, ui),
        Screen::Research => research::show(app, ui),
        Screen::Library => library::show(app, ui),
        Screen::Map => map::show(app, ui),
        Screen::Tasks => tasks::show(app, ui),
        Screen::Verify => verify::show(app, ui),
        Screen::Imports => imports::show(app, ui),
        Screen::Settings => settings::show(app, ui),
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

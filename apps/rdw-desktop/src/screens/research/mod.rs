//! Research: an API-backed assistant scoped to a project, and the deep-research
//! handoff to the user's own ChatGPT / Claude / Gemini account.

pub mod assistant;
mod handoff;

use super::title;
use crate::app::WorkbenchApp;
use eframe::egui;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum Tab {
    #[default]
    Assistant,
    Handoff,
}

pub fn show(app: &mut WorkbenchApp, ui: &mut egui::Ui) {
    title(ui, "Research", "Ask the assistant (your API keys) or hand a brief to a deep-research product.");
    let Some(project) = super::current_project(app) else {
        ui.label("Create a project first.");
        return;
    };
    ui.horizontal(|ui| {
        ui.label(format!("Project: {}", project.name));
        ui.separator();
        let tab = &mut app.states.assistant.tab;
        ui.selectable_value(tab, Tab::Assistant, "Assistant");
        ui.selectable_value(tab, Tab::Handoff, "Deep research handoff");
    });
    ui.add_space(8.0);
    match app.states.assistant.tab {
        Tab::Assistant => assistant::show(app, ui, &project),
        Tab::Handoff => handoff::show(app, ui, &project),
    }
}

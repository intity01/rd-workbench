use super::{card, title};
use crate::app::WorkbenchApp;
use crate::theme;
use eframe::egui::{self, RichText};

pub fn show(app: &mut WorkbenchApp, ui: &mut egui::Ui) {
    title(ui, "Tasks", "Background extraction and indexing jobs run in worker processes.");
    if app.ws.tasks.is_empty() {
        card(ui, |ui| {
            ui.label("No tasks yet.");
            ui.label(
                RichText::new(
                    "Phase 2 connects the Python document worker (workers/python) over the \
                     rdw-ipc protocol; its jobs appear here.",
                )
                .color(theme::MUTED),
            );
        });
        return;
    }
    for t in &app.ws.tasks {
        card(ui, |ui| {
            ui.horizontal(|ui| {
                ui.label(RichText::new(&t.name).strong());
                ui.label(RichText::new(&t.worker).color(theme::MUTED));
                ui.add(egui::ProgressBar::new(f32::from(t.progress) / 100.0).show_percentage());
            });
        });
    }
}

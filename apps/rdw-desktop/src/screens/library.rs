use super::{card, title};
use crate::app::WorkbenchApp;
use crate::theme;
use eframe::egui::{self, RichText};
use rdw_core::search::{HitKind, search};

pub fn show(app: &mut WorkbenchApp, ui: &mut egui::Ui) {
    title(ui, "Library", "Search across projects, sources and graph nodes.");
    ui.add(egui::TextEdit::singleline(&mut app.query).hint_text("Type to search…").desired_width(420.0));
    ui.add_space(10.0);
    let hits = search(&app.ws, &app.query);
    if app.query.trim().is_empty() {
        ui.label(RichText::new("Start typing to search.").color(theme::MUTED));
        return;
    }
    if hits.is_empty() {
        ui.label(RichText::new("No results.").color(theme::MUTED));
    }
    for hit in hits {
        card(ui, |ui| {
            ui.horizontal(|ui| {
                let kind = match hit.kind {
                    HitKind::Project => "Project",
                    HitKind::Source => "Source",
                    HitKind::Node => "Node",
                };
                ui.label(RichText::new(kind).color(theme::MUTED));
                ui.label(RichText::new(&hit.title).strong());
                ui.monospace(&hit.id);
            });
        });
        ui.add_space(4.0);
    }
}

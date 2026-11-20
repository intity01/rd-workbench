use super::{card, title};
use crate::app::WorkbenchApp;
use crate::theme;
use eframe::egui::{self, RichText};

pub fn show(app: &mut WorkbenchApp, ui: &mut egui::Ui) {
    title(ui, "Projects", "Each project owns its sources, notes and knowledge graph.");
    egui::Grid::new("projects").num_columns(5).striped(true).spacing([24.0, 10.0]).show(ui, |ui| {
        for h in ["ID", "Name", "Category", "Status", "Progress"] {
            ui.label(RichText::new(h).color(theme::MUTED));
        }
        ui.end_row();
        for p in &app.ws.projects {
            ui.monospace(p.id.as_str());
            ui.label(&p.name);
            ui.label(&p.category);
            ui.label(format!("{:?}", p.status));
            ui.label(format!("{}%", p.progress));
            ui.end_row();
        }
    });
    if let Some(p) = app.ws.projects.first() {
        ui.add_space(16.0);
        card(ui, |ui| {
            ui.label(RichText::new(&p.name).strong());
            ui.label(&p.description);
            ui.add_space(6.0);
            ui.label(RichText::new("Research question").color(theme::MUTED));
            ui.label(&p.question);
            ui.label(
                RichText::new(format!("Sources: {}", app.ws.sources_of(&p.id).count())).color(theme::MUTED),
            );
        });
    }
}

use super::{card, title};
use crate::app::WorkbenchApp;
use crate::screen::Screen;
use crate::theme;
use eframe::egui::{self, RichText};

pub fn show(app: &mut WorkbenchApp, ui: &mut egui::Ui) {
    title(ui, "Home", "Local-first research workstation — native, no webview.");
    ui.columns(3, |cols| {
        stat(&mut cols[0], "Projects", app.ws.projects.len());
        stat(&mut cols[1], "Sources", app.ws.sources.len());
        stat(&mut cols[2], "Graph nodes", app.ws.graph().node_count());
    });
    ui.add_space(16.0);
    ui.label(RichText::new("Continue").strong());
    ui.add_space(4.0);
    let mut open = None;
    for p in &app.ws.projects {
        card(ui, |ui| {
            ui.horizontal(|ui| {
                ui.label(RichText::new(&p.name).strong());
                ui.label(RichText::new(&p.category).color(theme::MUTED));
                ui.with_layout(egui::Layout::right_to_left(egui::Align::Center), |ui| {
                    if ui.button("Open").clicked() {
                        open = Some(p.id.clone());
                    }
                    ui.add(egui::ProgressBar::new(f32::from(p.progress) / 100.0).desired_width(120.0));
                });
            });
        });
        ui.add_space(6.0);
    }
    if open.is_some() {
        app.screen = Screen::Projects;
    }
}

fn stat(ui: &mut egui::Ui, label: &str, value: usize) {
    card(ui, |ui| {
        ui.label(RichText::new(label).color(theme::MUTED));
        ui.label(RichText::new(value.to_string()).size(28.0).strong());
    });
}

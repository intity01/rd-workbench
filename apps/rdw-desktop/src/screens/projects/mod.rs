//! Projects: list on the left, editor on the right. Mirrors `features/projects`.

mod editor;

use super::{card, title};
use crate::app::WorkbenchApp;
use crate::theme;
use eframe::egui::{self, RichText};
use rdw_core::model::{Project, ProjectId};

#[derive(Debug, Default)]
pub struct State {
    pub selected: Option<ProjectId>,
    /// Edits in progress; written to the workspace only on Save.
    pub draft: Option<Project>,
    pub new_name: String,
    pub confirm_delete: bool,
}

impl State {
    pub fn select(&mut self, project: Option<&Project>) {
        self.selected = project.map(|p| p.id.clone());
        self.draft = project.cloned();
        self.confirm_delete = false;
    }
}

pub fn show(app: &mut WorkbenchApp, ui: &mut egui::Ui) {
    title(ui, "Projects", "Each project owns its sources, notes and knowledge graph.");
    if app.states.projects.selected.is_none() {
        let first = app.ws.projects.first().cloned();
        app.states.projects.select(first.as_ref());
    }
    ui.columns(2, |cols| {
        list(app, &mut cols[0]);
        editor::show(app, &mut cols[1]);
    });
}

fn list(app: &mut WorkbenchApp, ui: &mut egui::Ui) {
    card(ui, |ui| {
        ui.horizontal(|ui| {
            let input = egui::TextEdit::singleline(&mut app.states.projects.new_name)
                .hint_text("New project name")
                .desired_width(ui.available_width() - 70.0);
            let enter = ui.add(input).lost_focus() && ui.input(|i| i.key_pressed(egui::Key::Enter));
            let name = app.states.projects.new_name.trim().to_owned();
            if (ui.add_enabled(!name.is_empty(), egui::Button::new("Create")).clicked() || enter)
                && !name.is_empty()
            {
                let id = app.ws.create_project(&name);
                app.states.projects.new_name.clear();
                let created = app.ws.project(&id).cloned();
                app.states.projects.select(created.as_ref());
                app.status = Some(format!("Created “{name}”"));
            }
        });
    });
    ui.add_space(8.0);

    let mut pick = None;
    for p in &app.ws.projects {
        let selected = app.states.projects.selected.as_ref() == Some(&p.id);
        let frame = egui::Frame::new()
            .fill(if selected { theme::RAISED.gamma_multiply(1.5) } else { theme::RAISED })
            .corner_radius(12)
            .inner_margin(10);
        let resp = frame
            .show(ui, |ui| {
                ui.set_width(ui.available_width());
                ui.horizontal(|ui| {
                    ui.label(RichText::new(&p.name).strong());
                    ui.label(RichText::new(format!("{:?}", p.status)).color(theme::MUTED));
                });
                let meta =
                    format!("{} · {} sources · {}%", p.id, app.ws.sources_of(&p.id).count(), p.progress);
                ui.label(RichText::new(meta).color(theme::MUTED).small());
            })
            .response
            .interact(egui::Sense::click());
        if resp.clicked() {
            pick = Some(p.clone());
        }
        ui.add_space(4.0);
    }
    if let Some(p) = pick {
        app.states.projects.select(Some(&p));
    }
    if app.ws.projects.is_empty() {
        ui.label(RichText::new("No projects yet — create one above.").color(theme::MUTED));
    }
}

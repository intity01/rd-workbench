use crate::app::WorkbenchApp;
use crate::screens::card;
use crate::theme;
use eframe::egui::{self, RichText};
use rdw_core::model::{Project, ProjectStatus};

pub fn show(app: &mut WorkbenchApp, ui: &mut egui::Ui) {
    let Some(draft) = app.states.projects.draft.as_mut() else {
        ui.label(RichText::new("Select a project.").color(theme::MUTED));
        return;
    };
    let saved = app.ws.project(&draft.id).cloned();
    let changed = saved.as_ref() != Some(draft);

    card(ui, |ui| {
        ui.horizontal(|ui| {
            ui.label(RichText::new(draft.id.as_str()).monospace().color(theme::MUTED));
            ui.label(RichText::new(format!("updated {}", draft.updated)).color(theme::MUTED).small());
        });
        fields(ui, draft);
    });
    ui.add_space(8.0);

    let mut action = Action::None;
    ui.horizontal(|ui| {
        if ui.add_enabled(changed, egui::Button::new("Save")).clicked() {
            action = Action::Save;
        }
        if ui.add_enabled(changed, egui::Button::new("Revert")).clicked() {
            action = Action::Revert;
        }
        ui.with_layout(egui::Layout::right_to_left(egui::Align::Center), |ui| {
            if app.states.projects.confirm_delete {
                if ui.button(RichText::new("Delete permanently").color(theme::CONTRADICTS)).clicked() {
                    action = Action::Delete;
                }
                if ui.button("Cancel").clicked() {
                    app.states.projects.confirm_delete = false;
                }
                ui.label("Delete project, its sources and graph?");
            } else if ui.button("Delete…").clicked() {
                app.states.projects.confirm_delete = true;
            }
        });
    });
    apply(app, action, saved);
}

enum Action {
    None,
    Save,
    Revert,
    Delete,
}

fn apply(app: &mut WorkbenchApp, action: Action, saved: Option<Project>) {
    let st = &mut app.states.projects;
    match action {
        Action::None => {}
        Action::Revert => st.draft = saved,
        Action::Save => {
            if let Some(draft) = st.draft.clone() {
                app.status = Some(match app.ws.update_project(draft) {
                    Ok(()) => "Project saved".into(),
                    Err(e) => format!("Save failed: {e}"),
                });
                let fresh = st.selected.as_ref().and_then(|id| app.ws.project(id)).cloned();
                st.draft = fresh;
            }
        }
        Action::Delete => {
            if let Some(id) = st.selected.clone() {
                app.status = Some(match app.ws.delete_project(&id) {
                    Ok(()) => format!("Deleted {id}"),
                    Err(e) => format!("Delete failed: {e}"),
                });
                st.select(None);
                app.states.map.selected = None;
            }
        }
    }
}

fn fields(ui: &mut egui::Ui, p: &mut Project) {
    egui::Grid::new("project-fields").num_columns(2).spacing([12.0, 8.0]).show(ui, |ui| {
        line(ui, "Name", &mut p.name);
        line(ui, "Category", &mut p.category);
        ui.label("Status");
        egui::ComboBox::from_id_salt("status").selected_text(format!("{:?}", p.status)).show_ui(ui, |ui| {
            for s in ProjectStatus::ALL {
                ui.selectable_value(&mut p.status, s, format!("{s:?}"));
            }
        });
        ui.end_row();
        ui.label("Progress");
        ui.add(egui::Slider::new(&mut p.progress, 0..=100).suffix("%"));
        ui.end_row();
        let mut tags = p.tags.join(", ");
        line(ui, "Tags", &mut tags);
        let parsed: Vec<String> =
            tags.split(',').map(str::trim).filter(|t| !t.is_empty()).map(str::to_owned).collect();
        if parsed != p.tags {
            p.tags = parsed;
        }
    });
    ui.add_space(6.0);
    for (label, text) in [
        ("Description", &mut p.description),
        ("Research question", &mut p.question),
        ("Objectives", &mut p.objectives),
        ("Hypotheses", &mut p.hypotheses),
        ("Scope", &mut p.scope),
        ("Out of scope", &mut p.exclusions),
        ("Expected output", &mut p.output),
    ] {
        ui.label(RichText::new(label).color(theme::MUTED));
        ui.add(egui::TextEdit::multiline(text).desired_rows(2).desired_width(f32::INFINITY));
    }
}

fn line(ui: &mut egui::Ui, label: &str, value: &mut String) {
    ui.label(label);
    ui.add(egui::TextEdit::singleline(value).desired_width(f32::INFINITY));
    ui.end_row();
}

//! The import queue table: status, progress, and per-row actions.

use crate::app::WorkbenchApp;
use crate::screens::card;
use crate::theme;
use eframe::egui::{self, RichText};
use rdw_core::model::{ProcStatus, ProjectId, Source, SourceId, SourceType};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum Filter {
    #[default]
    All,
    Active,
    Done,
    Failed,
}

impl Filter {
    const ALL: [Self; 4] = [Self::All, Self::Active, Self::Done, Self::Failed];

    fn label(self) -> &'static str {
        match self {
            Self::All => "All",
            Self::Active => "Active",
            Self::Done => "Done",
            Self::Failed => "Failed",
        }
    }

    fn keeps(self, s: &Source) -> bool {
        match self {
            Self::All => true,
            Self::Active => matches!(s.status, ProcStatus::Queued | ProcStatus::Running),
            Self::Done => s.status == ProcStatus::Completed,
            Self::Failed => matches!(s.status, ProcStatus::Failed | ProcStatus::Cancelled),
        }
    }
}

enum Action {
    Cancel(SourceId),
    Retry(SourceId),
    Remove(SourceId),
    Open(String),
}

fn kind_label(k: SourceType) -> &'static str {
    match k {
        SourceType::Pdf => "PDF",
        SourceType::Markdown => "Markdown",
        SourceType::Url => "URL",
        SourceType::BibTex => "BibTeX",
        SourceType::Document => "Document",
        SourceType::ResearchReport => "Report",
    }
}

fn status_text(s: ProcStatus) -> RichText {
    match s {
        ProcStatus::Queued => RichText::new("queued").color(theme::MUTED),
        ProcStatus::Running => RichText::new("running").color(theme::SIGNAL),
        ProcStatus::Completed => RichText::new("done").color(theme::SIGNAL),
        ProcStatus::Failed => RichText::new("failed").color(theme::DANGER),
        ProcStatus::Cancelled => RichText::new("cancelled").color(theme::MUTED),
    }
}

pub fn show(app: &mut WorkbenchApp, ui: &mut egui::Ui, project: &ProjectId) {
    let filter = &mut app.states.imports.filter;
    ui.horizontal(|ui| {
        for f in Filter::ALL {
            ui.selectable_value(filter, f, f.label());
        }
    });
    let filter = *filter;
    let rows: Vec<Source> =
        app.ws.sources_of(project).filter(|s| s.file_path.is_some() && filter.keeps(s)).cloned().collect();
    if rows.is_empty() {
        ui.label(RichText::new("Nothing here yet.").color(theme::MUTED));
        return;
    }
    let mut action = None;
    card(ui, |ui| {
        egui::Grid::new("import-queue").num_columns(5).spacing([14.0, 8.0]).striped(true).show(ui, |ui| {
            for s in &rows {
                row(app, ui, s, &mut action);
                ui.end_row();
            }
        });
    });
    match action {
        Some(Action::Cancel(id)) => app.extraction.cancel(&id),
        Some(Action::Retry(id)) => {
            app.ws.retry_import(&id);
        }
        Some(Action::Remove(id)) => {
            app.extraction.cancel(&id);
            if let Some(text) = app.ws.remove_source(&id).and_then(|s| s.text_path) {
                let _ = std::fs::remove_file(text);
            }
        }
        Some(Action::Open(path)) => {
            if let Err(e) = open::that(&path) {
                app.status = Some(format!("Could not open {path}: {e}"));
            }
        }
        None => {}
    }
}

fn row(app: &WorkbenchApp, ui: &mut egui::Ui, s: &Source, action: &mut Option<Action>) {
    let file = s.file_path.as_deref().unwrap_or_default();
    ui.add(egui::Label::new(&s.title).truncate()).on_hover_text(file);
    ui.label(RichText::new(kind_label(s.kind)).color(theme::MUTED));
    ui.vertical(|ui| {
        match app.extraction.progress.get(&s.id).filter(|_| s.status == ProcStatus::Running) {
            Some((pct, msg)) => {
                ui.add(
                    egui::ProgressBar::new(f32::from(*pct) / 100.0).desired_width(160.0).text(msg.as_str()),
                );
            }
            None => {
                ui.label(status_text(s.status));
            }
        }
        if let Some(err) = app.extraction.errors.get(&s.id) {
            ui.add(egui::Label::new(RichText::new(err).small().color(theme::DANGER)).wrap());
        }
    });
    ui.label(if s.pages > 0 { format!("{} p.", s.pages) } else { String::new() });
    ui.horizontal(|ui| {
        if app.extraction.is_active(&s.id) && ui.button("Cancel").clicked() {
            *action = Some(Action::Cancel(s.id.clone()));
        }
        if matches!(s.status, ProcStatus::Failed | ProcStatus::Cancelled) && ui.button("Retry").clicked() {
            *action = Some(Action::Retry(s.id.clone()));
        }
        if let Some(text) = &s.text_path
            && ui.button("Open text").clicked()
        {
            *action = Some(Action::Open(text.clone()));
        }
        if ui.button("Remove").clicked() {
            *action = Some(Action::Remove(s.id.clone()));
        }
    });
}

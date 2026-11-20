//! Verify: check source DOIs against OpenAlex (Crossref fallback), with a
//! local cache so a DOI is looked up at most once per machine.

use super::{card, title};
use crate::app::WorkbenchApp;
use crate::background::Outcome;
use crate::{secrets, theme};
use eframe::egui::{self, RichText};
use rdw_core::model::{Project, ProjectId, SourceId, VerifyState};
use rdw_core::providers::citation::{WorkRecord, normalize_doi};
use rdw_core::providers::lookups::Resolver;
use rdw_core::sources::{cached_work, compare_titles, remember_work};
use std::collections::{HashMap, HashSet};

#[derive(Debug, Default)]
pub struct State {
    pub new_doi: String,
    /// DOI text being edited per source.
    pub edits: HashMap<SourceId, String>,
    /// DOIs with a lookup in flight.
    pub pending: HashSet<String>,
}

fn badge(v: VerifyState) -> RichText {
    match v {
        VerifyState::Matched => RichText::new("matched").color(theme::SIGNAL),
        VerifyState::NeedsReview => RichText::new("needs review").color(theme::WARN),
        VerifyState::Mismatch => RichText::new("mismatch").color(theme::DANGER),
        VerifyState::NotChecked => RichText::new("not checked").color(theme::MUTED),
    }
}

/// Starts a lookup (or answers from cache). `source` = re-check an existing source.
fn lookup(
    app: &mut WorkbenchApp,
    ctx: &egui::Context,
    raw: &str,
    source: Option<SourceId>,
    project: ProjectId,
) {
    let Some(doi) = normalize_doi(raw) else {
        app.status = Some(format!("“{raw}” is not a DOI"));
        return;
    };
    if let Some(rec) = cached_work(&app.store, &doi) {
        apply(app, &rec, source, &project);
        return;
    }
    if !app.states.verify.pending.insert(doi.clone()) {
        return;
    }
    let key = secrets::get("openalex");
    app.jobs.spawn(ctx, move || {
        let result = Resolver::new(key).resolve(&doi).map_err(|e| e.to_string());
        Outcome::Doi { doi, source, project, result }
    });
}

fn apply(app: &mut WorkbenchApp, rec: &WorkRecord, source: Option<SourceId>, project: &ProjectId) {
    match source {
        Some(id) => {
            let ours = app.ws.sources.iter().find(|s| s.id == id).map(|s| s.title.clone());
            if let Some(ours) = ours {
                let state = compare_titles(&ours, &rec.title);
                app.ws.set_verify(&id, state);
                app.status = Some(format!("Checked: {}", rec.title));
            }
        }
        None => {
            app.status = Some(match app.ws.add_source_from_record(project, rec) {
                Ok(_) => format!("Added: {}", rec.title),
                Err(e) => e.to_string(),
            });
        }
    }
}

/// Called by the background poller when a lookup finishes.
pub fn receive(
    app: &mut WorkbenchApp,
    doi: &str,
    source: Option<SourceId>,
    project: &ProjectId,
    result: Result<WorkRecord, String>,
) {
    app.states.verify.pending.remove(doi);
    match result {
        Ok(rec) => {
            remember_work(&mut app.store, &rec);
            apply(app, &rec, source, project);
        }
        Err(e) => app.status = Some(format!("{doi}: {e}")),
    }
}

pub fn show(app: &mut WorkbenchApp, ui: &mut egui::Ui) {
    title(ui, "Verify", "Each DOI is checked against OpenAlex, then Crossref. Results are cached locally.");
    let Some(project) = super::current_project(app) else {
        ui.label("Create a project first.");
        return;
    };
    add_by_doi(app, ui, &project);
    ui.add_space(10.0);
    source_list(app, ui, &project);
}

fn add_by_doi(app: &mut WorkbenchApp, ui: &mut egui::Ui, project: &Project) {
    let mut go = false;
    card(ui, |ui| {
        ui.label(RichText::new(format!("Add a source to “{}” by DOI", project.name)).strong());
        ui.horizontal(|ui| {
            let st = &mut app.states.verify;
            let resp = ui.add(
                egui::TextEdit::singleline(&mut st.new_doi)
                    .hint_text("10.1000/xyz123 or https://doi.org/…")
                    .desired_width(360.0),
            );
            let enter = resp.lost_focus() && ui.input(|i| i.key_pressed(egui::Key::Enter));
            go = ui.add_enabled(!st.new_doi.trim().is_empty(), egui::Button::new("Look up")).clicked()
                || enter;
            if !st.pending.is_empty() {
                ui.spinner();
            }
        });
    });
    if go && !app.states.verify.new_doi.trim().is_empty() {
        let raw = std::mem::take(&mut app.states.verify.new_doi);
        lookup(app, ui.ctx(), raw.trim(), None, project.id.clone());
    }
}

fn source_list(app: &mut WorkbenchApp, ui: &mut egui::Ui, project: &Project) {
    let rows: Vec<_> = app
        .ws
        .sources_of(&project.id)
        .map(|s| (s.id.clone(), s.title.clone(), s.doi.clone().unwrap_or_default(), s.verify))
        .collect();
    if rows.is_empty() {
        ui.label(RichText::new("No sources in this project yet.").color(theme::MUTED));
        return;
    }
    let mut check: Option<(SourceId, String)> = None;
    card(ui, |ui| {
        egui::Grid::new("verify-sources").num_columns(4).spacing([12.0, 8.0]).striped(true).show(ui, |ui| {
            for (id, title, doi, verify) in &rows {
                ui.add(egui::Label::new(title).truncate()).on_hover_text(title);
                let edit = app.states.verify.edits.entry(id.clone()).or_insert_with(|| doi.clone());
                let resp = ui.add(egui::TextEdit::singleline(edit).hint_text("DOI").desired_width(220.0));
                if resp.lost_focus() && edit.trim() != doi {
                    let raw = edit.clone();
                    app.ws.set_source_doi(id, &raw);
                }
                ui.label(badge(*verify).small());
                let busy = normalize_doi(edit).is_some_and(|d| app.states.verify.pending.contains(&d));
                if ui.add_enabled(!edit.trim().is_empty() && !busy, egui::Button::new("Check")).clicked() {
                    check = Some((id.clone(), edit.clone()));
                }
                ui.end_row();
            }
        });
    });
    if let Some((id, raw)) = check {
        app.ws.set_source_doi(&id, &raw);
        lookup(app, ui.ctx(), &raw, Some(id), project.id.clone());
    }
}

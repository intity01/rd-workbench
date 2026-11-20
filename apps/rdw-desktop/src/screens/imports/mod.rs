//! Imports: add documents (file picker or drop on the window), choose the
//! extraction tier, follow the queue. Extraction runs in the Python worker.

mod queue;

use super::{card, title};
use crate::app::WorkbenchApp;
use crate::extraction::WorkerStatus;
use crate::screen::Screen;
use crate::theme;
use eframe::egui::{self, RichText};
use rdw_core::ipc::ExtractMode;
use std::path::PathBuf;

const PICK_EXTENSIONS: &[&str] = &["pdf", "docx", "md", "markdown", "txt"];

#[derive(Debug, Default)]
pub struct State {
    /// Mark new imports as exported deep-research reports.
    pub as_report: bool,
    pub filter: queue::Filter,
}

fn mode_label(m: ExtractMode) -> &'static str {
    match m {
        ExtractMode::Fast => "Fast — text layer only",
        ExtractMode::Balanced => "Balanced — OCR where needed (not available yet)",
        ExtractMode::Accurate => "Accurate — vision model (not available yet)",
    }
}

/// Queues `paths` into the current project and opens the Imports screen.
pub fn queue_files(app: &mut WorkbenchApp, paths: Vec<PathBuf>) {
    let Some(project) = super::current_project(app) else {
        app.status = Some("Create a project before importing".into());
        return;
    };
    let report = app.states.imports.as_report;
    let mut added = 0;
    for path in paths.iter().filter(|p| p.is_file()) {
        if app.ws.queue_import(&project.id, path, report).is_ok() {
            added += 1;
        }
    }
    let skipped = paths.len() - added;
    app.status = Some(match skipped {
        0 => format!("Queued {added} file(s) in “{}”", project.name),
        n => format!("Queued {added} file(s); skipped {n} that are not files"),
    });
    app.screen = Screen::Imports;
}

/// Files dropped anywhere on the window are imported.
pub fn handle_drops(app: &mut WorkbenchApp, ctx: &egui::Context) {
    let dropped: Vec<PathBuf> =
        ctx.input(|i| i.raw.dropped_files.iter().map(|f| f.path().to_path_buf()).collect());
    if !dropped.is_empty() {
        queue_files(app, dropped);
    }
    if ctx.input(|i| !i.raw.hovered_files.is_empty()) {
        let painter = ctx
            .layer_painter(egui::LayerId::new(egui::Order::Foreground, egui::Id::unique("rdw-drop-overlay")));
        let rect = ctx.content_rect();
        painter.rect_filled(rect, 0.0, egui::Color32::from_black_alpha(170));
        let font = egui::FontId::proportional(22.0);
        painter.text(rect.center(), egui::Align2::CENTER_CENTER, "Drop to import", font, theme::SIGNAL);
    }
}

pub fn show(app: &mut WorkbenchApp, ui: &mut egui::Ui) {
    title(
        ui,
        "Imports",
        "Documents are converted to Markdown in a separate worker; the window stays responsive.",
    );
    let Some(project) = super::current_project(app) else {
        ui.label("Create a project first.");
        return;
    };
    worker_line(app, ui);
    ui.add_space(8.0);
    card(ui, |ui| {
        ui.label(RichText::new(format!("Add documents to “{}”", project.name)).strong());
        ui.horizontal(|ui| {
            if ui.button("Choose files…").clicked() {
                let picked = rfd::FileDialog::new()
                    .add_filter("Documents", PICK_EXTENSIONS)
                    .add_filter("All files", &["*"])
                    .pick_files();
                if let Some(paths) = picked {
                    queue_files(app, paths);
                }
            }
            ui.label(RichText::new("or drop files anywhere on this window").color(theme::MUTED));
        });
        ui.checkbox(&mut app.states.imports.as_report, "These are exported deep-research reports");
        ui.horizontal(|ui| {
            ui.label("Extraction");
            let mode = &mut app.extraction.mode;
            egui::ComboBox::from_id_salt("extract-mode")
                .selected_text(mode_label(*mode))
                .width(330.0)
                .show_ui(ui, |ui| {
                    for m in [ExtractMode::Fast, ExtractMode::Balanced, ExtractMode::Accurate] {
                        ui.selectable_value(mode, m, mode_label(m));
                    }
                });
        });
    });
    ui.add_space(10.0);
    queue::show(app, ui, &project.id);
}

fn worker_line(app: &mut WorkbenchApp, ui: &mut egui::Ui) {
    let (text, color) = match &app.extraction.status {
        WorkerStatus::Off => ("Worker starts with the first import".to_owned(), theme::MUTED),
        WorkerStatus::Starting => ("Worker starting…".to_owned(), theme::MUTED),
        WorkerStatus::Ready(caps) => (format!("Worker ready · {}", caps.join(", ")), theme::SIGNAL),
        WorkerStatus::Restarting(r) => (format!("Worker restarting ({r})"), theme::WARN),
        WorkerStatus::Down(r) => (format!("Worker stopped: {r}"), theme::DANGER),
    };
    ui.horizontal(|ui| {
        ui.label(RichText::new(text).color(color));
        if matches!(app.extraction.status, WorkerStatus::Down(_) | WorkerStatus::Restarting(_))
            && ui.button("Restart worker").clicked()
        {
            app.extraction.restart(&mut app.ws);
        }
    });
    if !app.extraction.log.is_empty() {
        egui::CollapsingHeader::new("Worker log").id_salt("worker-log").show(ui, |ui| {
            egui::ScrollArea::vertical().max_height(140.0).stick_to_bottom(true).show(ui, |ui| {
                for line in &app.extraction.log {
                    ui.label(RichText::new(line).monospace().small().color(theme::MUTED));
                }
            });
        });
    }
}

//! Research screen: deep-research handoff to the user's own ChatGPT / Claude /
//! Gemini account, in the system browser. See docs/AI_PROVIDERS.md.

use crate::app::WorkbenchApp;
use crate::screens::card;
use crate::theme;
use eframe::egui::{self, RichText};
use rdw_core::model::Project;
use rdw_core::providers::handoff::{Brief, WebResearch};

pub fn show(app: &mut WorkbenchApp, ui: &mut egui::Ui, project: &Project) {
    let known: Vec<String> = app.ws.sources_of(&project.id).map(|s| s.title.clone()).collect();
    let brief = Brief {
        question: &project.question,
        scope: &project.scope,
        exclusions: &project.exclusions,
        known_sources: known.iter().map(String::as_str).collect(),
    }
    .render();

    card(ui, |ui| {
        ui.label(RichText::new("1 · Research brief").strong());
        ui.label(RichText::new(format!("From project “{}”", project.name)).color(theme::MUTED));
        ui.add_space(6.0);
        let mut preview = brief.as_str();
        ui.add(egui::TextEdit::multiline(&mut preview).desired_rows(8).desired_width(f32::INFINITY));
    });
    ui.add_space(8.0);

    card(ui, |ui| {
        ui.label(RichText::new("2 · Open in your browser").strong());
        ui.label(
            RichText::new(
                "The brief is copied to your clipboard and the site opens in your default browser. \
                 You sign in there yourself — this app never sees your password, cookies or session.",
            )
            .color(theme::MUTED),
        );
        ui.add_space(6.0);
        for target in WebResearch::ALL {
            ui.horizontal(|ui| {
                if ui.button(target.product_name()).clicked() {
                    ui.ctx().copy_text(brief.clone());
                    app.status = Some(match open::that(target.url()) {
                        Ok(()) => format!("Brief copied · opened {}", target.product_name()),
                        Err(e) => format!("Could not open browser: {e}"),
                    });
                }
                ui.label(RichText::new(target.how_to()).color(theme::MUTED));
            });
        }
    });
    ui.add_space(8.0);

    card(ui, |ui| {
        ui.label(RichText::new("3 · Import the report").strong());
        ui.label(
            RichText::new(
                "Export the finished report (Markdown, PDF or DOCX) and drop it on Imports. It becomes a \
                 Research Report source; its references are checked against OpenAlex / Crossref.",
            )
            .color(theme::MUTED),
        );
        ui.label(RichText::new("Import flow lands in Phase 2.").color(theme::MUTED).italics());
    });
}

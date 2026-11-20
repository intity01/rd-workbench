//! Chat with the model routed to the Standard tier. Requests run on a worker
//! thread; replies arrive through `background::Jobs`.

use super::Tab;
use crate::app::WorkbenchApp;
use crate::background::Outcome;
use crate::screens::card;
use crate::theme;
use eframe::egui::{self, RichText};
use rdw_core::model::Project;
use rdw_core::providers::clients::client_for;
use rdw_core::providers::llm::{ChatMessage, ChatRequest, Role, Tier};

#[derive(Debug, Default)]
pub struct State {
    pub tab: Tab,
    pub messages: Vec<ChatMessage>,
    pub input: String,
    pub waiting: bool,
}

/// Called by the background poller when a reply arrives.
pub fn receive(app: &mut WorkbenchApp, result: Result<String, String>) {
    let st = &mut app.states.assistant;
    st.waiting = false;
    match result {
        Ok(text) => st.messages.push(ChatMessage { role: Role::Assistant, text }),
        Err(e) => app.status = Some(format!("Assistant: {e}")),
    }
}

fn system_prompt(p: &Project) -> String {
    format!(
        "You are a research assistant inside R&D Workbench, a local-first research tool.\n\
         Project: {}\nResearch question: {}\nScope: {}\nOut of scope: {}\n\n\
         Answer directly and concisely. Separate established findings from your own inference. \
         When you cite literature, give a DOI or stable URL and say so if you are unsure it exists.",
        p.name, p.question, p.scope, p.exclusions
    )
}

pub fn show(app: &mut WorkbenchApp, ui: &mut egui::Ui, project: &Project) {
    let route = app.states.settings.router.resolve(Tier::Standard).ok().cloned();
    let model_text = route.as_ref().map_or("No model configured — see Settings".into(), |m| {
        format!("{} · {}", m.vendor.label(), m.model)
    });
    ui.label(RichText::new(model_text).color(theme::MUTED).small());
    ui.add_space(4.0);

    let st = &mut app.states.assistant;
    for m in &st.messages {
        let (who, color) = match m.role {
            Role::User => ("You", theme::SIGNAL),
            _ => ("Assistant", theme::MUTED),
        };
        card(ui, |ui| {
            ui.label(RichText::new(who).color(color).small());
            ui.label(&m.text);
        });
        ui.add_space(4.0);
    }
    if st.waiting {
        ui.horizontal(|ui| {
            ui.spinner();
            ui.label("Thinking…");
        });
    }

    ui.add_space(6.0);
    let mut send = false;
    ui.horizontal(|ui| {
        let edit = egui::TextEdit::multiline(&mut st.input)
            .hint_text("Ask about this project… (Ctrl+Enter to send)")
            .desired_rows(2)
            .desired_width(ui.available_width() - 150.0);
        let resp = ui.add(edit);
        let ctrl_enter =
            resp.has_focus() && ui.input(|i| i.modifiers.command && i.key_pressed(egui::Key::Enter));
        let ready = !st.waiting && !st.input.trim().is_empty() && route.is_some();
        send = (ui.add_enabled(ready, egui::Button::new("Send")).clicked() || ctrl_enter) && ready;
        if ui.add_enabled(!st.messages.is_empty() && !st.waiting, egui::Button::new("Clear")).clicked() {
            st.messages.clear();
        }
    });
    if !send {
        return;
    }
    let Some(route) = route else { return };
    st.messages.push(ChatMessage { role: Role::User, text: st.input.trim().to_owned() });
    st.input.clear();
    st.waiting = true;

    let mut messages = vec![ChatMessage { role: Role::System, text: system_prompt(project) }];
    messages.extend(st.messages.iter().cloned());
    let req = ChatRequest { tier: Tier::Standard, messages };
    let creds = app.states.settings.credentials();
    app.jobs.spawn(ui.ctx(), move || {
        let result = client_for(route.vendor, &creds)
            .and_then(|c| c.complete(&route.model, &req))
            .map_err(|e| e.to_string());
        Outcome::Chat(result)
    });
}

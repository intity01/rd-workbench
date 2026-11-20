//! Settings → API keys (OS credential store) and model routing.

use super::{card, title};
use crate::app::WorkbenchApp;
use crate::{secrets, theme};
use eframe::egui::{self, RichText};
use rdw_core::providers::clients::{Credentials, LOCAL_BASE};
use rdw_core::providers::llm::{ModelRef, Router, Tier, Vendor};
use rdw_core::store::Store;
use std::collections::HashMap;

const ROUTER_KEY: &str = "settings:router";
const LOCAL_BASE_KEY: &str = "settings:local_base";

#[derive(Debug, Default)]
pub struct State {
    /// Text typed into each key field (cleared after saving).
    pub inputs: HashMap<&'static str, String>,
    /// Whether each secret is currently stored.
    pub stored: HashMap<&'static str, bool>,
    pub router: Router,
    pub local_base: String,
}

impl State {
    pub fn load(store: &dyn Store) -> Self {
        let kv = |k: &str| store.kv_get(k).ok().flatten();
        let router =
            kv(ROUTER_KEY).and_then(|j| serde_json::from_str(&j).ok()).unwrap_or_else(Router::with_defaults);
        let local_base = kv(LOCAL_BASE_KEY).unwrap_or_else(|| LOCAL_BASE.to_owned());
        let stored = secrets::SLOTS.iter().map(|(name, _)| (*name, secrets::get(name).is_some())).collect();
        Self { inputs: HashMap::new(), stored, router, local_base }
    }

    /// Reads keys from the credential store at call time (never cached in memory).
    pub fn credentials(&self) -> Credentials {
        Credentials {
            openai: secrets::get("openai"),
            anthropic: secrets::get("anthropic"),
            google: secrets::get("google"),
            local_base: Some(self.local_base.clone()),
            local_key: secrets::get("local"),
        }
    }
}

pub fn show(app: &mut WorkbenchApp, ui: &mut egui::Ui) {
    title(
        ui,
        "Settings",
        "Keys are kept in your operating system's credential store, never in project files.",
    );
    keys(app, ui);
    ui.add_space(10.0);
    routing(app, ui);
}

fn keys(app: &mut WorkbenchApp, ui: &mut egui::Ui) {
    card(ui, |ui| {
        ui.label(RichText::new("API keys").strong());
        ui.label(
            RichText::new(
                "Use developer-platform API keys. Consumer subscriptions (ChatGPT Plus, Claude Pro, \
                 Google AI Pro) are not API access — use the Research handoff for those.",
            )
            .color(theme::MUTED),
        );
        ui.add_space(6.0);
        let st = &mut app.states.settings;
        for (name, label) in secrets::SLOTS {
            ui.horizontal(|ui| {
                ui.add_sized([210.0, 20.0], egui::Label::new(*label));
                let set = st.stored.get(name).copied().unwrap_or(false);
                let badge =
                    if set { RichText::new("stored").color(theme::SIGNAL) } else { RichText::new("not set") };
                ui.add_sized([60.0, 20.0], egui::Label::new(badge.small()));
                let input = st.inputs.entry(name).or_default();
                ui.add(
                    egui::TextEdit::singleline(input)
                        .password(true)
                        .hint_text("paste key")
                        .desired_width(260.0),
                );
                if ui.add_enabled(!input.trim().is_empty(), egui::Button::new("Save")).clicked() {
                    app.status = Some(match secrets::set(name, input) {
                        Ok(()) => format!("{label} saved"),
                        Err(e) => format!("Could not save key: {e}"),
                    });
                    input.clear();
                    st.stored.insert(name, secrets::get(name).is_some());
                }
                if ui.add_enabled(set, egui::Button::new("Remove")).clicked() {
                    app.status =
                        Some(secrets::delete(name).map_or_else(|e| e, |()| format!("{label} removed")));
                    st.stored.insert(name, false);
                }
            });
        }
        ui.horizontal(|ui| {
            ui.add_sized([210.0, 20.0], egui::Label::new("Local runtime URL"));
            ui.add(egui::TextEdit::singleline(&mut st.local_base).desired_width(330.0));
            if ui.button("Save").clicked() {
                let _ = app.store.kv_put(LOCAL_BASE_KEY, st.local_base.trim());
                app.status = Some("Local runtime URL saved".into());
            }
        });
    });
}

fn tier_label(t: Tier) -> &'static str {
    match t {
        Tier::Bulk => "Bulk (summaries, cleanup)",
        Tier::Standard => "Standard (assistant)",
        Tier::Flagship => "Flagship (decisions)",
        Tier::DeepResearch => "Deep research (API)",
    }
}

fn routing(app: &mut WorkbenchApp, ui: &mut egui::Ui) {
    card(ui, |ui| {
        ui.label(RichText::new("Model routing").strong());
        ui.label(
            RichText::new("Each tier uses its model, or falls back to the nearest cheaper tier. Model ids are exactly as the vendor's API expects.")
                .color(theme::MUTED),
        );
        ui.add_space(6.0);
        let router = &mut app.states.settings.router;
        egui::Grid::new("routes").num_columns(4).spacing([10.0, 8.0]).show(ui, |ui| {
            for tier in Tier::ALL {
                ui.label(tier_label(tier));
                let mut current = router.get(tier).cloned();
                let vendor = current.as_ref().map_or("— not set —", |m| m.vendor.label());
                egui::ComboBox::from_id_salt(("vendor", tier as u8))
                    .selected_text(vendor)
                    .width(190.0)
                    .show_ui(ui, |ui| {
                        for v in Vendor::ALL {
                            if ui
                                .selectable_label(current.as_ref().is_some_and(|m| m.vendor == v), v.label())
                                .clicked()
                            {
                                let model = current.as_ref().map(|m| m.model.clone()).unwrap_or_default();
                                current = Some(ModelRef { vendor: v, model });
                            }
                        }
                    });
                match current.as_mut() {
                    Some(m) => {
                        ui.add(
                            egui::TextEdit::singleline(&mut m.model)
                                .hint_text("model id")
                                .desired_width(220.0),
                        );
                    }
                    None => {
                        ui.label("");
                    }
                }
                let clear = ui.add_enabled(current.is_some(), egui::Button::new("Clear")).clicked();
                match (clear, current) {
                    (true, _) | (false, None) => router.clear(tier),
                    (false, Some(m)) => router.set(tier, m),
                }
                ui.end_row();
            }
        });
        ui.add_space(6.0);
        if ui.button("Save routing").clicked() {
            app.status = Some(match serde_json::to_string(router) {
                Ok(json) => app
                    .store
                    .kv_put(ROUTER_KEY, &json)
                    .map_or_else(|e| e.to_string(), |()| "Routing saved".into()),
                Err(e) => e.to_string(),
            });
        }
    });
}

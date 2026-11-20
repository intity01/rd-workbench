use crate::screen::Screen;
use crate::screens::{self, ScreenStates};
use crate::{background, storage, theme};
use eframe::egui::{self, RichText};
use rdw_core::Workspace;
use rdw_core::store::SqliteStore;

/// UI-only state. Domain state lives in [`Workspace`]; persistence in `store`.
#[derive(Debug)]
pub struct WorkbenchApp {
    pub ws: Workspace,
    pub store: SqliteStore,
    pub screen: Screen,
    pub query: String,
    pub status: Option<String>,
    pub states: ScreenStates,
    pub jobs: background::Jobs,
}

impl WorkbenchApp {
    pub fn new() -> Self {
        let (mut store, mut status) = storage::open_store();
        let ws = Workspace::open(&mut store).unwrap_or_else(|e| {
            status = Some(format!("Could not load data ({e}); showing sample data"));
            Workspace::with_seed()
        });
        let states = ScreenStates::load(&store);
        Self {
            ws,
            store,
            screen: Screen::Home,
            query: String::new(),
            status,
            states,
            jobs: background::Jobs::default(),
        }
    }

    /// Persists pending changes; called once per frame (no-op when clean).
    fn autosave(&mut self) {
        if let Err(e) = self.ws.save(&mut self.store) {
            self.status = Some(format!("Save failed: {e}"));
        }
    }

    fn top_bar(&mut self, ui: &mut egui::Ui) {
        ui.horizontal(|ui| {
            ui.label(RichText::new("R&D Workbench").strong());
            ui.add_space(12.0);
            let search = egui::TextEdit::singleline(&mut self.query)
                .hint_text("Search projects, sources, nodes…")
                .desired_width(320.0);
            if ui.add(search).changed() && !self.query.is_empty() {
                self.screen = Screen::Library;
            }
            ui.with_layout(egui::Layout::right_to_left(egui::Align::Center), |ui| {
                if ui.add_enabled(self.ws.can_redo(), egui::Button::new("Redo")).clicked() {
                    self.ws.redo();
                }
                if ui.add_enabled(self.ws.can_undo(), egui::Button::new("Undo")).clicked() {
                    self.ws.undo();
                }
                if let Some(s) = &self.status {
                    ui.label(RichText::new(s).color(theme::MUTED));
                }
            });
        });
    }

    fn nav(&mut self, ui: &mut egui::Ui) {
        ui.add_space(8.0);
        for screen in Screen::NAV {
            let selected = self.screen == screen;
            let text = RichText::new(screen.label());
            let text = if selected { text.color(theme::ON_SIGNAL) } else { text };
            let button =
                egui::Button::new(text).selected(selected).min_size(egui::vec2(ui.available_width(), 30.0));
            if ui.add(button).clicked() {
                self.screen = screen;
            }
        }
    }

    fn shortcuts(&mut self, ctx: &egui::Context) {
        // Leave Ctrl+Z to text fields while one has focus.
        if ctx.memory(|m| m.focused().is_some()) {
            return;
        }
        let (undo, redo) = ctx.input(|i| {
            let cmd = i.modifiers.command;
            (
                cmd && i.key_pressed(egui::Key::Z) && !i.modifiers.shift,
                cmd && (i.key_pressed(egui::Key::Y) || (i.modifiers.shift && i.key_pressed(egui::Key::Z))),
            )
        });
        if undo {
            self.ws.undo();
        }
        if redo {
            self.ws.redo();
        }
    }
}

impl eframe::App for WorkbenchApp {
    fn ui(&mut self, ui: &mut egui::Ui, _frame: &mut eframe::Frame) {
        self.shortcuts(ui.ctx());
        screens::poll_background(self);
        egui::Panel::top("top").show(ui, |ui| {
            ui.add_space(6.0);
            self.top_bar(ui);
            ui.add_space(6.0);
        });
        egui::Panel::left("nav").resizable(false).exact_size(184.0).show(ui, |ui| self.nav(ui));
        egui::CentralPanel::default().show(ui, |ui| {
            if self.screen == Screen::Map {
                // The map handles its own pan/zoom; no outer scroll area.
                screens::show(self, ui);
            } else {
                egui::ScrollArea::vertical().auto_shrink(false).show(ui, |ui| screens::show(self, ui));
            }
        });
        self.autosave();
    }
}

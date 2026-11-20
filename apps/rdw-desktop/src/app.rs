use crate::screen::Screen;
use crate::screens;
use crate::theme;
use eframe::egui::{self, RichText};
use rdw_core::Workspace;
use rdw_core::model::NodeId;

/// UI-only state. Domain state lives in [`Workspace`].
#[derive(Debug)]
pub struct WorkbenchApp {
    pub ws: Workspace,
    pub screen: Screen,
    pub query: String,
    pub selected_node: Option<NodeId>,
    pub status: Option<String>,
}

impl WorkbenchApp {
    pub fn new() -> Self {
        Self {
            ws: Workspace::with_seed(),
            screen: Screen::Home,
            query: String::new(),
            selected_node: None,
            status: None,
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
        egui::Panel::top("top").show(ui, |ui| {
            ui.add_space(6.0);
            self.top_bar(ui);
            ui.add_space(6.0);
        });
        egui::Panel::left("nav").resizable(false).exact_size(184.0).show(ui, |ui| self.nav(ui));
        egui::CentralPanel::default().show(ui, |ui| {
            egui::ScrollArea::vertical().auto_shrink(false).show(ui, |ui| screens::show(self, ui));
        });
    }
}

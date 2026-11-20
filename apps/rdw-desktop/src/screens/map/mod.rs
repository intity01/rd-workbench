//! Knowledge map: pan/zoom canvas, drag nodes, connect, inspect.
//! Mirrors `prototype/web/src/app/features/map`.

mod canvas;
mod inspector;
mod toolbar;

use crate::app::WorkbenchApp;
use crate::theme;
use eframe::egui::{self, Color32, Vec2};
use rdw_core::model::{NodeId, NodeType, ProjectId, Rel};

/// Canvas view and interaction state (not persisted).
#[derive(Debug)]
pub struct State {
    pub project: Option<ProjectId>,
    pub selected: Option<NodeId>,
    pub pan: Vec2,
    pub zoom: f32,
    /// Node being dragged and its accumulated world-space offset.
    pub drag: Option<(NodeId, Vec2)>,
    /// When set, the next node click creates an edge from this node.
    pub connect_from: Option<NodeId>,
    pub rel: Rel,
    pub new_kind: NodeType,
    pub new_label: String,
    pub edit_label: String,
    pub edit_desc: String,
}

impl Default for State {
    fn default() -> Self {
        Self {
            project: None,
            selected: None,
            pan: Vec2::ZERO,
            zoom: 1.0,
            drag: None,
            connect_from: None,
            rel: Rel::Supports,
            new_kind: NodeType::Claim,
            new_label: String::new(),
            edit_label: String::new(),
            edit_desc: String::new(),
        }
    }
}

pub fn node_color(kind: NodeType) -> Color32 {
    match kind {
        NodeType::Claim => Color32::from_rgb(0x6E, 0x8B, 0xFF),
        NodeType::Evidence => Color32::from_rgb(0x2F, 0xB3, 0x7E),
        NodeType::Counter => theme::CONTRADICTS,
        NodeType::Question => Color32::from_rgb(0xE8, 0xA3, 0x3C),
        NodeType::Decision => theme::SIGNAL,
        NodeType::Topic => Color32::from_rgb(0x2B, 0xA8, 0xB8),
        NodeType::Concept => Color32::from_rgb(0x9B, 0x7B, 0xEA),
        NodeType::Document => Color32::from_rgb(0x8A, 0x8A, 0x93),
    }
}

pub fn show(app: &mut WorkbenchApp, ui: &mut egui::Ui) {
    // Keep the project filter valid (projects can be deleted elsewhere).
    let valid = app.states.map.project.as_ref().is_some_and(|p| app.ws.project(p).is_some());
    if !valid {
        app.states.map.project = app.ws.projects.first().map(|p| p.id.clone());
    }
    toolbar::show(app, ui);
    ui.add_space(6.0);
    egui::Panel::right("map-inspector")
        .resizable(true)
        .default_size(300.0)
        .show(ui, |ui| egui::ScrollArea::vertical().show(ui, |ui| inspector::show(app, ui)));
    egui::CentralPanel::default().show(ui, |ui| canvas::show(app, ui));
}

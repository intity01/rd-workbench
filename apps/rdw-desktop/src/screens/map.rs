//! Knowledge map, drawn with the egui painter. This first cut renders nodes at
//! their stored positions with straight links; pan/zoom, orthogonal routing and
//! drag-to-connect from the prototype (`features/map`) are still to port.

use super::{card, title};
use crate::app::WorkbenchApp;
use crate::theme;
use eframe::egui::{self, Color32, RichText, Sense, Stroke, Vec2};
use rdw_core::model::{NodeType, Rel};

const NODE_SIZE: Vec2 = Vec2::new(200.0, 44.0);

fn node_color(kind: NodeType) -> Color32 {
    match kind {
        NodeType::Claim => Color32::from_rgb(0x6E, 0x8B, 0xFF),
        NodeType::Evidence => Color32::from_rgb(0x2F, 0xB3, 0x7E),
        NodeType::Counter => theme::CONTRADICTS,
        NodeType::Question => Color32::from_rgb(0xE8, 0xA3, 0x3C),
        NodeType::Decision => theme::SIGNAL,
        _ => Color32::from_rgb(0x9B, 0x7B, 0xEA),
    }
}

pub fn show(app: &mut WorkbenchApp, ui: &mut egui::Ui) {
    title(ui, "Knowledge map", "Claims, evidence and decisions. Held in RAM; traversal is instant.");
    let (rect, _) = ui.allocate_exact_size(egui::vec2(ui.available_width(), 360.0), Sense::hover());
    let painter = ui.painter_at(rect);
    painter.rect_filled(rect, 14.0, theme::APP);
    let origin = rect.left_center() + egui::vec2(24.0, 0.0);
    let center = |x: f32, y: f32| origin + egui::vec2(x, y) + NODE_SIZE / 2.0 - egui::vec2(0.0, NODE_SIZE.y);
    let graph = app.ws.graph();

    for e in graph.edges() {
        let (Some(a), Some(b)) = (graph.node(&e.from), graph.node(&e.to)) else { continue };
        let color = if e.rel == Rel::Contradicts { theme::CONTRADICTS } else { theme::MUTED };
        painter.line_segment([center(a.x, a.y), center(b.x, b.y)], Stroke::new(1.5, color));
    }

    let mut clicked = None;
    for n in graph.nodes() {
        let r = egui::Rect::from_center_size(center(n.x, n.y), NODE_SIZE);
        let selected = app.selected_node.as_ref() == Some(&n.id);
        let fill = if selected { theme::RAISED.gamma_multiply(1.6) } else { theme::RAISED };
        painter.rect_filled(r, 10.0, fill);
        painter.circle_filled(r.left_center() + egui::vec2(14.0, 0.0), 5.0, node_color(n.kind));
        painter.text(
            r.left_center() + egui::vec2(26.0, 0.0),
            egui::Align2::LEFT_CENTER,
            truncate(&n.label, 26),
            egui::FontId::proportional(13.0),
            Color32::WHITE,
        );
        if ui.interact(r, ui.scope_id().with(n.id.as_str()), Sense::click()).clicked() {
            clicked = Some(n.id.clone());
        }
    }
    if clicked.is_some() {
        app.selected_node = clicked;
    }
    ui.add_space(12.0);
    inspector(app, ui);
}

fn inspector(app: &mut WorkbenchApp, ui: &mut egui::Ui) {
    let Some(id) = app.selected_node.clone() else {
        ui.label(RichText::new("Click a node to inspect it.").color(theme::MUTED));
        return;
    };
    let Some(node) = app.ws.graph().node(&id).cloned() else {
        app.selected_node = None;
        return;
    };
    let downstream = app.ws.graph().descendants(&id, 3);
    let mut delete = false;
    card(ui, |ui| {
        ui.horizontal(|ui| {
            ui.label(RichText::new(format!("{:?}", node.kind)).color(node_color(node.kind)));
            ui.label(RichText::new(&node.label).strong());
        });
        ui.label(
            RichText::new(format!("{} downstream nodes within 3 hops", downstream.len())).color(theme::MUTED),
        );
        for (n, depth) in downstream {
            if let Some(d) = app.ws.graph().node(&n) {
                ui.label(format!("{}↳ {}", "  ".repeat(depth), d.label));
            }
        }
        delete = ui.button("Delete node (Ctrl+Z to undo)").clicked();
    });
    if delete && app.ws.delete_node(&id).is_ok() {
        app.selected_node = None;
        app.status = Some("Node deleted".into());
    }
}

fn truncate(s: &str, max: usize) -> String {
    if s.chars().count() <= max {
        s.to_owned()
    } else {
        format!("{}…", s.chars().take(max - 1).collect::<String>())
    }
}

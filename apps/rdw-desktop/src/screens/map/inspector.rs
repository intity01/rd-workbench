use super::node_color;
use crate::app::WorkbenchApp;
use crate::theme;
use eframe::egui::{self, RichText};
use rdw_core::model::{EdgeId, NodeId, Rel};

pub fn show(app: &mut WorkbenchApp, ui: &mut egui::Ui) {
    ui.add_space(6.0);
    let Some(id) = app.states.map.selected.clone() else {
        ui.label(RichText::new("Select a node to inspect it.").color(theme::MUTED));
        return;
    };
    let Some(node) = app.ws.graph().node(&id).cloned() else {
        app.states.map.selected = None;
        return;
    };
    let st = &mut app.states.map;
    // Load the editor buffers when the selection changes.
    let key = egui::Id::unique("map-inspector-node");
    if ui.ctx().data(|d| d.get_temp::<NodeId>(key)).as_ref() != Some(&id) {
        st.edit_label = node.label.clone();
        st.edit_desc = node.desc.clone();
        ui.ctx().data_mut(|d| d.insert_temp(key, id.clone()));
    }

    ui.label(RichText::new(format!("{:?}", node.kind)).color(node_color(node.kind)));
    ui.add(egui::TextEdit::singleline(&mut st.edit_label).desired_width(f32::INFINITY));
    ui.add(egui::TextEdit::multiline(&mut st.edit_desc).hint_text("Description").desired_rows(3));
    let changed = st.edit_label.trim() != node.label || st.edit_desc != node.desc;
    let (label, desc) = (st.edit_label.clone(), st.edit_desc.clone());
    let mut action = None;
    ui.horizontal(|ui| {
        if ui.add_enabled(changed && !label.trim().is_empty(), egui::Button::new("Save")).clicked() {
            action = Some(Action::Rename);
        }
        if ui.button("Connect from here").clicked() {
            action = Some(Action::StartConnect);
        }
    });
    ui.horizontal(|ui| {
        ui.label("New links:");
        egui::ComboBox::from_id_salt("map-rel").selected_text(rel_label(st.rel)).show_ui(ui, |ui| {
            for r in Rel::ALL {
                ui.selectable_value(&mut st.rel, r, rel_label(r));
            }
        });
    });
    ui.separator();
    links(app, ui, &id, &mut action);
    ui.separator();
    let downstream = app.ws.graph().descendants(&id, 3);
    ui.label(RichText::new(format!("{} downstream within 3 hops", downstream.len())).color(theme::MUTED));
    for (n, depth) in downstream {
        if let Some(d) = app.ws.graph().node(&n) {
            ui.label(format!("{}↳ {}", "  ".repeat(depth), d.label));
        }
    }
    ui.separator();
    if ui.button(RichText::new("Delete node").color(theme::CONTRADICTS)).clicked() {
        action = Some(Action::Delete);
    }
    ui.label(RichText::new("Ctrl+Z undoes any map change.").color(theme::MUTED).small());
    if let Some(a) = action {
        apply(app, &id, a, &label, &desc);
    }
}

enum Action {
    Rename,
    StartConnect,
    Disconnect(EdgeId),
    Delete,
}

fn links(app: &WorkbenchApp, ui: &mut egui::Ui, id: &NodeId, action: &mut Option<Action>) {
    let g = app.ws.graph();
    for e in g.edges().filter(|e| &e.from == id || &e.to == id) {
        let (arrow, other) = if &e.from == id { ("→", &e.to) } else { ("←", &e.from) };
        let name = g.node(other).map_or(other.as_str(), |n| n.label.as_str());
        ui.horizontal(|ui| {
            if ui.small_button("✕").on_hover_text("Remove link").clicked() {
                *action = Some(Action::Disconnect(e.id.clone()));
            }
            ui.label(RichText::new(format!("{arrow} {}", rel_label(e.rel))).color(theme::MUTED));
            ui.label(super::canvas::truncate(name, 28));
        });
    }
}

fn apply(app: &mut WorkbenchApp, id: &NodeId, action: Action, label: &str, desc: &str) {
    let result = match action {
        Action::Rename => app.ws.rename_node(id, label, desc).map(|()| "Node saved"),
        Action::StartConnect => {
            app.states.map.connect_from = Some(id.clone());
            Ok("Pick the target node")
        }
        Action::Disconnect(e) => app.ws.disconnect(&e).map(|()| "Link removed"),
        Action::Delete => app.ws.delete_node(id).map(|()| {
            app.states.map.selected = None;
            "Node deleted"
        }),
    };
    app.status = Some(result.map_or_else(|e| e.to_string(), str::to_owned));
}

fn rel_label(r: Rel) -> &'static str {
    match r {
        Rel::Supports => "supports",
        Rel::Contradicts => "contradicts",
        Rel::DependsOn => "depends on",
        Rel::Refines => "refines",
        Rel::LeadsTo => "leads to",
    }
}

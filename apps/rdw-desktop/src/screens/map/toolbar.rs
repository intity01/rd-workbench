use crate::app::WorkbenchApp;
use crate::theme;
use eframe::egui::{self, RichText, Vec2};
use rdw_core::model::{GNode, NodeType};

pub fn show(app: &mut WorkbenchApp, ui: &mut egui::Ui) {
    ui.horizontal_wrapped(|ui| {
        project_picker(app, ui);
        ui.separator();
        add_node(app, ui);
        ui.separator();
        let st = &mut app.states.map;
        ui.label(RichText::new(format!("{:.0}%", st.zoom * 100.0)).color(theme::MUTED));
        if ui.button("Reset view").clicked() {
            st.pan = Vec2::ZERO;
            st.zoom = 1.0;
        }
        if st.connect_from.is_some() {
            ui.label(RichText::new("Click a target node to connect · Esc to cancel").color(theme::SIGNAL));
            if ui.input(|i| i.key_pressed(egui::Key::Escape)) {
                st.connect_from = None;
            }
        } else {
            ui.label(RichText::new("Drag background to pan · scroll to zoom").color(theme::MUTED));
        }
    });
}

fn project_picker(app: &mut WorkbenchApp, ui: &mut egui::Ui) {
    let st = &mut app.states.map;
    let current = st.project.as_ref().and_then(|id| app.ws.project(id)).map_or("—", |p| p.name.as_str());
    egui::ComboBox::from_id_salt("map-project").selected_text(current).width(220.0).show_ui(ui, |ui| {
        for p in &app.ws.projects {
            if ui.selectable_label(st.project.as_ref() == Some(&p.id), &p.name).clicked() {
                st.project = Some(p.id.clone());
                st.selected = None;
                st.connect_from = None;
            }
        }
    });
}

fn add_node(app: &mut WorkbenchApp, ui: &mut egui::Ui) {
    let st = &mut app.states.map;
    egui::ComboBox::from_id_salt("map-kind").selected_text(format!("{:?}", st.new_kind)).show_ui(ui, |ui| {
        for k in NodeType::ALL {
            ui.selectable_value(&mut st.new_kind, k, format!("{k:?}"));
        }
    });
    ui.add(egui::TextEdit::singleline(&mut st.new_label).hint_text("Node label").desired_width(200.0));
    let label = st.new_label.trim().to_owned();
    let Some(project) = st.project.clone() else { return };
    if ui.add_enabled(!label.is_empty(), egui::Button::new("Add node")).clicked() {
        let centre: Vec2 = ui.ctx().data(|d| d.get_temp(egui::Id::unique("map-centre"))).unwrap_or_default();
        let node = GNode {
            id: "".into(),
            kind: st.new_kind,
            label,
            desc: String::new(),
            x: centre.x,
            y: centre.y,
            project_id: project,
            source_id: None,
            page: None,
        };
        match app.ws.add_node(node) {
            Ok(id) => {
                st.new_label.clear();
                st.selected = Some(id);
            }
            Err(e) => app.status = Some(format!("Cannot add node: {e}")),
        }
    }
}

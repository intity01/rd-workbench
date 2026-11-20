//! Drawing and pointer handling. World coordinates are node centres in logical
//! points; `screen = rect.center() + pan + world * zoom`.

use super::{State, node_color};
use crate::app::WorkbenchApp;
use crate::theme;
use eframe::egui::{self, Color32, Pos2, Rect, Sense, Shape, Stroke, Vec2};
use rdw_core::model::{Edge, GNode, NodeId, Rel};

const NODE: Vec2 = Vec2::new(200.0, 44.0);

struct View {
    origin: Pos2,
    zoom: f32,
}

impl View {
    fn to_screen(&self, w: Vec2) -> Pos2 {
        self.origin + w * self.zoom
    }

    fn to_world(&self, p: Pos2) -> Vec2 {
        (p - self.origin) / self.zoom
    }
}

fn world_pos(st: &State, n: &GNode) -> Vec2 {
    let offset = st.drag.as_ref().filter(|(id, _)| id == &n.id).map_or(Vec2::ZERO, |(_, d)| *d);
    Vec2::new(n.x, n.y) + offset
}

pub fn show(app: &mut WorkbenchApp, ui: &mut egui::Ui) {
    let rect = ui.available_rect_before_wrap();
    let bg = ui.interact(rect, ui.scope_id().with("map-bg"), Sense::click_and_drag());
    let st = &mut app.states.map;
    if bg.dragged() {
        st.pan += bg.drag_delta();
    }
    if bg.clicked() {
        st.selected = None;
        st.connect_from = None;
    }
    if let Some(p) = bg.hover_pos() {
        let scroll = ui.input(|i| i.smooth_scroll_delta.y);
        if scroll != 0.0 {
            let old = st.zoom;
            st.zoom = (old * (scroll * 0.0015).exp()).clamp(0.25, 3.0);
            // Keep the point under the cursor fixed while zooming.
            let rel = p - rect.center() - st.pan;
            st.pan -= rel * (st.zoom / old - 1.0);
        }
    }
    let view = View { origin: rect.center() + st.pan, zoom: st.zoom };
    let painter = ui.painter_at(rect);
    painter.rect_filled(rect, 14.0, theme::APP);

    let project = st.project.clone();
    let nodes: Vec<GNode> =
        app.ws.graph().nodes().filter(|n| Some(&n.project_id) == project.as_ref()).cloned().collect();
    let edges: Vec<Edge> = app.ws.graph().edges().cloned().collect();
    let pos = |id: &NodeId| nodes.iter().find(|n| &n.id == id).map(|n| world_pos(st, n));

    for e in &edges {
        let (Some(a), Some(b)) = (pos(&e.from), pos(&e.to)) else { continue };
        let attached = [&e.from, &e.to].iter().any(|id| st.selected.as_ref() == Some(*id));
        draw_edge(&painter, &view, a, b, e.rel, attached);
    }

    let mut clicked = None;
    let mut drop = None;
    for n in &nodes {
        let r = Rect::from_center_size(view.to_screen(world_pos(st, n)), NODE * view.zoom);
        let resp = ui.interact(r, ui.scope_id().with(n.id.as_str()), Sense::click_and_drag());
        if resp.drag_started() {
            st.drag = Some((n.id.clone(), Vec2::ZERO));
        }
        if resp.dragged()
            && let Some((_, d)) = st.drag.as_mut()
        {
            *d += resp.drag_delta() / view.zoom;
        }
        if resp.drag_stopped() {
            drop = st.drag.take();
        }
        if resp.clicked() {
            clicked = Some(n.id.clone());
        }
        let selected = st.selected.as_ref() == Some(&n.id);
        let source = st.connect_from.as_ref() == Some(&n.id);
        draw_node(&painter, r, n, view.zoom, selected || resp.hovered(), source);
    }

    if let Some((id, d)) = drop
        && let Some(n) = nodes.iter().find(|n| n.id == id)
        && d != Vec2::ZERO
    {
        let _ = app.ws.move_node(&id, n.x + d.x, n.y + d.y);
    }
    if let Some(id) = clicked {
        on_click(app, id);
    }
    // Remember where "Add node" should place things: the current view centre.
    let centre = view.to_world(rect.center());
    ui.ctx().data_mut(|d| d.insert_temp(egui::Id::unique("map-centre"), centre));
}

fn on_click(app: &mut WorkbenchApp, id: NodeId) {
    let st = &mut app.states.map;
    match st.connect_from.take() {
        Some(from) if from != id => {
            let edge = Edge { id: "".into(), from, to: id, rel: st.rel };
            app.status = Some(match app.ws.connect(edge) {
                Ok(_) => "Connected".into(),
                Err(e) => format!("Cannot connect: {e}"),
            });
        }
        _ => st.selected = Some(id),
    }
}

fn draw_node(painter: &egui::Painter, r: Rect, n: &GNode, zoom: f32, emphasis: bool, source: bool) {
    let fill = if emphasis { theme::RAISED.gamma_multiply(1.6) } else { theme::RAISED };
    painter.rect_filled(r, 10.0 * zoom, fill);
    if source {
        painter.rect_stroke(r, 10.0 * zoom, Stroke::new(2.0, theme::SIGNAL), egui::StrokeKind::Outside);
    }
    painter.circle_filled(r.left_center() + egui::vec2(14.0 * zoom, 0.0), 5.0 * zoom, node_color(n.kind));
    if zoom > 0.45 {
        let max_chars = ((r.width() - 34.0 * zoom) / (7.0 * zoom)).max(4.0) as usize;
        painter.text(
            r.left_center() + egui::vec2(26.0 * zoom, 0.0),
            egui::Align2::LEFT_CENTER,
            truncate(&n.label, max_chars),
            egui::FontId::proportional(13.0 * zoom),
            Color32::WHITE,
        );
    }
}

/// Orthogonal connector: out of the side facing the target, elbow at mid-x.
fn draw_edge(painter: &egui::Painter, view: &View, a: Vec2, b: Vec2, rel: Rel, emphasis: bool) {
    let dir = if b.x >= a.x { 1.0 } else { -1.0 };
    let start = view.to_screen(a + Vec2::new(dir * NODE.x / 2.0, 0.0));
    let end = view.to_screen(b - Vec2::new(dir * NODE.x / 2.0, 0.0));
    let mid = (start.x + end.x) / 2.0;
    let points = vec![start, Pos2::new(mid, start.y), Pos2::new(mid, end.y), end];
    let color = match (rel, emphasis) {
        (Rel::Contradicts, _) => theme::CONTRADICTS,
        (_, true) => Color32::from_gray(220),
        _ => theme::MUTED.gamma_multiply(0.7),
    };
    let width = if emphasis { 2.0 } else { 1.2 };
    painter.add(Shape::line(points, Stroke::new(width, color)));
    let tip = Vec2::new(-dir * 7.0, 0.0) * view.zoom;
    let wing = Vec2::new(0.0, 4.0) * view.zoom;
    painter.add(Shape::convex_polygon(vec![end, end + tip + wing, end + tip - wing], color, Stroke::NONE));
}

pub fn truncate(s: &str, max: usize) -> String {
    if s.chars().count() <= max {
        s.to_owned()
    } else {
        format!("{}…", s.chars().take(max.saturating_sub(1)).collect::<String>())
    }
}

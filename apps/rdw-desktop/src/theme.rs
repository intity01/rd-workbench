//! Visual tokens, mirroring `prototype/web/src/index.css`: solid tonal surfaces,
//! one lime accent used only as a fill.

use eframe::egui::{self, Color32, CornerRadius, Visuals};

pub const SIGNAL: Color32 = Color32::from_rgb(0xD4, 0xF0, 0x7A);
pub const ON_SIGNAL: Color32 = Color32::from_rgb(0x1A, 0x1A, 0x1D);
pub const APP: Color32 = Color32::from_rgb(0x12, 0x12, 0x14);
pub const SURFACE: Color32 = Color32::from_rgb(0x1A, 0x1A, 0x1D);
pub const RAISED: Color32 = Color32::from_rgb(0x26, 0x26, 0x2B);
pub const MUTED: Color32 = Color32::from_rgb(0x9A, 0x9A, 0xA3);
pub const CONTRADICTS: Color32 = Color32::from_rgb(0xE5, 0x48, 0x4D);

pub fn apply(ctx: &egui::Context) {
    let mut v = Visuals::dark();
    v.panel_fill = SURFACE;
    v.window_fill = RAISED;
    v.extreme_bg_color = APP;
    v.selection.bg_fill = SIGNAL;
    v.selection.stroke.color = ON_SIGNAL;
    v.hyperlink_color = SIGNAL;
    let r = CornerRadius::same(10);
    for w in [&mut v.widgets.inactive, &mut v.widgets.hovered, &mut v.widgets.active, &mut v.widgets.open] {
        w.corner_radius = r;
    }
    ctx.set_visuals(v);
}

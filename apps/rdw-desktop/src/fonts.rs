//! Font setup. egui's bundled fonts have no Thai glyphs, so we append a system
//! Thai font as a fallback. Proper Thai line breaking (ICU4X segmenter) and
//! shaping (cosmic-text) arrive in Phase 2.

use eframe::egui::{self, FontData, FontDefinitions, FontFamily};
use std::sync::Arc;

/// Candidate Thai-capable fonts, first match wins.
const THAI_FONTS: &[&str] = &[
    // Windows
    "C:/Windows/Fonts/LeelawUI.ttf",
    "C:/Windows/Fonts/leelawad.ttf",
    "C:/Windows/Fonts/tahoma.ttf",
    // macOS
    "/System/Library/Fonts/Supplemental/Thonburi.ttc",
    "/System/Library/Fonts/Thonburi.ttc",
    // Linux (fonts-thai-tlwg / Noto)
    "/usr/share/fonts/truetype/noto/NotoSansThai-Regular.ttf",
    "/usr/share/fonts/noto/NotoSansThai-Regular.ttf",
    "/usr/share/fonts/truetype/tlwg/Loma.ttf",
];

pub fn install(ctx: &egui::Context) {
    let mut defs = FontDefinitions::default();
    if let Some(bytes) = THAI_FONTS.iter().find_map(|p| std::fs::read(p).ok()) {
        defs.font_data.insert("thai".into(), Arc::new(FontData::from_owned(bytes)));
        for family in [FontFamily::Proportional, FontFamily::Monospace] {
            defs.families.entry(family).or_default().push("thai".into());
        }
    }
    ctx.set_fonts(defs);
}

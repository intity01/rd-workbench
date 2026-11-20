/// Top-level screens. Mirrors `prototype/web/src/app/routes.ts`.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Screen {
    Home,
    Projects,
    Research,
    Imports,
    Verify,
    Library,
    Map,
    Tasks,
    Settings,
    Help,
}

impl Screen {
    pub const NAV: [Screen; 10] = [
        Self::Home,
        Self::Projects,
        Self::Research,
        Self::Imports,
        Self::Verify,
        Self::Library,
        Self::Map,
        Self::Tasks,
        Self::Settings,
        Self::Help,
    ];

    pub fn label(self) -> &'static str {
        match self {
            Self::Home => "Home",
            Self::Projects => "Projects",
            Self::Research => "Research",
            Self::Imports => "Imports",
            Self::Verify => "Verify",
            Self::Library => "Library",
            Self::Map => "Knowledge map",
            Self::Tasks => "Tasks",
            Self::Settings => "Settings",
            Self::Help => "Help",
        }
    }

    /// Prototype folder that holds the reference UX for this screen.
    pub fn prototype_path(self) -> &'static str {
        match self {
            Self::Home => "features/home",
            Self::Projects => "features/projects",
            Self::Research => "features/research",
            Self::Imports => "features/imports",
            Self::Verify => "features/verify",
            Self::Library => "features/library",
            Self::Map => "features/map",
            Self::Tasks => "features/tasks",
            Self::Settings => "features/settings",
            Self::Help => "features/help",
        }
    }
}

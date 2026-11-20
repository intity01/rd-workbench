use serde::{Deserialize, Serialize};
use std::fmt;

macro_rules! id_type {
    ($(#[$doc:meta])* $name:ident) => {
        $(#[$doc])*
        #[derive(Debug, Clone, PartialEq, Eq, Hash, PartialOrd, Ord, Serialize, Deserialize)]
        #[serde(transparent)]
        pub struct $name(pub String);

        impl $name {
            pub fn new(value: impl Into<String>) -> Self {
                Self(value.into())
            }

            pub fn as_str(&self) -> &str {
                &self.0
            }
        }

        impl fmt::Display for $name {
            fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
                f.write_str(&self.0)
            }
        }

        impl From<&str> for $name {
            fn from(value: &str) -> Self {
                Self(value.to_owned())
            }
        }
    };
}

id_type!(
    /// Stable identifier of a [`crate::Project`], e.g. `P-001`.
    ProjectId
);
id_type!(
    /// Stable identifier of a [`crate::Source`], e.g. `S-014`.
    SourceId
);
id_type!(
    /// Stable identifier of a [`crate::GNode`] in the knowledge graph.
    NodeId
);
id_type!(
    /// Stable identifier of an [`crate::Edge`].
    EdgeId
);
id_type!(
    /// Stable identifier of a background [`crate::Task`].
    TaskId
);

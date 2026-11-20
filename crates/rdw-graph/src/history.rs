/// Bounded undo/redo stack of whole-state snapshots.
///
/// Mirrors `useGraphSlice` in the prototype: every mutation calls [`History::commit`]
/// with the state *before* the change.
#[derive(Debug, Clone)]
pub struct History<T> {
    past: Vec<T>,
    future: Vec<T>,
    limit: usize,
}

impl<T> History<T> {
    pub fn new(limit: usize) -> Self {
        Self { past: Vec::new(), future: Vec::new(), limit: limit.max(1) }
    }

    /// Records `before` and clears the redo stack.
    pub fn commit(&mut self, before: T) {
        if self.past.len() == self.limit {
            self.past.remove(0);
        }
        self.past.push(before);
        self.future.clear();
    }

    /// Returns the previous state; `current` moves onto the redo stack.
    pub fn undo(&mut self, current: T) -> Option<T> {
        let prev = self.past.pop()?;
        self.future.push(current);
        Some(prev)
    }

    /// Returns the next state; `current` moves onto the undo stack.
    pub fn redo(&mut self, current: T) -> Option<T> {
        let next = self.future.pop()?;
        self.past.push(current);
        Some(next)
    }

    pub fn can_undo(&self) -> bool {
        !self.past.is_empty()
    }

    pub fn can_redo(&self) -> bool {
        !self.future.is_empty()
    }
}

#[cfg(test)]
mod tests {
    use super::History;

    #[test]
    fn undo_redo_round_trip() {
        let mut h = History::new(2);
        let mut state = 0;
        for next in 1..=3 {
            h.commit(state);
            state = next;
        }
        // Limit 2: state 0 was dropped.
        state = h.undo(state).unwrap();
        assert_eq!(state, 2);
        state = h.undo(state).unwrap();
        assert_eq!(state, 1);
        assert!(h.undo(state).is_none());
        state = h.redo(state).unwrap();
        assert_eq!(state, 2);
    }
}

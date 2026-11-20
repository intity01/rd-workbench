use std::time::{Duration, Instant};

/// Classic token bucket. Time is passed in explicitly so the limiter is
/// deterministic in tests and can be driven by any clock.
#[derive(Debug, Clone)]
pub struct TokenBucket {
    capacity: f64,
    tokens: f64,
    refill_per_sec: f64,
    last: Instant,
}

impl TokenBucket {
    /// `rate` requests per `per`, allowing bursts of up to `burst` requests.
    pub fn new(rate: u32, per: Duration, burst: u32, now: Instant) -> Self {
        let capacity = f64::from(burst.max(1));
        Self { capacity, tokens: capacity, refill_per_sec: f64::from(rate) / per.as_secs_f64(), last: now }
    }

    fn refill(&mut self, now: Instant) {
        let elapsed = now.saturating_duration_since(self.last).as_secs_f64();
        self.tokens = (self.tokens + elapsed * self.refill_per_sec).min(self.capacity);
        self.last = now;
    }

    /// Takes one token if available.
    pub fn try_acquire(&mut self, now: Instant) -> bool {
        self.refill(now);
        if self.tokens >= 1.0 {
            self.tokens -= 1.0;
            true
        } else {
            false
        }
    }

    /// How long until the next token becomes available (zero if one is ready).
    pub fn wait_time(&mut self, now: Instant) -> Duration {
        self.refill(now);
        if self.tokens >= 1.0 || self.refill_per_sec <= 0.0 {
            Duration::ZERO
        } else {
            Duration::from_secs_f64((1.0 - self.tokens) / self.refill_per_sec)
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn bursts_then_throttles_then_refills() {
        let t0 = Instant::now();
        let mut b = TokenBucket::new(1, Duration::from_secs(3), 1, t0);
        assert!(b.try_acquire(t0));
        assert!(!b.try_acquire(t0));
        let wait = b.wait_time(t0);
        assert!(wait > Duration::from_millis(2_900) && wait <= Duration::from_secs(3));
        assert!(b.try_acquire(t0 + Duration::from_secs(3)));
    }
}

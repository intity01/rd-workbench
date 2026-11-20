//! Newline-delimited JSON framing over any `Read` / `Write`.

use serde::{Serialize, de::DeserializeOwned};
use std::io::{BufRead, Write};

#[derive(Debug, thiserror::Error)]
pub enum CodecError {
    #[error("io: {0}")]
    Io(#[from] std::io::Error),
    #[error("bad message: {0}")]
    Json(#[from] serde_json::Error),
}

/// Writes one message followed by `\n` and flushes.
pub fn send<W: Write, T: Serialize>(w: &mut W, msg: &T) -> Result<(), CodecError> {
    serde_json::to_writer(&mut *w, msg)?;
    w.write_all(b"\n")?;
    w.flush()?;
    Ok(())
}

/// Reads the next message. `Ok(None)` means the peer closed the stream.
/// Blank lines are skipped.
pub fn recv<R: BufRead, T: DeserializeOwned>(r: &mut R) -> Result<Option<T>, CodecError> {
    let mut line = String::new();
    loop {
        line.clear();
        if r.read_line(&mut line)? == 0 {
            return Ok(None);
        }
        if !line.trim().is_empty() {
            return Ok(Some(serde_json::from_str(line.trim_end())?));
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{PROTOCOL_VERSION, Request};
    use std::io::Cursor;

    #[test]
    fn round_trip_multiple_messages() {
        let mut buf = Vec::new();
        send(&mut buf, &Request::Hello { protocol: PROTOCOL_VERSION }).unwrap();
        buf.extend_from_slice(b"\n");
        send(&mut buf, &Request::Shutdown).unwrap();

        let mut r = Cursor::new(buf);
        let a: Request = recv(&mut r).unwrap().unwrap();
        let b: Request = recv(&mut r).unwrap().unwrap();
        assert_eq!(a, Request::Hello { protocol: PROTOCOL_VERSION });
        assert_eq!(b, Request::Shutdown);
        assert!(recv::<_, Request>(&mut r).unwrap().is_none());
    }
}

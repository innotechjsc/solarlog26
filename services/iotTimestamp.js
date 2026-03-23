/** Parse timestamp từ ingest (Unix s, ms, ISO) — dùng chung envelope + normalizer */

function parseIngestTimestamp(ts) {
  if (ts == null || ts === '') return { date: null, unixSec: null };
  if (typeof ts === 'string') {
    const d = new Date(ts);
    if (!Number.isNaN(d.getTime())) {
      return { date: d, unixSec: Math.floor(d.getTime() / 1000) };
    }
    const n = Number(ts);
    if (!Number.isNaN(n)) return parseIngestTimestamp(n);
    return { date: null, unixSec: null };
  }
  if (typeof ts === 'number') {
    if (ts > 1e12) {
      const d = new Date(ts);
      if (Number.isNaN(d.getTime())) return { date: null, unixSec: null };
      return { date: d, unixSec: Math.floor(ts / 1000) };
    }
    const d = new Date(ts * 1000);
    if (Number.isNaN(d.getTime())) return { date: null, unixSec: null };
    return { date: d, unixSec: Math.floor(ts) };
  }
  return { date: null, unixSec: null };
}

module.exports = { parseIngestTimestamp };

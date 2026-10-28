const { HttpError } = require("./errors");
/** Local-instance IP limiter; per-account reset cooldown is also stored in PostgreSQL. */
function rateLimit({ max, windowMs }) {
  const entries = new Map();
  return (req, res, next) => {
    const now = Date.now();
    for (const [key, entry] of entries) if (entry.until <= now) entries.delete(key);
    const key = req.ip || "unknown";
    let entry = entries.get(key);
    if (!entry) {
      if (entries.size >= 5000) return next(new HttpError(429, "Too many requests. Please try again later."));
      entry = { count: 0, until: now + windowMs };
      entries.set(key, entry);
    }
    entry.count++;
    if (entry.count > max) {
      res.set("Retry-After", String(Math.ceil((entry.until - now) / 1000)));
      return next(new HttpError(429, "Too many requests. Please try again later."));
    }
    next();
  };
}
module.exports = { rateLimit };

function parse(s, fallback = null) { try { return s == null ? fallback : JSON.parse(s); } catch { return fallback; } }
function stringify(o) { try { return JSON.stringify(o); } catch { return '{}'; } }
module.exports = { parse, stringify };

/* Furrow scoring engine (plan Section 2 and Section 4, steps 1, 3 and 4).
   Pure functions, no I/O, so they can be unit-tested with plain Node. */

export function norm(s) {
  const raw = String(s ?? "").replace(/️/g, "").trim();
  let n = raw.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ").replace(/['’`]/g, "").replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
  n = n.replace(/^the /, "");
  return n || raw; // emoji-only answers keep their raw form
}

const compact = n => n.replace(/ /g, "");
const digits = s => (s.match(/\d+/g) || []).join(",");

function lev(a, b) {
  if (a === b) return 0;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[b.length];
}

// Edit distance allowed for a typo match, by answer length.
// Short words must match exactly so "red" never matches "rod".
function allowance(len) { return len <= 4 ? 0 : len <= 7 ? 1 : len < 14 ? 2 : Math.floor(len * 0.15); }

/* q = { green: "a; b", yellow: { examples: "x; y|y2" }, orange: { examples } }
   ";" separates positions (closest first), "|" joins aliases at one position. */
export function entries(q) {
  const out = [];
  const add = (tier, pos, text) => text.split("|").map(t => t.trim()).filter(Boolean)
    .forEach(t => { const n = norm(t); out.push({ tier, pos, n, c: compact(n) }); });
  String(q.green || "").split(";").forEach(t => add("green", 0, t));
  for (const tier of ["yellow", "orange"]) {
    String((q[tier] && q[tier].examples) || "").split(";").map(t => t.trim()).filter(Boolean)
      .forEach((t, i) => add(tier, i, t));
  }
  return out;
}

function exactMatch(list, n) {
  const c = compact(n);
  for (const e of list) if (e.n === n || e.c === c) return e;
  return null;
}

function matchText(list, n) {
  const c = compact(n);
  const exact = exactMatch(list, n);
  if (exact) return exact;
  let best = null;
  for (const e of list) {                                                             // answer contains an entry
    if (e.c.length >= 4 && (" " + n + " ").includes(" " + e.n + " ") && (!best || e.n.length > best.n.length)) best = e;
  }
  if (best) return best;
  let bestD = Infinity;
  for (const e of list) {                                                             // typo match
    if (digits(e.c) !== digits(c)) continue;
    const d = lev(c, e.c), len = Math.max(c.length, e.c.length);
    if (d <= allowance(len) && d < bestD) { best = e; bestD = d; }
  }
  return best;
}

export function pointsFor(tier, pos) {
  if (tier === "green") return 100;
  if (tier === "yellow") return Math.max(70, 90 - 5 * pos);
  if (tier === "orange") return Math.max(40, 60 - 5 * pos);
  return 0;
}

/* Returns { tier, points } from the lists, or null when no list matches
   (the caller then asks the AI judge). Blank answers are red 0. */
export function scoreFromLists(q, answer) {
  const n = norm(answer);
  if (!n) return { tier: "red", points: 0, source: "blank" };
  const list = entries(q);
  // A whole answer that is itself on a list wins ("eggs and toast").
  // Otherwise, with several answers ("hockey and soccer"), only the first is scored.
  const first = firstAnswer(answer);
  let e = exactMatch(list, n) || matchText(list, norm(first) || n);
  return e ? { tier: e.tier, points: pointsFor(e.tier, e.pos), source: "list" } : null;
}

/* The first answer only, for judging and caching ("hockey and soccer" -> "hockey"). */
export function firstAnswer(answer) {
  const s = String(answer ?? "").trim();
  return s.split(/\s*(?:,|;|\/|\band\b|\bor\b|&)\s*/i).map(x => x.trim()).filter(Boolean)[0] || s;
}

/* Clamp a judge verdict into its tier's band. */
const BANDS = { green: [100, 100], yellow: [70, 90], orange: [40, 60], red: [0, 30] };
export function clampVerdict(v) {
  if (!v || !BANDS[v.tier]) return { tier: "red", points: 0 };
  const tier = v.tier;
  const [lo, hi] = BANDS[tier];
  const p = Math.round(Number(v && v.points));
  return { tier, points: Number.isFinite(p) ? Math.min(hi, Math.max(lo, p)) : lo };
}

/* A short blocklist so abuse is never sent to the judge or cached. */
const BLOCK = ["fuck", "shit", "cunt", "bitch", "nigg", "fag", "retard", "whore", "slut", "dick", "cock", "pussy", "rape"];
export function isProfane(answer) {
  const c = compact(norm(answer));
  return BLOCK.some(w => c.includes(w));
}

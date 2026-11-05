-- Furrow database (Cloudflare D1). Safe to run more than once.

-- The answer key. Loaded from a private seed file, never committed.
CREATE TABLE IF NOT EXISTS questions (
  id INTEGER PRIMARY KEY,
  theme TEXT NOT NULL,
  prompt TEXT NOT NULL,
  answer TEXT NOT NULL,          -- what the Reveal screen shows as Andre's answer
  green TEXT NOT NULL,           -- "a; b; c"
  yellow_rule TEXT,
  yellow_examples TEXT,          -- "x; y|y-alias", closest first
  orange_rule TEXT,
  orange_examples TEXT,
  reveal TEXT                    -- the 1–2 sentence story
);

-- Every judged answer, so everyone gets the same score for the same answer.
-- Edit or insert rows with source = 'manual' to override a verdict by hand.
CREATE TABLE IF NOT EXISTS verdicts (
  qid INTEGER NOT NULL,
  answer_norm TEXT NOT NULL,
  tier TEXT NOT NULL,
  points INTEGER NOT NULL,
  source TEXT NOT NULL DEFAULT 'judge',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (qid, answer_norm)
);

-- Answers the judge couldn't score, to review and rescore later.
CREATE TABLE IF NOT EXISTS flagged (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  qid INTEGER NOT NULL,
  answer TEXT NOT NULL,
  reason TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- One final score per player per day, for the score chart.
CREATE TABLE IF NOT EXISTS scores (
  day INTEGER NOT NULL,
  player TEXT NOT NULL,
  score INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (day, player)
);

-- Rate limiting for /api/answer (per IP, per 10-minute bucket).
CREATE TABLE IF NOT EXISTS hits (
  ip TEXT NOT NULL,
  bucket INTEGER NOT NULL,
  n INTEGER NOT NULL,
  PRIMARY KEY (ip, bucket)
);

/* Builds furrow-api/seed/questions.sql from the local question bank
   (furrow-data.js at the repo root). Both files hold every answer and
   are git-ignored: never commit them.
   Usage: node furrow-api/scripts/make-seed.mjs [path/to/furrow-data.js] */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const src = process.argv[2] || path.join(here, "../../furrow-data.js");
const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(src, "utf8"), sandbox);
const { questions } = sandbox.window.FURROW_DATA;
if (!questions || questions.length !== 100) throw new Error(`Expected 100 questions, got ${questions && questions.length}`);

const s = v => (v == null ? "NULL" : "'" + String(v).replace(/'/g, "''") + "'");
const rows = questions.map(q =>
  `INSERT INTO questions (id, theme, prompt, answer, green, yellow_rule, yellow_examples, orange_rule, orange_examples, reveal) VALUES (` +
  [q.id, s(q.theme), s(q.prompt), s(q.answer), s(q.green), s(q.yellow.rule), s(q.yellow.examples), s(q.orange.rule), s(q.orange.examples), s(q.reveal || null)].join(", ") +
  `) ON CONFLICT (id) DO UPDATE SET theme = excluded.theme, prompt = excluded.prompt, answer = excluded.answer, green = excluded.green, ` +
  `yellow_rule = excluded.yellow_rule, yellow_examples = excluded.yellow_examples, orange_rule = excluded.orange_rule, ` +
  `orange_examples = excluded.orange_examples, reveal = COALESCE(excluded.reveal, questions.reveal);`
);
fs.mkdirSync(path.join(here, "../seed"), { recursive: true });
const out = path.join(here, "../seed/questions.sql");
fs.writeFileSync(out, rows.join("\n") + "\n");
console.log(`Wrote ${rows.length} questions to ${out}`);

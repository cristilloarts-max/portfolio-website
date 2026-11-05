import { test } from "node:test";
import assert from "node:assert/strict";
import { scoreFromLists, norm, firstAnswer, clampVerdict, isProfane } from "../src/scoring.js";
import { dayNumber, dateOfDay, SCHEDULE } from "../src/schedule.js";

// Sample questions shaped like the database rows (no full answer key here).
const nhl = {
  green: "Toronto Maple Leafs; Leafs; TML; Maple Leafs; Toronto",
  yellow: { examples: "Toronto Marlies|Marlies; Montreal Canadiens|Habs|Canadiens; Ottawa Senators|Senators|Sens; Boston Bruins|Bruins" },
  orange: { examples: "" },
};
const jersey = { green: "11; #11; eleven", yellow: { examples: "10; 12; 1; 22; 27; 34" }, orange: { examples: "" } };
const shortcut = { green: "Ctrl+Z; Cmd+Z; undo", yellow: { examples: "Ctrl+Alt+Z; Ctrl+Shift+Z" }, orange: { examples: "Ctrl+T; Ctrl+J; Ctrl+X" } };
const emoji = { green: "Saluting face; salute; 🫡", yellow: { examples: "thumbs up|👍" }, orange: { examples: "skull|💀; red heart|❤️|❤" } };
const sport = { green: "Hockey; ice hockey", yellow: { examples: "Ball hockey" }, orange: { examples: "Soccer; basketball" } };

test("plan worked example #5", () => {
  assert.deepEqual(scoreFromLists(nhl, "Leafs"), { tier: "green", points: 100, source: "list" });
  assert.equal(scoreFromLists(nhl, "Montreal Canadiens").points, 85);   // second yellow
  assert.equal(scoreFromLists(nhl, "habs").points, 85);                  // alias shares the position
  assert.equal(scoreFromLists(nhl, "Edmonton Oilers"), null);            // goes to the judge
});

test("normalising: case, accents, punctuation, leading 'the'", () => {
  assert.equal(norm("Pokémon!"), "pokemon");
  assert.equal(norm("The Iron Giant"), "iron giant");
  assert.equal(scoreFromLists(nhl, "  the LEAFS!! ").tier, "green");
});

test("typos within the allowed distance", () => {
  assert.equal(scoreFromLists(nhl, "Montreal Canadians").tier, "yellow");
  assert.equal(scoreFromLists(nhl, "TMLL"), null);                        // short answers must match exactly
});

test("numbers never fuzzy-match", () => {
  assert.equal(scoreFromLists(jersey, "12").points, 85);
  assert.equal(scoreFromLists(jersey, "13"), null);
});

test("shortcuts and emoji", () => {
  assert.equal(scoreFromLists(shortcut, "ctrl+z").tier, "green");
  assert.equal(scoreFromLists(shortcut, "Ctrl X").tier, "orange");
  assert.equal(scoreFromLists(emoji, "🫡").tier, "green");
  assert.equal(scoreFromLists(emoji, "❤️").tier, "orange");
});

test("only the first of several answers is scored", () => {
  assert.equal(scoreFromLists(sport, "soccer and hockey").tier, "orange");
  assert.equal(firstAnswer("hockey and soccer"), "hockey");
});

test("blank is red 0", () => {
  assert.deepEqual(scoreFromLists(sport, "   "), { tier: "red", points: 0, source: "blank" });
});

test("judge verdicts are clamped into their band", () => {
  assert.deepEqual(clampVerdict({ tier: "orange", points: 95 }), { tier: "orange", points: 60 });
  assert.deepEqual(clampVerdict({ tier: "red", points: 30 }), { tier: "red", points: 30 });
  assert.deepEqual(clampVerdict({ tier: "purple", points: 50 }), { tier: "red", points: 0 });
});

test("profanity is blocked", () => {
  assert.equal(isProfane("sh!t"), false);
  assert.equal(isProfane("shit"), true);
  assert.equal(isProfane("Leafs"), false);
});

test("day numbers use Toronto time", () => {
  assert.equal(dayNumber(new Date("2026-11-05T12:00:00Z")), 1);
  assert.equal(dayNumber(new Date("2026-11-06T04:59:00Z")), 1);   // 23:59 in Toronto
  assert.equal(dayNumber(new Date("2026-11-06T05:00:00Z")), 2);   // midnight in Toronto
  assert.equal(dateOfDay(2), "2026-11-06");
  assert.equal(Object.values(SCHEDULE).flat().length, 100);
});

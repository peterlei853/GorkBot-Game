var assert = require("assert");
var fs = require("fs");
var path = require("path");
var Rules = require("../src/rules.js");

var TABLE = [
  null,
  { target: 8, time: 70, asteroids: 4, speed: 1 },
  { target: 10, time: 68, asteroids: 5, speed: 1.05 },
  { target: 12, time: 65, asteroids: 6, speed: 1.1 },
  { target: 14, time: 63, asteroids: 7, speed: 1.15 },
  { target: 16, time: 60, asteroids: 8, speed: 1.2 },
  { target: 18, time: 58, asteroids: 9, speed: 1.25 },
  { target: 20, time: 55, asteroids: 10, speed: 1.3 },
  { target: 22, time: 53, asteroids: 11, speed: 1.35 },
  { target: 24, time: 50, asteroids: 12, speed: 1.4 },
  { target: 26, time: 48, asteroids: 13, speed: 1.45 }
];

function eq(a, b, msg) {
  assert.strictEqual(a, b, msg || a + " !== " + b);
}

eq(Rules.VERSION, "0.2.1");
eq(Rules.LIVES, 3);
eq(Rules.BOUNCE_IMPULSE, 220);
eq(Rules.PLAYER_SPEED, 220);
eq(Rules.FRICTION, 0.9);
eq(Rules.SEPARATION_PAD, 2);
eq(Rules.CHARGE_SPEED, 12);
eq(Rules.CHARGE_MAX, 3);
eq(Rules.FIRE_INTERVAL, 0.35);
eq(Rules.BULLET_DAMAGE, 1);
eq(Rules.BEAM_DAMAGE, 5);
eq(Rules.ASTEROID_HP, 1);
eq(Rules.DROP_CHANCE, 0.05);
eq(Rules.MAX_SHOTS, 3);
eq(Rules.BEAM_WIDTH, 84);

for (var level = 1; level <= 10; level++) {
  var cfg = Rules.levelConfig(level);
  var row = TABLE[level];
  eq(cfg.endless, false, "level " + level);
  eq(cfg.target, row.target, "target " + level);
  eq(cfg.time, row.time, "time " + level);
  eq(cfg.asteroids, row.asteroids, "asteroids " + level);
  eq(cfg.speed, row.speed, "speed " + level);
  eq(cfg.asteroids, level + 3);
  eq(Rules.patternTime(level), row.time, "pattern time " + level);
}

/* 11+ uses the written formulas, not the 1–10 table continuation. */
eq(Rules.levelConfig(11).endless, true);
eq(Rules.levelConfig(11).target, null);
eq(Rules.levelConfig(11).asteroids, 19); // round(2.5 + 11*1.5) = 19
eq(Rules.levelConfig(11).speed, 1.5);
eq(Rules.levelConfig(12).asteroids, 21); // round(20.5) = 21
eq(Rules.levelConfig(13).asteroids, 22);
eq(Rules.levelConfig(14).asteroids, 24); // round(23.5) = 24
eq(Rules.levelConfig(20).asteroids, 33); // round(32.5) = 33
eq(Rules.levelConfig(20).speed, 1.95);
eq(Rules.levelConfig(10).asteroids, 13);
assert.notStrictEqual(Rules.levelConfig(2).asteroids, Math.round(2.5 + 2 * 1.5));

eq(Rules.endlessWaveTime(11), 45);
eq(Rules.endlessWaveTime(12), 43);
eq(Rules.endlessWaveTime(22), 18);
eq(Rules.endlessWaveTime(24), 15);

/* Contact segment: one hit until separated by radii + 2px. No i-frames. */
var sumR = 36;
var c0 = Rules.contactStep(false, sumR, sumR);
eq(c0.hit, true);
eq(c0.contacting, true);
var stay = Rules.contactStep(true, sumR, sumR);
eq(stay.hit, false);
eq(stay.contacting, true);
var edge = Rules.contactStep(true, sumR + 2, sumR);
eq(edge.hit, false);
eq(edge.contacting, true);
var sep = Rules.contactStep(true, sumR + 2.01, sumR);
eq(sep.hit, false);
eq(sep.contacting, false);
var gap = Rules.contactStep(false, sumR + 1, sumR);
eq(gap.hit, false);
eq(gap.contacting, false);
var again = Rules.contactStep(false, sumR - 0.1, sumR);
eq(again.hit, true);

var bounce = Rules.bounceVelocity(0, 0, 10, 0);
eq(bounce.vx, -220);
eq(bounce.vy, 0);
var same = Rules.bounceVelocity(5, 5, 5, 5);
eq(same.vx, 0);
eq(same.vy, -220);
var diag = Rules.bounceVelocity(10, 10, 0, 0);
assert.ok(Math.abs(Math.hypot(diag.vx, diag.vy) - 220) < 1e-6);

var kb = Rules.stepKnockback(220, 0, 1 / 60);
assert.ok(Math.abs(kb.dx - 220 / 60) < 1e-6);
eq(kb.vx, 198);
eq(kb.controllable, false);
var slow = Rules.stepKnockback(10, 0, 0.016);
eq(slow.controllable, true);
eq(slow.vx, 0);

var charged = Rules.stepWeapons(0, 0, 0.5, 0, true);
eq(charged.fired, null);
eq(charged.charge, 0.5);
var capped = Rules.stepWeapons(2.9, 0.2, 0.5, 11.99, true);
eq(capped.charge, 3);
eq(capped.fired, null);
eq(capped.fireCd, 0.2);
var beam = Rules.stepWeapons(0.01, 0, 0.016, 12, true);
eq(beam.fired, "beam");
eq(beam.charge, 0);
eq(beam.fireCd, 0.35);
var hold = Rules.stepWeapons(0, 0.35, 0.34, 220, true);
eq(hold.fired, null);
assert.ok(Math.abs(hold.fireCd - 0.01) < 1e-9);
var shot = Rules.stepWeapons(0, 0.01, 0.02, 220, true);
eq(shot.fired, "bullets");
eq(shot.fireCd, 0.35);
var locked = Rules.stepWeapons(1, 0, 0.5, 0, false);
eq(locked.fired, null);
eq(locked.charge, 1);

eq(Rules.shotOffsets(1).length, 1);
eq(Rules.shotOffsets(2).length, 2);
eq(Rules.shotOffsets(3).length, 3);
eq(Rules.gainShot(1), 2);
eq(Rules.gainShot(2), 3);
eq(Rules.gainShot(3), 3);
eq(Rules.rollDrop(function () { return 0.049; }), true);
eq(Rules.rollDrop(function () { return 0.05; }), false);

var stick = Rules.stickAxis(0, 100, 40, 0.15);
eq(stick.y, 1);
eq(stick.x, 0);
var rest = Rules.stickAxis(2, 0, 40, 0.15);
eq(rest.x, 0);
eq(rest.y, 0);

eq(Rules.distToSegment(0, 10, 0, 0, 100, 0), 10);
eq(Rules.distToSegment(50, 0, 0, 0, 100, 0), 0);

var root = path.join(__dirname, "..");
var html = fs.readFileSync(path.join(root, "index.html"), "utf8");
assert.ok(html.indexOf("v0.2.1") !== -1);
assert.ok(html.indexOf("joystick") !== -1);
assert.ok(html.indexOf('type="module"') === -1);
assert.ok(html.indexOf("rules.js") !== -1);
var playerSrc = fs.readFileSync(path.join(root, "src/entities/player.js"), "utf8");
var gameSrc = fs.readFileSync(path.join(root, "src/game.js"), "utf8");
assert.ok(!/invuln/.test(playerSrc), "player must not keep i-frames");
assert.ok(!/invuln/.test(gameSrc), "game must not keep i-frames");
assert.ok(gameSrc.indexOf("contactStep") !== -1);
assert.ok(gameSrc.indexOf("stepWeapons") !== -1);

console.log("rules.test.js ok");

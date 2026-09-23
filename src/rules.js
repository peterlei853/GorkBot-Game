/* Spec numbers for Star Scoop v0.2.1. Classic script (file://) and node-testable. */
(function (root) {
  var VERSION = "0.2.1";
  var LIVES = 3;
  var PLAYER_SPEED = 220;
  var PLAYER_R = 16;
  var BOUNCE_IMPULSE = 220;
  var FRICTION = 0.9;
  var SEPARATION_PAD = 2;
  var CHARGE_SPEED = 12;
  var CHARGE_MAX = 3;
  var FIRE_INTERVAL = 0.35;
  var BULLET_DAMAGE = 1;
  var BEAM_DAMAGE = 5;
  var ASTEROID_HP = 1;
  var DROP_CHANCE = 0.05;
  var MAX_SHOTS = 3;
  /* Visible ship is 28px wide (±14). Beam width is 3× the ship. */
  var BEAM_WIDTH = 28 * 3;
  /* Resting-thumb filter. Weapon logic still keys off speed < 12 px/s. */
  var JOY_DEADZONE = 0.15;
  var ENDLESS_WAVE_MIN = 15;

  /* Approved table for levels 1–10. Speed matches 1+(level-1)*0.05. */
  var TABLE = {
    1: { target: 8, time: 70, asteroids: 4 },
    2: { target: 10, time: 68, asteroids: 5 },
    3: { target: 12, time: 65, asteroids: 6 },
    4: { target: 14, time: 63, asteroids: 7 },
    5: { target: 16, time: 60, asteroids: 8 },
    6: { target: 18, time: 58, asteroids: 9 },
    7: { target: 20, time: 55, asteroids: 10 },
    8: { target: 22, time: 53, asteroids: 11 },
    9: { target: 24, time: 50, asteroids: 12 },
    10: { target: 26, time: 48, asteroids: 13 }
  };

  function speedMult(level) {
    return Math.round((1 + (level - 1) * 0.05) * 100) / 100;
  }

  /* Countdown cadence of levels 1–10, continued for endless wave length. */
  function patternTime(level) {
    var group = Math.floor((level - 1) / 2);
    var t = 70 - 5 * group;
    if (level % 2 === 0) t -= 2;
    return t;
  }

  function endlessWaveTime(level) {
    var t = patternTime(level);
    return t < ENDLESS_WAVE_MIN ? ENDLESS_WAVE_MIN : t;
  }

  function levelConfig(level) {
    var speed = speedMult(level);
    if (level >= 1 && level <= 10) {
      var row = TABLE[level];
      return {
        level: level,
        endless: false,
        target: row.target,
        time: row.time,
        asteroids: row.asteroids,
        speed: speed
      };
    }
    return {
      level: level,
      endless: true,
      target: null,
      time: null,
      asteroids: Math.round(2.5 + level * 1.5),
      speed: speed
    };
  }

  function contactStep(wasContacting, dist, sumR, pad) {
    if (pad == null) pad = SEPARATION_PAD;
    if (wasContacting) {
      if (dist > sumR + pad) return { contacting: false, hit: false };
      return { contacting: true, hit: false };
    }
    if (dist <= sumR) return { contacting: true, hit: true };
    return { contacting: false, hit: false };
  }

  function bounceVelocity(px, py, ax, ay, impulse) {
    if (impulse == null) impulse = BOUNCE_IMPULSE;
    var dx = px - ax;
    var dy = py - ay;
    var d = Math.hypot(dx, dy);
    if (d < 0.0001) return { vx: 0, vy: -impulse };
    return { vx: (dx / d) * impulse, vy: (dy / d) * impulse };
  }

  /* Move with the current impulse, then decay. Control returns under 12 px/s. */
  function stepKnockback(vx, vy, dt) {
    var dx = vx * dt;
    var dy = vy * dt;
    var nvx = vx * FRICTION;
    var nvy = vy * FRICTION;
    var speed = Math.hypot(nvx, nvy);
    var controllable = speed < CHARGE_SPEED;
    if (controllable) {
      nvx = 0;
      nvy = 0;
      speed = 0;
    }
    return { dx: dx, dy: dy, vx: nvx, vy: nvy, speed: speed, controllable: controllable };
  }

  function stepWeapons(charge, fireCd, dt, speed, controllable) {
    if (!controllable) {
      return { charge: charge, fireCd: fireCd, fired: null };
    }
    if (speed < CHARGE_SPEED) {
      charge = charge + dt;
      if (charge > CHARGE_MAX) charge = CHARGE_MAX;
      return { charge: charge, fireCd: fireCd, fired: null };
    }
    if (charge > 0) {
      return { charge: 0, fireCd: FIRE_INTERVAL, fired: "beam" };
    }
    fireCd = fireCd - dt;
    if (fireCd <= 0) {
      return { charge: 0, fireCd: FIRE_INTERVAL, fired: "bullets" };
    }
    return { charge: 0, fireCd: fireCd, fired: null };
  }

  function shotOffsets(count) {
    if (count >= 3) return [-10, 0, 10];
    if (count === 2) return [-7, 7];
    return [0];
  }

  function gainShot(count) {
    if (count < MAX_SHOTS) return count + 1;
    return MAX_SHOTS;
  }

  function rollDrop(rng) {
    return rng() < DROP_CHANCE;
  }

  function stickAxis(dx, dy, maxR, deadzone) {
    if (deadzone == null) deadzone = JOY_DEADZONE;
    var d = Math.hypot(dx, dy);
    if (d > maxR && d > 0) {
      dx *= maxR / d;
      dy *= maxR / d;
      d = maxR;
    }
    var x = d > 0 ? dx / maxR : 0;
    var y = d > 0 ? dy / maxR : 0;
    var m = Math.hypot(x, y);
    if (m < deadzone) return { x: 0, y: 0, knobX: dx, knobY: dy };
    return { x: x, y: y, knobX: dx, knobY: dy };
  }

  function distToSegment(px, py, x1, y1, x2, y2) {
    var dx = x2 - x1;
    var dy = y2 - y1;
    var len2 = dx * dx + dy * dy;
    if (len2 <= 0.0001) return Math.hypot(px - x1, py - y1);
    var t = ((px - x1) * dx + (py - y1) * dy) / len2;
    if (t < 0) t = 0;
    else if (t > 1) t = 1;
    var qx = x1 + t * dx;
    var qy = y1 + t * dy;
    return Math.hypot(px - qx, py - qy);
  }

  var api = {
    VERSION: VERSION,
    LIVES: LIVES,
    PLAYER_SPEED: PLAYER_SPEED,
    PLAYER_R: PLAYER_R,
    BOUNCE_IMPULSE: BOUNCE_IMPULSE,
    FRICTION: FRICTION,
    SEPARATION_PAD: SEPARATION_PAD,
    CHARGE_SPEED: CHARGE_SPEED,
    CHARGE_MAX: CHARGE_MAX,
    FIRE_INTERVAL: FIRE_INTERVAL,
    BULLET_DAMAGE: BULLET_DAMAGE,
    BEAM_DAMAGE: BEAM_DAMAGE,
    ASTEROID_HP: ASTEROID_HP,
    DROP_CHANCE: DROP_CHANCE,
    MAX_SHOTS: MAX_SHOTS,
    BEAM_WIDTH: BEAM_WIDTH,
    JOY_DEADZONE: JOY_DEADZONE,
    ENDLESS_WAVE_MIN: ENDLESS_WAVE_MIN,
    TABLE: TABLE,
    speedMult: speedMult,
    patternTime: patternTime,
    endlessWaveTime: endlessWaveTime,
    levelConfig: levelConfig,
    contactStep: contactStep,
    bounceVelocity: bounceVelocity,
    stepKnockback: stepKnockback,
    stepWeapons: stepWeapons,
    shotOffsets: shotOffsets,
    gainShot: gainShot,
    rollDrop: rollDrop,
    stickAxis: stickAxis,
    distToSegment: distToSegment
  };

  if (typeof module !== "undefined" && module.exports && typeof window === "undefined") {
    module.exports = api;
  }
  root.Rules = api;
})(typeof window !== "undefined" ? window : global);

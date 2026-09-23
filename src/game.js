window.Game = function (canvas) {
  this.canvas = canvas;
  this.ctx = canvas.getContext("2d");
  this.w = canvas.width;
  this.h = canvas.height;
  this.bounds = { w: this.w, h: this.h };

  this.state = "title"; // title | playing | paused | levelclear | fail
  this.currentLevel = 1;
  this.highestLevel = 1;
  this.lives = Rules.LIVES;
  this.collected = 0;
  this.timeLeft = Rules.levelConfig(1).time;
  this.survival = 0;
  this.waveTime = 0;
  this.charge = 0;
  this.fireCd = 0;
  this.shotCount = 1;
  this.player = null;
  this.energies = [];
  this.pickups = [];
  this.asteroids = [];
  this.bullets = [];
  this.beams = [];
  this.stars = [];
  this.banner = "";
  this.bannerT = 0;
  this.lastTs = 0;
  this.raf = 0;

  this._buildStars();
  this._bindUi();
  this._stampVersion();
  Input.attach(canvas);
};

Game.prototype._buildStars = function () {
  this.stars = [];
  for (var i = 0; i < 80; i++) {
    this.stars.push({
      x: Math.random() * this.w,
      y: Math.random() * this.h,
      s: Math.random() * 1.8 + 0.4,
      a: Math.random() * 0.6 + 0.2
    });
  }
};

Game.prototype._el = function (id) {
  return document.getElementById(id);
};

Game.prototype._stampVersion = function () {
  var label = "v" + Rules.VERSION;
  var hud = this._el("hud-version");
  var title = this._el("title-version");
  if (hud) hud.textContent = label;
  if (title) title.textContent = label;
};

Game.prototype._bindUi = function () {
  var self = this;
  this._el("btn-start").onclick = function () {
    GameAudio.unlock();
    GameAudio.startBgm();
    self.startRun();
  };
  this._el("btn-pause").onclick = function () {
    self.togglePause();
  };
  this._el("btn-resume").onclick = function () {
    self.togglePause();
  };
  this._el("btn-mute").onclick = function () {
    var m = GameAudio.toggleMute();
    self._el("btn-mute").textContent = m ? "取消静音" : "静音";
  };
  this._el("btn-restart").onclick = function () {
    GameAudio.unlock();
    if (self.state === "title") GameAudio.startBgm();
    self.startRun();
  };
  this._el("btn-next").onclick = function () {
    self.currentLevel += 1;
    self.highestLevel = Math.max(self.highestLevel, self.currentLevel);
    self.startLevel();
  };
  this._el("btn-retry").onclick = function () {
    self.lives = Rules.LIVES;
    self.shotCount = 1;
    self.startLevel();
  };
  this._el("btn-title").onclick = function () {
    self.showTitle();
  };

  window.addEventListener("keydown", function (e) {
    if (e.code === "Escape" || e.code === "KeyP") {
      if (self.state === "playing" || self.state === "paused") self.togglePause();
    }
  });
};

Game.prototype._hideAllOverlays = function () {
  ["title-screen", "pause-overlay", "level-overlay", "fail-overlay"].forEach(function (id) {
    var el = document.getElementById(id);
    if (!el) return;
    el.classList.add("hidden");
    el.setAttribute("aria-hidden", "true");
  });
};

Game.prototype._show = function (id) {
  var el = this._el(id);
  el.classList.remove("hidden");
  el.setAttribute("aria-hidden", "false");
};

Game.prototype.showTitle = function () {
  this.state = "title";
  this.currentLevel = 1;
  this.highestLevel = 1;
  this.lives = Rules.LIVES;
  this.collected = 0;
  this.shotCount = 1;
  this.charge = 0;
  this.fireCd = 0;
  this.survival = 0;
  this.waveTime = 0;
  this.timeLeft = Rules.levelConfig(1).time;
  this.player = null;
  this._hideAllOverlays();
  this._show("title-screen");
  this._updateHud();
};

Game.prototype.startRun = function () {
  this.currentLevel = 1;
  this.highestLevel = 1;
  this.lives = Rules.LIVES;
  this.shotCount = 1;
  this.startLevel();
};

Game.prototype.startLevel = function () {
  var cfg = Rules.levelConfig(this.currentLevel);
  this.collected = 0;
  this.waveTime = 0;
  this.charge = 0;
  this.fireCd = 0;
  this.survival = 0;
  this.timeLeft = cfg.endless ? 0 : cfg.time;
  this.player = new Player(this.w / 2, this.h / 2);
  this.energies = [];
  this.pickups = [];
  this.asteroids = [];
  this.bullets = [];
  this.beams = [];
  this.banner = "";
  this.bannerT = 0;
  if (cfg.endless) this._spawnEnergies(6);
  else this._spawnEnergies(cfg.target + 2);
  this._spawnAsteroids(cfg.asteroids, cfg.speed);
  this.state = "playing";
  this._hideAllOverlays();
  this._updateHud();
};

Game.prototype._spawnEnergies = function (n) {
  for (var i = 0; i < n; i++) {
    var p = this._safeSpot(40);
    this.energies.push(new Energy(p.x, p.y));
  }
};

Game.prototype._spawnAsteroids = function (n, speedScale) {
  for (var i = 0; i < n; i++) {
    var p = this._safeSpot(100);
    this.asteroids.push(new Asteroid(p.x, p.y, speedScale));
  }
};

Game.prototype._safeSpot = function (minDist) {
  var x;
  var y;
  var tries = 0;
  var px = this.player ? this.player.x : this.w / 2;
  var py = this.player ? this.player.y : this.h / 2;
  do {
    x = 40 + Math.random() * (this.w - 80);
    y = 40 + Math.random() * (this.h - 80);
    tries++;
  } while (Math.hypot(x - px, y - py) < minDist && tries < 50);
  if (Math.hypot(x - px, y - py) < minDist) {
    x = px > this.w / 2 ? 36 : this.w - 36;
    y = py > this.h / 2 ? 36 : this.h - 36;
  }
  return { x: x, y: y };
};

Game.prototype.togglePause = function () {
  if (this.state === "playing") {
    this.state = "paused";
    this._show("pause-overlay");
  } else if (this.state === "paused") {
    this.state = "playing";
    this._el("pause-overlay").classList.add("hidden");
    this._el("pause-overlay").setAttribute("aria-hidden", "true");
  }
};

Game.prototype.showLevelClear = function () {
  this.state = "levelclear";
  var n = this.currentLevel;
  var next = this._el("btn-next");
  if (n >= 10) {
    this._el("level-msg").textContent = "第 " + n + " 关完成！进入无尽模式";
    next.textContent = "进入无尽";
  } else {
    this._el("level-msg").textContent = "过关！完成第 " + n + " 关";
    next.textContent = "下一关";
  }
  this._show("level-overlay");
};

Game.prototype.showFail = function (reason) {
  this.state = "fail";
  this.highestLevel = Math.max(this.highestLevel, this.currentLevel);
  this._el("fail-msg").textContent = reason;
  this._el("fail-level").textContent = "最高关卡 " + this.highestLevel;
  this._hideAllOverlays();
  this._show("fail-overlay");
  this._updateHud();
};

Game.prototype._updateHud = function () {
  var cfg = Rules.levelConfig(this.currentLevel);
  var levelText = "关卡 " + this.currentLevel;
  if (cfg.endless && this.state !== "title") levelText += " · 无尽";
  this._el("hud-level").textContent = levelText;

  var collectEl = this._el("hud-collect");
  if (cfg.endless && this.state !== "title") {
    this._el("hud-time").textContent = "生存 " + Math.floor(this.survival) + "s";
    collectEl.textContent = "";
    collectEl.style.display = "none";
  } else {
    collectEl.style.display = "";
    var shown = cfg.endless ? Rules.levelConfig(1) : cfg;
    this._el("hud-time").textContent = "时间 " + Math.max(0, Math.ceil(this.timeLeft));
    collectEl.textContent = "能量 " + this.collected + "/" + shown.target;
  }

  var hearts = "";
  var i;
  for (i = 0; i < this.lives; i++) hearts += "❤";
  for (i = this.lives; i < Rules.LIVES; i++) hearts += "♡";
  this._el("hud-lives").textContent = "生命 " + hearts;
  this._el("hud-shots").textContent = "射击 ×" + this.shotCount;

  var pct = (this.charge / Rules.CHARGE_MAX) * 100;
  this._el("hud-charge-fill").style.width = pct + "%";
  var meter = this._el("hud-charge");
  meter.setAttribute("aria-valuenow", this.charge.toFixed(2));
  meter.classList.toggle("ready", this.charge >= Rules.CHARGE_MAX);
};

Game.prototype._fireBullets = function () {
  var facing = this.player.facing;
  var fx = Math.cos(facing);
  var fy = Math.sin(facing);
  var len = Math.hypot(fx, fy) || 1;
  fx /= len;
  fy /= len;
  var px = -fy;
  var py = fx;
  var offsets = Rules.shotOffsets(this.shotCount);
  var speed = 520;
  for (var i = 0; i < offsets.length; i++) {
    this.bullets.push(
      new Bullet(
        this.player.x + px * offsets[i],
        this.player.y + py * offsets[i],
        fx * speed,
        fy * speed,
        Rules.BULLET_DAMAGE
      )
    );
  }
  GameAudio.sfxShoot();
};

Game.prototype._fireBeam = function () {
  var facing = this.player.facing;
  var fx = Math.cos(facing);
  var fy = Math.sin(facing);
  var len = Math.hypot(fx, fy) || 1;
  this.beams.push(
    new Beam(
      this.player.x,
      this.player.y,
      fx / len,
      fy / len,
      Rules.BEAM_WIDTH,
      Rules.BEAM_DAMAGE
    )
  );
  GameAudio.sfxBeam();
};

Game.prototype._damageAsteroid = function (asteroid, dmg) {
  if (!asteroid.alive) return;
  asteroid.hp -= dmg;
  if (asteroid.hp > 0) return;
  asteroid.alive = false;
  asteroid.contacting = false;
  GameAudio.sfxBreak();
  if (Rules.rollDrop(Math.random)) {
    this.pickups.push(new ShotPickup(asteroid.x, asteroid.y));
  }
};

Game.prototype._updateBullets = function (dt) {
  var i;
  var j;
  for (i = this.bullets.length - 1; i >= 0; i--) {
    var b = this.bullets[i];
    b.update(dt, this.bounds);
    if (!b.alive) {
      this.bullets.splice(i, 1);
      continue;
    }
    for (j = 0; j < this.asteroids.length; j++) {
      var a = this.asteroids[j];
      if (!a.alive) continue;
      if (Math.hypot(a.x - b.x, a.y - b.y) < a.r + b.r) {
        this._damageAsteroid(a, b.damage);
        b.alive = false;
        break;
      }
    }
    if (!b.alive) this.bullets.splice(i, 1);
  }
};

Game.prototype._updateBeams = function (dt) {
  var i;
  var j;
  for (i = this.beams.length - 1; i >= 0; i--) {
    var beam = this.beams[i];
    beam.update(dt);
    if (beam.alive) {
      for (j = 0; j < this.asteroids.length; j++) {
        var a = this.asteroids[j];
        if (!a.alive || beam.hit[a.id]) continue;
        if (beam.intersects(a.x, a.y, a.r)) {
          beam.hit[a.id] = true;
          this._damageAsteroid(a, beam.damage);
        }
      }
    }
    if (!beam.alive) this.beams.splice(i, 1);
  }
};

Game.prototype._updateEnergies = function (dt, cfg) {
  var i;
  for (i = 0; i < this.energies.length; i++) {
    var e = this.energies[i];
    if (!e.alive) continue;
    e.update(dt);
    if (Math.hypot(e.x - this.player.x, e.y - this.player.y) < e.r + this.player.r * 0.7) {
      e.alive = false;
      this.collected++;
      GameAudio.sfxPickup();
      if (!cfg.endless && this.collected >= cfg.target) {
        this.showLevelClear();
        this._updateHud();
        return;
      }
    }
  }
  this.energies = this.energies.filter(function (e) {
    return e.alive;
  });
  if (cfg.endless) {
    if (this.energies.length < 3) this._spawnEnergies(2);
  } else if (this.energies.length < 3 && this.collected < cfg.target) {
    this._spawnEnergies(3);
  }
};

Game.prototype._updatePickups = function (dt) {
  var i;
  for (i = 0; i < this.pickups.length; i++) {
    var p = this.pickups[i];
    if (!p.alive) continue;
    p.update(dt);
    if (Math.hypot(p.x - this.player.x, p.y - this.player.y) < p.r + this.player.r * 0.7) {
      p.alive = false;
      this.shotCount = Rules.gainShot(this.shotCount);
      GameAudio.sfxPickup();
    }
  }
  this.pickups = this.pickups.filter(function (p) {
    return p.alive;
  });
};

Game.prototype._hitPlayer = function (asteroid) {
  this.lives -= 1;
  if (this.lives < 0) this.lives = 0;
  var bounce = Rules.bounceVelocity(
    this.player.x,
    this.player.y,
    asteroid.x,
    asteroid.y,
    Rules.BOUNCE_IMPULSE
  );
  this.player.vx = bounce.vx;
  this.player.vy = bounce.vy;
  this.player.controllable = false;
  GameAudio.sfxImpact();
  if (this.lives <= 0) {
    this.showFail("Game Over — 生命用尽");
    return true;
  }
  return false;
};

Game.prototype._updateAsteroids = function (dt) {
  for (var i = 0; i < this.asteroids.length; i++) {
    var a = this.asteroids[i];
    if (!a.alive) continue;
    a.update(dt, this.bounds);
    var dist = Math.hypot(a.x - this.player.x, a.y - this.player.y);
    var sumR = a.r + this.player.r;
    var step = Rules.contactStep(a.contacting, dist, sumR, Rules.SEPARATION_PAD);
    a.contacting = step.contacting;
    if (step.hit) {
      if (this._hitPlayer(a)) return;
    }
  }
};

Game.prototype._refillAsteroids = function (cfg) {
  this.asteroids = this.asteroids.filter(function (a) {
    return a.alive;
  });
  if (this.beams.length > 0) return;
  if (this.asteroids.length < cfg.asteroids) {
    this._spawnAsteroids(cfg.asteroids - this.asteroids.length, cfg.speed);
  }
};

Game.prototype._advanceEndless = function (dt, cfg) {
  if (!cfg.endless) return;
  this.survival += dt;
  this.waveTime += dt;
  var need = Rules.endlessWaveTime(this.currentLevel);
  if (this.waveTime < need) return;
  this.currentLevel += 1;
  this.highestLevel = Math.max(this.highestLevel, this.currentLevel);
  this.waveTime = 0;
  var next = Rules.levelConfig(this.currentLevel);
  this.asteroids = [];
  this.beams = [];
  this._spawnAsteroids(next.asteroids, next.speed);
  this.banner = "关卡 " + this.currentLevel;
  this.bannerT = 1.4;
};

Game.prototype.update = function (dt) {
  if (this.state !== "playing") return;
  var cfg = Rules.levelConfig(this.currentLevel);
  if (!cfg.endless) {
    this.timeLeft -= dt;
    if (this.timeLeft <= 0) {
      this.timeLeft = 0;
      this.showFail("超时！未收够能量块");
      return;
    }
  }

  var axis = Input.moveAxis();
  var mouse = Input.joystickHeld() ? null : Input.getMouse();
  this.player.update(dt, axis, mouse, this.bounds);

  // Weapons read velocity after movement and before collision, so a hit
  // does not count as resuming movement and knockback does not fire the beam.
  var speed = Math.hypot(this.player.vx, this.player.vy);
  var weapons = Rules.stepWeapons(this.charge, this.fireCd, dt, speed, this.player.controllable);
  this.charge = weapons.charge;
  this.fireCd = weapons.fireCd;
  this.player.charge = this.charge;
  if (weapons.fired === "beam") this._fireBeam();
  else if (weapons.fired === "bullets") this._fireBullets();

  this._updateBullets(dt);
  this._updateBeams(dt);
  this._updateEnergies(dt, cfg);
  if (this.state !== "playing") return;
  this._updatePickups(dt);
  this._updateAsteroids(dt);
  if (this.state !== "playing") return;
  this._refillAsteroids(cfg);
  this._advanceEndless(dt, cfg);
  if (this.bannerT > 0) this.bannerT -= dt;
  this._updateHud();
};

Game.prototype.draw = function () {
  var ctx = this.ctx;
  ctx.clearRect(0, 0, this.w, this.h);
  ctx.fillStyle = "#0a1228";
  ctx.fillRect(0, 0, this.w, this.h);
  var s;
  for (s = 0; s < this.stars.length; s++) {
    var st = this.stars[s];
    ctx.fillStyle = "rgba(220,230,255," + st.a + ")";
    ctx.beginPath();
    ctx.arc(st.x, st.y, st.s, 0, Math.PI * 2);
    ctx.fill();
  }

  if (this.state === "title") return;

  var i;
  for (i = 0; i < this.energies.length; i++) this.energies[i].draw(ctx);
  for (i = 0; i < this.pickups.length; i++) this.pickups[i].draw(ctx);
  for (i = 0; i < this.asteroids.length; i++) this.asteroids[i].draw(ctx);
  for (i = 0; i < this.bullets.length; i++) this.bullets[i].draw(ctx);
  for (i = 0; i < this.beams.length; i++) this.beams[i].draw(ctx);
  if (this.player) this.player.draw(ctx);

  if (this.bannerT > 0 && this.banner) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, this.bannerT);
    ctx.fillStyle = "#fff6a8";
    ctx.font = "22px Segoe UI, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(this.banner, this.w / 2, 40);
    ctx.restore();
  }
};

Game.prototype._tick = function (ts) {
  if (!this.lastTs) this.lastTs = ts;
  var dt = Math.min(0.05, (ts - this.lastTs) / 1000);
  this.lastTs = ts;
  this.update(dt);
  this.draw();
  this.raf = requestAnimationFrame(this._boundTick);
};

Game.prototype.start = function () {
  var self = this;
  if (!this._boundTick) {
    this._boundTick = function (ts) {
      self._tick(ts);
    };
  }
  this.showTitle();
  this.lastTs = 0;
  if (this.raf) cancelAnimationFrame(this.raf);
  this.raf = requestAnimationFrame(this._boundTick);
};

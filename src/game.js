window.Game = function (canvas) {
  this.canvas = canvas;
  this.ctx = canvas.getContext("2d");
  this.w = canvas.width;
  this.h = canvas.height;
  this.bounds = { w: this.w, h: this.h };

  this.state = "title"; // title | playing | paused | levelclear | fail | win
  this.levelIndex = 0;
  this.lives = 3;
  this.collected = 0;
  this.timeLeft = 70;
  this.player = null;
  this.energies = [];
  this.asteroids = [];
  this.stars = [];
  this.lastTs = 0;
  this.raf = 0;
  this.levels = [
    { time: 70, target: 8, density: "low", speed: 0.85, count: 5 },
    { time: 65, target: 12, density: "mid", speed: 1.15, count: 8 },
    { time: 60, target: 16, density: "high", speed: 1.45, count: 12 }
  ];

  this._buildStars();
  this._bindUi();
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
    self.startRun();
  };
  this._el("btn-next").onclick = function () {
    self.levelIndex++;
    if (self.levelIndex >= self.levels.length) {
      self.showWin();
    } else {
      self.startLevel();
    }
  };
  this._el("btn-retry").onclick = function () {
    self.lives = 3;
    self.startLevel();
  };
  this._el("btn-title").onclick = function () {
    self.showTitle();
  };
  this._el("btn-again").onclick = function () {
    self.startRun();
  };

  window.addEventListener("keydown", function (e) {
    if (e.code === "Escape" || e.code === "KeyP") {
      if (self.state === "playing" || self.state === "paused") self.togglePause();
    }
  });
};

Game.prototype._hideAllOverlays = function () {
  ["title-screen", "pause-overlay", "level-overlay", "fail-overlay", "win-overlay"].forEach(
    function (id) {
      var el = document.getElementById(id);
      el.classList.add("hidden");
      el.setAttribute("aria-hidden", "true");
    }
  );
};

Game.prototype._show = function (id) {
  var el = this._el(id);
  el.classList.remove("hidden");
  el.setAttribute("aria-hidden", "false");
};

Game.prototype.showTitle = function () {
  this.state = "title";
  this._hideAllOverlays();
  this._show("title-screen");
  this._updateHud();
};

Game.prototype.startRun = function () {
  this.levelIndex = 0;
  this.lives = 3;
  this.startLevel();
};

Game.prototype.startLevel = function () {
  var cfg = this.levels[this.levelIndex];
  this.collected = 0;
  this.timeLeft = cfg.time;
  this.player = new Player(this.w / 2, this.h / 2);
  this.energies = [];
  this.asteroids = [];
  this._spawnEnergies(cfg.target + 2);
  this._spawnAsteroids(cfg.count, cfg.speed);
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
    var p = this._safeSpot(80);
    this.asteroids.push(new Asteroid(p.x, p.y, speedScale));
  }
};

Game.prototype._safeSpot = function (minDist) {
  var x, y, tries = 0;
  do {
    x = 40 + Math.random() * (this.w - 80);
    y = 40 + Math.random() * (this.h - 80);
    tries++;
  } while (
    this.player &&
    Math.hypot(x - this.player.x, y - this.player.y) < minDist &&
    tries < 40
  );
  return { x: x, y: y };
};

Game.prototype.togglePause = function () {
  if (this.state === "playing") {
    this.state = "paused";
    this._show("pause-overlay");
  } else if (this.state === "paused") {
    this.state = "playing";
    this._el("pause-overlay").classList.add("hidden");
  }
};

Game.prototype.showLevelClear = function () {
  this.state = "levelclear";
  this._el("level-msg").textContent =
    "过关！完成第 " + (this.levelIndex + 1) + " 关";
  var next = this._el("btn-next");
  if (this.levelIndex + 1 >= this.levels.length) {
    next.textContent = "看结果";
  } else {
    next.textContent = "下一关";
  }
  this._show("level-overlay");
};

Game.prototype.showFail = function (reason) {
  this.state = "fail";
  this._el("fail-msg").textContent = reason;
  this._show("fail-overlay");
};

Game.prototype.showWin = function () {
  this.state = "win";
  this._hideAllOverlays();
  this._show("win-overlay");
};

Game.prototype._updateHud = function () {
  var cfg = this.levels[this.levelIndex] || this.levels[0];
  this._el("hud-level").textContent =
    "关卡 " + (this.levelIndex + 1) + "/" + this.levels.length;
  this._el("hud-time").textContent = "时间 " + Math.max(0, Math.ceil(this.timeLeft));
  this._el("hud-collect").textContent =
    "能量 " + this.collected + "/" + cfg.target;
  var hearts = "";
  for (var i = 0; i < this.lives; i++) hearts += "❤";
  for (var j = this.lives; j < 3; j++) hearts += "♡";
  this._el("hud-lives").textContent = "生命 " + hearts;
};

Game.prototype.update = function (dt) {
  if (this.state !== "playing") return;
  var cfg = this.levels[this.levelIndex];
  this.timeLeft -= dt;
  if (this.timeLeft <= 0) {
    this.timeLeft = 0;
    this.showFail("超时！未收够能量块");
    return;
  }

  var axis = Input.moveAxis();
  this.player.update(dt, axis, Input.getPointer(), this.bounds);

  var i;
  for (i = 0; i < this.energies.length; i++) {
    var e = this.energies[i];
    if (!e.alive) continue;
    e.update(dt);
    if (Math.hypot(e.x - this.player.x, e.y - this.player.y) < e.r + this.player.r * 0.7) {
      e.alive = false;
      this.collected++;
      GameAudio.sfxPickup();
      if (this.collected >= cfg.target) {
        this.showLevelClear();
        this._updateHud();
        return;
      }
    }
  }
  // respawn energy if field gets empty before target
  var aliveE = this.energies.filter(function (x) {
    return x.alive;
  }).length;
  if (aliveE < 3 && this.collected < cfg.target) {
    this._spawnEnergies(3);
  }

  for (i = 0; i < this.asteroids.length; i++) {
    var a = this.asteroids[i];
    a.update(dt, this.bounds);
    if (
      this.player.invuln <= 0 &&
      Math.hypot(a.x - this.player.x, a.y - this.player.y) < a.r + this.player.r * 0.65
    ) {
      this.lives--;
      this.player.invuln = 1.4;
      GameAudio.sfxHit();
      if (this.lives <= 0) {
        this.lives = 0;
        this.showFail("Game Over — 生命用尽");
        this._updateHud();
        return;
      }
    }
  }
  this._updateHud();
};

Game.prototype.draw = function () {
  var ctx = this.ctx;
  ctx.clearRect(0, 0, this.w, this.h);
  // starfield
  ctx.fillStyle = "#0a1228";
  ctx.fillRect(0, 0, this.w, this.h);
  for (var s = 0; s < this.stars.length; s++) {
    var st = this.stars[s];
    ctx.fillStyle = "rgba(220,230,255," + st.a + ")";
    ctx.beginPath();
    ctx.arc(st.x, st.y, st.s, 0, Math.PI * 2);
    ctx.fill();
  }

  if (this.state === "title") {
    ctx.fillStyle = "rgba(126,200,255,0.15)";
    ctx.beginPath();
    ctx.arc(this.w / 2, this.h / 2, 60, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  var i;
  for (i = 0; i < this.energies.length; i++) this.energies[i].draw(ctx);
  for (i = 0; i < this.asteroids.length; i++) this.asteroids[i].draw(ctx);
  if (this.player) this.player.draw(ctx);
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

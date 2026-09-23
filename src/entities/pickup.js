window.ShotPickup = function (x, y) {
  this.x = x;
  this.y = y;
  this.r = 11;
  this.phase = Math.random() * Math.PI * 2;
  this.alive = true;
};

ShotPickup.prototype.update = function (dt) {
  this.phase += dt * 5;
};

ShotPickup.prototype.draw = function (ctx) {
  if (!this.alive) return;
  var pulse = 1 + Math.sin(this.phase) * 0.12;
  ctx.save();
  ctx.translate(this.x, this.y);
  ctx.scale(pulse, pulse);
  var g = ctx.createRadialGradient(0, 0, 1, 0, 0, 14);
  g.addColorStop(0, "#fffef2");
  g.addColorStop(0.4, "#ffe56a");
  g.addColorStop(1, "rgba(255,196,64,0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};

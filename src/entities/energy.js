window.Energy = function (x, y) {
  this.x = x;
  this.y = y;
  this.r = 10;
  this.phase = Math.random() * Math.PI * 2;
  this.alive = true;
};

Energy.prototype.update = function (dt) {
  this.phase += dt * 4;
};

Energy.prototype.draw = function (ctx) {
  if (!this.alive) return;
  var pulse = 1 + Math.sin(this.phase) * 0.15;
  ctx.save();
  ctx.translate(this.x, this.y);
  ctx.scale(pulse, pulse);
  ctx.rotate(this.phase * 0.3);
  var g = ctx.createRadialGradient(0, 0, 1, 0, 0, 12);
  g.addColorStop(0, "#fff6a8");
  g.addColorStop(0.45, "#5dffd2");
  g.addColorStop(1, "rgba(93,255,210,0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(0, -11);
  ctx.lineTo(8, 0);
  ctx.lineTo(0, 11);
  ctx.lineTo(-8, 0);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
};

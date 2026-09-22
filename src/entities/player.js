window.Player = function (x, y) {
  this.x = x;
  this.y = y;
  this.r = 16;
  this.speed = 220;
  this.invuln = 0;
};

Player.prototype.update = function (dt, axis, pointer, bounds) {
  var vx = axis.x;
  var vy = axis.y;
  if (pointer && pointer.active) {
    var dx = pointer.x - this.x;
    var dy = pointer.y - this.y;
    var dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 8) {
      vx = dx / dist;
      vy = dy / dist;
    } else {
      vx = 0;
      vy = 0;
    }
  }
  var len = Math.sqrt(vx * vx + vy * vy);
  if (len > 1) {
    vx /= len;
    vy /= len;
  }
  this.x += vx * this.speed * dt;
  this.y += vy * this.speed * dt;
  this.x = Math.max(this.r, Math.min(bounds.w - this.r, this.x));
  this.y = Math.max(this.r, Math.min(bounds.h - this.r, this.y));
  if (this.invuln > 0) this.invuln -= dt;
};

Player.prototype.draw = function (ctx) {
  ctx.save();
  if (this.invuln > 0 && Math.floor(this.invuln * 10) % 2 === 0) {
    ctx.globalAlpha = 0.35;
  }
  // Blue-white rounded ship with engine glow
  ctx.translate(this.x, this.y);
  ctx.fillStyle = "#7ec8ff";
  ctx.beginPath();
  ctx.moveTo(0, -16);
  ctx.lineTo(14, 12);
  ctx.lineTo(0, 6);
  ctx.lineTo(-14, 12);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#f2f7ff";
  ctx.beginPath();
  ctx.arc(0, -2, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ff9a3c";
  ctx.beginPath();
  ctx.moveTo(-5, 10);
  ctx.lineTo(0, 18 + Math.random() * 4);
  ctx.lineTo(5, 10);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
};

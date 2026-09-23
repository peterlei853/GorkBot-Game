window.Bullet = function (x, y, vx, vy, damage) {
  this.x = x;
  this.y = y;
  this.vx = vx;
  this.vy = vy;
  this.r = 4;
  this.damage = damage;
  this.alive = true;
};

Bullet.prototype.update = function (dt, bounds) {
  this.x += this.vx * dt;
  this.y += this.vy * dt;
  if (this.x < -30 || this.y < -30 || this.x > bounds.w + 30 || this.y > bounds.h + 30) {
    this.alive = false;
  }
};

Bullet.prototype.draw = function (ctx) {
  ctx.save();
  ctx.fillStyle = "#d7f6ff";
  ctx.shadowColor = "#7ec8ff";
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};

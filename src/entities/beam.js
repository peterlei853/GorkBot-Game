window.Beam = function (x, y, dirX, dirY, width, damage) {
  this.x = x;
  this.y = y;
  this.dirX = dirX;
  this.dirY = dirY;
  this.w = width;
  this.len = 1600;
  this.damage = damage;
  this.life = 0.18;
  this.maxLife = 0.18;
  this.alive = true;
  this.hit = {};
};

Beam.prototype.update = function (dt) {
  this.life -= dt;
  if (this.life <= 0) this.alive = false;
};

Beam.prototype.intersects = function (ax, ay, ar) {
  var x2 = this.x + this.dirX * this.len;
  var y2 = this.y + this.dirY * this.len;
  return Rules.distToSegment(ax, ay, this.x, this.y, x2, y2) <= ar + this.w / 2;
};

Beam.prototype.draw = function (ctx) {
  var alpha = Math.max(0, this.life / this.maxLife);
  ctx.save();
  ctx.translate(this.x, this.y);
  ctx.rotate(Math.atan2(this.dirY, this.dirX));
  ctx.globalAlpha = 0.35 + 0.55 * alpha;
  var grd = ctx.createLinearGradient(0, 0, 520, 0);
  grd.addColorStop(0, "rgba(255,246,168,0.15)");
  grd.addColorStop(0.15, "#fff6a8");
  grd.addColorStop(0.55, "#7ef0ff");
  grd.addColorStop(1, "rgba(126,240,255,0)");
  ctx.fillStyle = grd;
  ctx.fillRect(0, -this.w / 2, 520, this.w);
  ctx.restore();
};

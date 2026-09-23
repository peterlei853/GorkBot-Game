window.Asteroid = function (x, y, speedScale) {
  this.x = x;
  this.y = y;
  this.r = 14 + Math.random() * 12;
  var ang = Math.random() * Math.PI * 2;
  var spd = (40 + Math.random() * 50) * speedScale;
  this.vx = Math.cos(ang) * spd;
  this.vy = Math.sin(ang) * spd;
  this.rot = Math.random() * Math.PI * 2;
  this.spin = (Math.random() - 0.5) * 2;
  this.hp = Rules.ASTEROID_HP;
  this.alive = true;
  this.contacting = false;
  this.id = Asteroid._nextId++;
};

Asteroid._nextId = 1;

Asteroid.prototype.update = function (dt, bounds) {
  this.x += this.vx * dt;
  this.y += this.vy * dt;
  this.rot += this.spin * dt;
  if (this.x < -this.r) this.x = bounds.w + this.r;
  if (this.x > bounds.w + this.r) this.x = -this.r;
  if (this.y < -this.r) this.y = bounds.h + this.r;
  if (this.y > bounds.h + this.r) this.y = -this.r;
};

Asteroid.prototype.draw = function (ctx) {
  if (!this.alive) return;
  ctx.save();
  ctx.translate(this.x, this.y);
  ctx.rotate(this.rot);
  ctx.fillStyle = "#8a8f9a";
  ctx.strokeStyle = "#5c6170";
  ctx.lineWidth = 2;
  ctx.beginPath();
  var n = 7;
  for (var i = 0; i < n; i++) {
    var a = (i / n) * Math.PI * 2;
    var rr = this.r * (0.75 + ((i * 37) % 5) * 0.06);
    var px = Math.cos(a) * rr;
    var py = Math.sin(a) * rr;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
};

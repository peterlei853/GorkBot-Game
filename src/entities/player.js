window.Player = function (x, y) {
  this.x = x;
  this.y = y;
  this.r = Rules.PLAYER_R;
  this.speed = Rules.PLAYER_SPEED;
  this.vx = 0;
  this.vy = 0;
  this.facing = -Math.PI / 2;
  this.controllable = true;
  this.charge = 0;
};

Player.prototype.update = function (dt, axis, mouse, bounds) {
  if (!this.controllable) {
    var step = Rules.stepKnockback(this.vx, this.vy, dt);
    this.x += step.dx;
    this.y += step.dy;
    this.vx = step.vx;
    this.vy = step.vy;
    this.controllable = step.controllable;
    if (Math.hypot(this.vx, this.vy) > 1) this.facing = Math.atan2(this.vy, this.vx);
  } else {
    var vx = axis.x;
    var vy = axis.y;
    if (mouse && mouse.active) {
      var dx = mouse.x - this.x;
      var dy = mouse.y - this.y;
      var dist = Math.hypot(dx, dy);
      if (dist > 8) {
        vx = dx / dist;
        vy = dy / dist;
      } else {
        vx = 0;
        vy = 0;
      }
    }
    var len = Math.hypot(vx, vy);
    if (len > 1) {
      vx /= len;
      vy /= len;
    }
    this.vx = vx * this.speed;
    this.vy = vy * this.speed;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    if (len > 0.001) this.facing = Math.atan2(this.vy, this.vx);
  }
  this.x = Math.max(this.r, Math.min(bounds.w - this.r, this.x));
  this.y = Math.max(this.r, Math.min(bounds.h - this.r, this.y));
};

Player.prototype.draw = function (ctx) {
  ctx.save();
  ctx.translate(this.x, this.y);
  ctx.rotate(this.facing + Math.PI / 2);
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
  if (Math.hypot(this.vx, this.vy) >= Rules.CHARGE_SPEED) {
    ctx.fillStyle = "#ff9a3c";
    ctx.beginPath();
    ctx.moveTo(-5, 10);
    ctx.lineTo(0, 18 + Math.random() * 4);
    ctx.lineTo(5, 10);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  if (this.charge > 0) {
    var t = Math.min(1, this.charge / Rules.CHARGE_MAX);
    ctx.save();
    ctx.strokeStyle = "rgba(255,246,168," + (0.45 + 0.55 * t) + ")";
    ctx.lineWidth = 2 + 3 * t;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r + 8, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * t);
    ctx.stroke();
    ctx.restore();
  }
};

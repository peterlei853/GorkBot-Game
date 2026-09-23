window.Input = (function () {
  var keys = Object.create(null);
  var mouse = { active: false, x: 0, y: 0 };
  var joy = { held: false, id: null, x: 0, y: 0 };
  var canvas = null;
  var joyEl = null;
  var knobEl = null;

  function codeKey(e) {
    return e.code || e.key;
  }

  function enableTouchMode() {
    document.body.classList.add("touch-mode");
  }

  function onKeyDown(e) {
    keys[codeKey(e)] = true;
    if (
      e.code === "ArrowUp" ||
      e.code === "ArrowDown" ||
      e.code === "ArrowLeft" ||
      e.code === "ArrowRight" ||
      e.code === "Space"
    ) {
      e.preventDefault();
    }
  }

  function onKeyUp(e) {
    keys[codeKey(e)] = false;
  }

  function canvasPos(e) {
    var rect = canvas.getBoundingClientRect();
    var scaleX = canvas.width / rect.width;
    var scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  }

  function onMouseDown(e) {
    if (!canvas || e.target !== canvas || e.button !== 0) return;
    var p = canvasPos(e);
    mouse.active = true;
    mouse.x = p.x;
    mouse.y = p.y;
  }

  function onMouseMove(e) {
    if (!mouse.active || !canvas) return;
    var p = canvasPos(e);
    mouse.x = p.x;
    mouse.y = p.y;
  }

  function onMouseUp() {
    mouse.active = false;
  }

  function joyCenter() {
    var r = joyEl.getBoundingClientRect();
    return {
      x: r.left + r.width / 2,
      y: r.top + r.height / 2,
      maxR: r.width * 0.34
    };
  }

  function resetJoy() {
    joy.held = false;
    joy.id = null;
    joy.x = 0;
    joy.y = 0;
    if (knobEl) knobEl.style.transform = "translate(0px, 0px)";
  }

  function touchById(list, id) {
    if (!list) return null;
    for (var i = 0; i < list.length; i++) {
      if (list[i].identifier === id) return list[i];
    }
    return null;
  }

  function applyJoyTouch(touch) {
    var c = joyCenter();
    var res = Rules.stickAxis(touch.clientX - c.x, touch.clientY - c.y, c.maxR, Rules.JOY_DEADZONE);
    joy.x = res.x;
    joy.y = res.y;
    if (knobEl) knobEl.style.transform = "translate(" + res.knobX + "px," + res.knobY + "px)";
  }

  function onJoyStart(e) {
    if (!joyEl || joy.held) return;
    enableTouchMode();
    var t = e.changedTouches[0];
    joy.held = true;
    joy.id = t.identifier;
    applyJoyTouch(t);
    e.preventDefault();
  }

  function onJoyMove(e) {
    if (!joy.held) return;
    var t = touchById(e.touches, joy.id);
    if (!t) return;
    applyJoyTouch(t);
    e.preventDefault();
  }

  function onJoyEnd(e) {
    if (!joy.held) return;
    var still = touchById(e.touches, joy.id);
    if (still) return;
    resetJoy();
  }

  function onFirstTouch() {
    enableTouchMode();
  }

  function releaseAll() {
    keys = Object.create(null);
    mouse.active = false;
    resetJoy();
  }

  return {
    attach: function (c) {
      canvas = c;
      joyEl = document.getElementById("joystick");
      knobEl = document.querySelector("#joystick .joy-knob");
      window.addEventListener("keydown", onKeyDown);
      window.addEventListener("keyup", onKeyUp);
      window.addEventListener("blur", releaseAll);
      canvas.addEventListener("mousedown", onMouseDown);
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
      if (joyEl) {
        joyEl.addEventListener("touchstart", onJoyStart, { passive: false });
        joyEl.addEventListener("contextmenu", function (e) {
          e.preventDefault();
        });
      }
      window.addEventListener("touchmove", onJoyMove, { passive: false });
      window.addEventListener("touchend", onJoyEnd);
      window.addEventListener("touchcancel", onJoyEnd);
      window.addEventListener("touchstart", onFirstTouch, { passive: true });
      var coarse = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
      if (coarse || navigator.maxTouchPoints > 0) enableTouchMode();
    },
    moveAxis: function () {
      var x = 0;
      var y = 0;
      if (keys.ArrowLeft || keys.KeyA) x -= 1;
      if (keys.ArrowRight || keys.KeyD) x += 1;
      if (keys.ArrowUp || keys.KeyW) y -= 1;
      if (keys.ArrowDown || keys.KeyS) y += 1;
      x += joy.x;
      y += joy.y;
      var len = Math.hypot(x, y);
      if (len > 1) {
        x /= len;
        y /= len;
      }
      return { x: x, y: y };
    },
    joystickHeld: function () {
      return joy.held;
    },
    getMouse: function () {
      return mouse;
    }
  };
})();

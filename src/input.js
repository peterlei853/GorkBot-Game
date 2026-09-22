window.Input = (function () {
  var keys = Object.create(null);
  var pointer = { active: false, x: 0, y: 0 };
  var canvas = null;

  function codeKey(e) {
    return e.code || e.key;
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
    var clientX = e.clientX;
    var clientY = e.clientY;
    if (e.touches && e.touches.length) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if (e.changedTouches && e.changedTouches.length) {
      clientX = e.changedTouches[0].clientX;
      clientY = e.changedTouches[0].clientY;
    }
    var scaleX = canvas.width / rect.width;
    var scaleY = canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  }

  function onPointerDown(e) {
    if (!canvas) return;
    if (e.target !== canvas) return;
    e.preventDefault();
    var p = canvasPos(e);
    pointer.active = true;
    pointer.x = p.x;
    pointer.y = p.y;
  }
  function onPointerMove(e) {
    if (!pointer.active || !canvas) return;
    e.preventDefault();
    var p = canvasPos(e);
    pointer.x = p.x;
    pointer.y = p.y;
  }
  function onPointerUp(e) {
    pointer.active = false;
  }

  return {
    attach: function (c) {
      canvas = c;
      window.addEventListener("keydown", onKeyDown);
      window.addEventListener("keyup", onKeyUp);
      canvas.addEventListener("mousedown", onPointerDown);
      window.addEventListener("mousemove", onPointerMove);
      window.addEventListener("mouseup", onPointerUp);
      canvas.addEventListener("touchstart", onPointerDown, { passive: false });
      canvas.addEventListener("touchmove", onPointerMove, { passive: false });
      window.addEventListener("touchend", onPointerUp);
    },
    isDown: function (code) {
      return !!keys[code];
    },
    moveAxis: function () {
      var x = 0;
      var y = 0;
      if (keys.ArrowLeft || keys.KeyA) x -= 1;
      if (keys.ArrowRight || keys.KeyD) x += 1;
      if (keys.ArrowUp || keys.KeyW) y -= 1;
      if (keys.ArrowDown || keys.KeyS) y += 1;
      return { x: x, y: y };
    },
    getPointer: function () {
      return pointer;
    },
    consumePauseTap: function () {
      // handled via UI buttons / keys in Game
    }
  };
})();

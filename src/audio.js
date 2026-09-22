/* Lightweight procedural BGM via Web Audio — no external files needed */
window.GameAudio = (function () {
  var ctx = null;
  var master = null;
  var muted = false;
  var playing = false;
  var intervalId = null;
  var step = 0;

  // Cheerful major-ish arpeggio (C major-ish pattern)
  var NOTES = [261.63, 329.63, 392.0, 523.25, 392.0, 329.63, 293.66, 349.23];

  function ensure() {
    if (ctx) return;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.22;
    master.connect(ctx.destination);
  }

  function beep(freq, dur, type) {
    if (!ctx || muted) return;
    var o = ctx.createOscillator();
    var g = ctx.createGain();
    o.type = type || "triangle";
    o.frequency.value = freq;
    g.gain.value = 0.0001;
    o.connect(g);
    g.connect(master);
    var t = ctx.currentTime;
    g.gain.exponentialRampToValueAtTime(0.55, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  function tick() {
    if (!playing || muted || !ctx) return;
    beep(NOTES[step % NOTES.length], 0.18, "triangle");
    if (step % 4 === 0) beep(130.81, 0.12, "sine");
    step++;
  }

  return {
    unlock: function () {
      ensure();
      if (ctx && ctx.state === "suspended") ctx.resume();
    },
    startBgm: function () {
      ensure();
      this.unlock();
      if (!ctx || playing) return;
      playing = true;
      step = 0;
      intervalId = setInterval(tick, 280);
    },
    stopBgm: function () {
      playing = false;
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    },
    setMuted: function (m) {
      muted = !!m;
      if (master) master.gain.value = muted ? 0 : 0.22;
    },
    isMuted: function () {
      return muted;
    },
    toggleMute: function () {
      this.setMuted(!muted);
      return muted;
    },
    sfxPickup: function () {
      ensure();
      this.unlock();
      beep(880, 0.1, "sine");
    },
    sfxHit: function () {
      ensure();
      this.unlock();
      beep(120, 0.25, "sawtooth");
    }
  };
})();

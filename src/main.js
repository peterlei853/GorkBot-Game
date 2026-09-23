(function () {
  var canvas = document.getElementById("game");
  var game = new Game(canvas);
  window.game = game;
  game.start();
})();

import { Client } from "https://cdn.skypack.dev/colyseus.js";
import { AvatarGenerator } from "https://cdn.skypack.dev/random-avatar-generator";

new Client(
  `${location.protocol.replace(
    "http",
    "ws"
  )}//${window.document.location.host.replace(/:.*/, "")}${
    location.port ? ":" + location.port : ""
  }`
)
  .joinOrCreate("main")
  .then((room) => {
    const generator = new AvatarGenerator();
    const players = {};

    room.state.players.onAdd = (player, sessionId) => {
      const dom = document.createElement("div");
      dom.className = "player";
      dom.title = `Player ${sessionId}`;
      dom.style.left = player.x + "px";
      dom.style.top = player.y + "px";
      dom.style.backgroundImage = `url("${generator.generateRandomAvatar(
        sessionId
      )}")`;

      player.onChange = (changes) => {
        dom.style.left = player.x + "px";
        dom.style.top = player.y + "px";
      };

      players[sessionId] = dom;
      document.body.appendChild(dom);
    };

    room.state.players.onRemove = (player, sessionId) => {
      document.body.removeChild(players[sessionId]);
      delete players[sessionId];
    };

    room.onMessage("greetings", (message) => {
      console.log(message);
    });

    const moveUp = () => room.send("move", { y: -1 });
    const moveRight = () => room.send("move", { x: 1 });
    const moveDown = () => room.send("move", { y: 1 });
    const moveLeft = () => room.send("move", { x: -1 });

    document.getElementById("upButton").addEventListener("click", moveUp);
    document.getElementById("downButton").addEventListener("click", moveDown);
    document.getElementById("leftButton").addEventListener("click", moveLeft);
    document.getElementById("rightButton").addEventListener("click", moveRight);

    const keyCodeToActionMap = {
      37: moveLeft,
      38: moveUp,
      39: moveRight,
      40: moveDown,
    };

    window.addEventListener("keydown", (e) => {
      if (keyCodeToActionMap[e.which]) {
        keyCodeToActionMap[e.which]();
      }
    });
  });

import { Client } from "https://cdn.skypack.dev/colyseus.js";
import { AvatarGenerator } from "https://cdn.skypack.dev/random-avatar-generator";
import NippleJS from "https://cdn.skypack.dev/nipplejs";
import anime from "https://cdn.skypack.dev/animejs";

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
      const playerHtmlElement = document.createElement("div");
      playerHtmlElement.className = "player";
      playerHtmlElement.title = `Player ${sessionId}`;
      playerHtmlElement.style.backgroundImage = `url("${generator.generateRandomAvatar(
        sessionId
      )}")`;

      player.onChange = () =>
        anime({
          targets: playerHtmlElement,
          left: player.x,
          top: player.y,
          easing: "easeOutQuart",
        });

      players[sessionId] = playerHtmlElement;
      document.body.appendChild(playerHtmlElement);
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

    const dataTypeToActionMap = {
      "dir:left": moveLeft,
      "dir:up": moveUp,
      "dir:right": moveRight,
      "dir:down": moveDown,
    };

    let lastJoystickDataType = null;

    setInterval(() => {
      dataTypeToActionMap[lastJoystickDataType]?.();
    }, 100);

    NippleJS.create({
      zone: document.body,
      color: "#a3d5ff",
    })
      .on("dir:up dir:down dir:right dir:left", (data) => {
        lastJoystickDataType = data.type;
      })
      .on("end", () => {
        lastJoystickDataType = null;
      });

    const keyCodeToActionMap = {
      ArrowLeft: moveLeft,
      ArrowUp: moveUp,
      ArrowRight: moveRight,
      ArrowDown: moveDown,
    };

    window.addEventListener("keydown", (e) => {
      keyCodeToActionMap[e.code]?.();
    });
  });

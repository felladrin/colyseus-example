import { Client } from "https://cdn.skypack.dev/colyseus.js";
import { AvatarGenerator } from "https://cdn.skypack.dev/random-avatar-generator";
import NippleJS from "https://cdn.skypack.dev/nipplejs";

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

      player.onChange = () => {
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

import { Server, Room, Client } from "@colyseus/core";
import { Schema, MapSchema, type } from "@colyseus/schema";
import { uWebSocketsTransport } from "@colyseus/uwebsockets-transport";
import { resolve } from "path";
import { serveDir } from "uwebsocket-serve";

class PlayerState extends Schema {
  @type("number")
  public x = Math.floor(Math.random() * 200);

  @type("number")
  public y = Math.floor(Math.random() * 200);
}

class MainRoomState extends Schema {
  @type({ map: PlayerState })
  public players = new MapSchema<PlayerState>();

  public createPlayer(sessionId: string) {
    this.players.set(sessionId, new PlayerState());
  }

  public removePlayer(sessionId: string) {
    this.players.delete(sessionId);
  }

  public movePlayer(sessionId: string, movement: any) {
    const player = this.players.get(sessionId);

    if (!player) return;

    if (movement.x) {
      player.x += movement.x * 25;
    }

    if (movement.y) {
      player.y += movement.y * 25;
    }
  }
}

class MainRoom extends Room<MainRoomState> {
  public maxClients = 8;

  public onCreate(options: Record<string, any>) {
    console.log(
      `${MainRoom.name} created with the following options:`,
      options
    );

    this.setState(new MainRoomState());

    this.onMessage("move", (client, data) => {
      console.log(
        `${MainRoom.name} received message from ${client.sessionId}:`,
        data
      );
      this.state.movePlayer(client.sessionId, data);
    });
  }

  public onJoin(client: Client) {
    client.send("greetings", `Hello, ${client.sessionId}!`);
    this.state.createPlayer(client.sessionId);
  }

  public onLeave(client: Client) {
    this.state.removePlayer(client.sessionId);
  }
}

const transport = new uWebSocketsTransport();

transport.app.get("/*", serveDir(resolve(__dirname, "../client")));

const gameServer = new Server({ transport });

gameServer.define("main", MainRoom);

const port = Number(process.env.PORT) || 2567;

console.log(`App available at http://localhost:${port}`);

gameServer.listen(port);

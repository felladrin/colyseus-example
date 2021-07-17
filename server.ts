import { Server, Room, Client } from "@colyseus/core";
import { Schema, MapSchema, type } from "@colyseus/schema";
import { uWebSocketsTransport } from "@colyseus/uwebsockets-transport";
import { join } from "path";
import { readFileSync } from "fs";

class PlayerState extends Schema {
  @type("number")
  public x = Math.floor(Math.random() * 400);

  @type("number")
  public y = Math.floor(Math.random() * 400);
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
      player.x += movement.x * 10;
    }

    if (movement.y) {
      player.y += movement.y * 10;
    }
  }
}

class MainRoom extends Room<MainRoomState> {
  public maxClients = 4;

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

const htmlDocument = readFileSync(join(__dirname, "client.html"));

const transport = new uWebSocketsTransport();

transport.app.get("/*", (res: any) => {
  res.writeStatus("200 OK").end(htmlDocument);
});

const gameServer = new Server({ transport });

gameServer.define("game", MainRoom);

gameServer.listen(Number(process.env.port) || 2567);

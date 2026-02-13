const express = require("express");
const WebSocket = require("ws");
const { randomUUID } = require("crypto");

const app = express();
app.use(express.static("public"));

const server = app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});

const wss = new WebSocket.Server({ server });

let users = new Map(); // id → { name, ws }

function broadcastUsers() {
  const list = Array.from(users.values()).map(u => u.name);
  const msg = JSON.stringify({ users: list });

  users.forEach(u => {
    if (u.ws.readyState === WebSocket.OPEN) {
      u.ws.send(msg);
    }
  });
}

wss.on("connection", ws => {
  const id = randomUUID();

  ws.on("message", data => {
    let msg;
    try {
      msg = JSON.parse(data.toString());
    } catch {
      return;
    }

    if (msg.join) {
      users.set(id, { name: msg.join, ws });
      broadcastUsers();
    }

    // пересылаем сигналы WebRTC
    if (msg.offer || msg.answer || msg.ice) {
      users.forEach(u => {
        if (u.ws !== ws && u.ws.readyState === WebSocket.OPEN) {
          u.ws.send(JSON.stringify(msg));
        }
      });
    }
  });

  ws.on("close", () => {
    users.delete(id);
    broadcastUsers();
  });
});

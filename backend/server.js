import express from "express";
import cors from "cors";
import http from "node:http";
import { WebSocketServer } from "ws";
import dotenv from "dotenv";
import path from "node:path";
import apiRouter from "./routes/api.js";
import { runCommandStreaming } from "./services/terminal.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "20mb" }));
app.use("/api", apiRouter);

const server = http.createServer(app);

// ---------- Terminal over WebSocket ----------
const wss = new WebSocketServer({ server, path: "/ws/terminal" });

wss.on("connection", (ws) => {
  ws.on("message", (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }
    if (msg.type === "run") {
      const cwd = msg.cwd || process.cwd();
      runCommandStreaming(msg.command, cwd, ws);
    }
  });
});

const PORT = process.env.PORT || 5175;
server.listen(PORT, () => {
  console.log(`AI Code Studio backend running on http://localhost:${PORT}`);
});

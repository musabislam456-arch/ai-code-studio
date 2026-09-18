import express from "express";
import cors from "cors";
import http from "node:http";
import { WebSocketServer } from "ws";
import dotenv from "dotenv";
import path from "node:path";
import apiRouter from "./routes/api.js";
import { runCommandStreaming } from "./services/terminal.js";
import { requireAuth, checkWsToken } from "./middleware/auth.js";
dotenv.config();
const app=express();
const allowedOrigin=process.env.ALLOWED_ORIGIN;
app.use(cors(allowedOrigin?{origin:allowedOrigin}:{}));
app.use(express.json({limit:"20mb"}));
app.use("/api",requireAuth,apiRouter);
const server=http.createServer(app);
const wss=new WebSocketServer({server,path:"/ws/terminal"});
wss.on("connection",(ws,req)=>{
  if(!checkWsToken(req.url)){ws.send(JSON.stringify({type:"stderr",data:"Unauthorized
"}));ws.close();return;}
  ws.on("message",raw=>{
    let msg; try{msg=JSON.parse(raw.toString())}catch{return;}
    if(msg.type==="run"){
      const root=path.join(process.env.WORKSPACES_ROOT||path.join(process.cwd(),"workspaces"),String(msg.cwd||"my-project").replace(/[^a-zA-Z0-9-_]/g,""));
      runCommandStreaming(msg.command,root,{send:(type,data)=>{if(ws.readyState===ws.OPEN)ws.send(JSON.stringify({type,data}))}});
    }
  });
});
const PORT=process.env.PORT||5175;
server.listen(PORT,()=>console.log(`AI Code Studio backend running on http://localhost:${PORT}`));

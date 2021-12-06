import express from "express";
import SocketIO from "socket.io";
import http from "http";
import globalRouter from "./routers/globalRouter";

const app = express();

app.set("view engine", "pug");

app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));

app.use("/", globalRouter);

const httpServer = http.createServer(app);
const ws = SocketIO(httpServer);

ws.on("connection", (socket) => {
  socket.on("join", (roomId) => {
    socket.join(roomId);
    socket.to(roomId).emit("start");
  });

  socket.on("offer", (offer, roomId) => {
    socket.to(roomId).emit("offer", offer);
  });

  socket.on("answer", (answer, roomId) => {
    socket.to(roomId).emit("answer", answer);
  });

  socket.on("icecandidate", (candidate, roomId) => {
    socket.to(roomId).emit("candidate", candidate);
  });

  socket.on("disconnect", () => {});
});

httpServer.listen(3000, () => console.log(`Listening on Port 3000`));

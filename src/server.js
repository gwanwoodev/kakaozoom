import express from "express";
import io from "socket.io";
import http from "http";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));

app.get("/", (_req, res) => {
  res.render("index");
});

const httpServer = http.createServer(app);

httpServer.listen(3000, () => console.log(`Listening on Port 3000`));

import express from "express";
import path from "path";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
const app = express();
import authRoutes from "./routes/auth";
import chatRoutes from "./routes/chat";
import { publishMessage, redis } from "./lib/redis";

require("dotenv").config();

const socketIO = require("socket.io");
const server = express()
  .use(app)
  .listen(3000, () => console.log(`Listening Socket on ${3000}`));

const io = socketIO(server);

app.use(express.static(__dirname + "/ui/public"));

//body parser
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: false
  })
);
app.use(cookieParser());

//routers
app.use("/auth", authRoutes);
app.use("/chat", chatRoutes);

app.get("/", (req, res) => {
  res.send("Chat App");
});
app.get("/chat", (req, res) => {
  res.sendFile(path.resolve(__dirname, "ui/views/chat.html"));
});

app.post("/chat/sendMessage", (req, res) => {
  var { message, username } = req.body;
  publishMessage(JSON.stringify({ message, username }));
  res.send({ result: true, message: "sent" });
});

redis.on("message", (channel, message) => {
  io.emit("message", JSON.parse(message));
});
io.on("connection", function(socket) {
  console.log("client connected");
  socket.on("message", function(data) {
    io.emit("send", data);
  });
});

// app.listen(process.env.PORT || 3000, function() {
//   console.log("Server started");
// });
module.exports = app;

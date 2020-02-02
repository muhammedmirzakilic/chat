import express from "express";
import path from "path";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
const app = express();
import authRoutes from "./routes/auth";
import chatRoutes from "./routes/chat";
import { publishMessage, redis, chatRoomPrefix, redisStore } from "./lib/redis";
var session = require("express-session");
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

//session
app.use(
  session({
    redisStore,
    secret: "som3-Seri0us*Key",
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: process.env.SESSION_TIME_OUT,
      secure: process.env.ENVIRONMENT == "production"
    }
  })
);

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

var channels = [
  {
    name: "News",
    value: "news"
  },
  {
    name: "Sport",
    value: "sport"
  },
  {
    name: "Cinema",
    value: "cinema"
  },
  {
    name: "Random Things",
    value: "randomThings"
  }
];

const handleMessage = (_, channel, message) => {
  console.log(channel);
  channel = channel.replace(chatRoomPrefix, "");
  console.log(channel);
  var data = { channel, ...JSON.parse(message) };
  io.to(channel).emit("message", data);
  console.log("handleMessage ==> ", channel, message);
};

redis.on("pmessage", handleMessage);

io.on("connection", function(socket) {
  socket.emit("channels", channels);
  const handleMessage = (channel, message) => {
    var data = { channel, ...JSON.parse(message) };
    socket.to(channel).broadcast.emit("message", data);
    //socket.to(channel).emit("message", JSON.parse(message));
    console.log("handleMessage ==> ", channel, message);
    //socket.emit("message", JSON.parse(message));
  };

  socket.on("joinChannel", channel => {
    socket.join(channel);
    socket.emit("jointChannel", channel);
    //redis.on("message", handleMessage);
  });

  socket.on("send", (username, channel, message) => {
    console.log(username, channel, message);
    publishMessage(channel, JSON.stringify({ message, username }));
  });

  socket.on("disconnected", function(data) {
    redis.off("message", handleMessage);
  });
});

// app.listen(process.env.PORT || 3000, function() {
//   console.log("Server started");
// });
module.exports = app;

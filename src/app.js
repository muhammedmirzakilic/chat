import express from "express";
import path from "path";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
const app = express();
import authRoutes from "./routes/auth";
import chatRoutes from "./routes/chat";
import {
  publishMessage,
  redis,
  chatRoomPrefix,
  redisStore,
  getSession,
  getOldMessages
} from "./lib/redis";
var session = require("express-session");
require("dotenv").config();
import "./utils/bannedWords";
import { filterText } from "./utils/bannedWords";
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

app.get("/", isAuthRequired, (req, res) => {
  res.redirect("/chat");
});

app.get("/chat", isAuthRequired, (req, res) => {
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
  },
  {
    name: "Culture",
    value: "culture"
  },
  {
    name: "Soccer",
    value: "soccer"
  },
  {
    name: "Travel",
    value: "travel"
  },
  {
    name: "Science",
    value: "science"
  },
  {
    name: "Series",
    value: "series"
  },
  {
    name: "World",
    value: "world"
  },
  {
    name: "Space",
    value: "space"
  },
  {
    name: "Basketball",
    value: "basketball"
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
var users = [];
io.use(async (socket, next) => {
  if (socket.handshake.query && socket.handshake.query.token) {
    let { token, username } = socket.handshake.query;
    if (!isSessionValid(token, username)) {
      next(new Error("Authentication error"));
    } else {
      next();
    }
  } else {
    next(new Error("Authentication error"));
  }
}).on("connection", async function(socket) {
  console.log(`Socket connected: ${socket.id}`);
  let { username } = socket.handshake.query;
  if (!users[username]) {
    users[username] = {
      jointChannels: [],
      sockets: []
    };
  }
  socket.join(username);
  users[username].sockets.push(socket.id);
  socket.on("connected", function(data) {});
  socket.emit("channels", channels);

  socket.on("joinChannel", async channel => {
    for (var index = 0; index < users[username].sockets.length; index++) {
      let userSocket = users[username].sockets[index];
      io.sockets.connected[userSocket].join(channel);
    }
    io.to(username).emit("jointChannel", channel);
    var oldMessages = await getOldMessages(channel);
    if (oldMessages.length > 0) {
      var messages = oldMessages.map(oldMessage => JSON.parse(oldMessage));
      io.to(username).emit("oldMessages", { channel, messages });
    }
    users[username].jointChannels.push(channel);
  });

  socket.on("send", (username, channel, message) => {
    console.log(username, channel, message);
    message = filterText(message);
    publishMessage(channel, JSON.stringify({ message, username }));
  });

  socket.on("disconnect", function(data) {
    console.log(`Socket disconnected: ${socket.id}`);
    console.log(username);
    //debugger;
    users[username].sockets = users[username].sockets.filter(
      s => s != socket.id
    );
  });
  console.log("jointChannels ==>", users[username].jointChannels.length);
  for (let index = 0; index < users[username].jointChannels.length; index++) {
    const jointChannel = users[username].jointChannels[index];
    console.log("jointChannel ==> ", jointChannel);
    socket.emit("jointChannel", jointChannel);
    var oldMessages = await getOldMessages(jointChannel);
    if (oldMessages.length > 0) {
      var messages = oldMessages.map(oldMessage => JSON.parse(oldMessage));
      io.to(username).emit("oldMessages", { jointChannel, messages });
    }
  }
});

async function isAuthRequired(req, res, next) {
  let { username, sessionToken } = req.session;
  console.log(username, sessionToken);
  var isValid = await isSessionValid(sessionToken, username);
  if (!isValid) {
    return res.redirect("/auth/login");
  } else next();
}

async function isSessionValid(token, username) {
  if (!token || !username) return false;
  var redisSessionUsername = await getSession(token);
  if (!redisSessionUsername || username !== redisSessionUsername) return false;
  return true;
}

// app.listen(process.env.PORT || 3000, function() {
//   console.log("Server started");
// });
module.exports = app;

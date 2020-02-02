import express from "express";
var router = express.Router();
import path from "path";
import { redis, setUser, getUser, setSession, getSession } from "../lib/redis";
const uuidv1 = require("uuid/v1");

router.get("/login", isAllreadyLogged, (req, res) => {
  res.sendFile(path.resolve(__dirname, "../ui/views/login.html"));
});

router.post("/login", async (req, res) => {
  let { username, password } = req.body;
  console.log(username);
  var user = await getUser(username);
  console.log(user);
  if (!user || !user.password || user.password != password) {
    return res.send({
      success: false,
      message: "Invalid username and/or password!"
    });
  }
  var token = generateSessionToken();
  await setSession({ token, username });
  req.session.username = username;
  req.session.sessionToken = token;
  res.send({ success: true, token });
});

router.get("/register", isAllreadyLogged, (req, res) => {
  res.sendFile(path.resolve(__dirname, "../ui/views/register.html"));
});

router.post("/register", async (req, res) => {
  let { name, username, password } = req.body;
  var user = await getUser(username);
  if (user && user.name) {
    return res.send({ success: false, message: "Username already exist!" });
  }
  var result = await setUser({ name, username, password });
  console.log(result);
  res.send({ success: true });
});

async function isAllreadyLogged(req, res, next) {
  let { username, sessionToken } = req.session;
  if (isSessionValid(sessionToken, username)) return res.redirect("/chat");
  next();
}
async function isSessionValid(token, username) {
  if (!token || !username) return false;
  var redisSessionUsername = await getSession(token);
  if (!redisSessionUsername || username != redisSessionUsername) return false;
  return true;
}
function generateSessionToken() {
  return uuidv1();
}

export default router;

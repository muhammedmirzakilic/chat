var Redis = require("ioredis");
var session = require("express-session");
const RedisStore = require("connect-redis")(session);

const port = process.env.REDIS_PORT || 6379;
const host = process.env.REDIS_HOST || "127.0.0.1";
var redis = new Redis(port, host);
var pub = new Redis(port, host);
const store = new RedisStore({ client: pub });

var chatRoomPrefix = "chatRoom-";

redis.psubscribe(chatRoomPrefix + "*", function(err, count) {});

redis.on("message", function(channel, message) {
  console.log("Receive message %s from channel %s", message, channel);
});

exports.publishMessage = (channel, message) =>
  pub.publish(chatRoomPrefix + channel, message);

exports.setUser = async ({ name, username, password }, callback) =>
  await pub.hmset(username, { name, password });
exports.getUser = async username => await pub.hgetall(username);
exports.setSession = async ({ token, username }) =>
  await pub.set(
    token,
    username,
    "PX",
    process.env.SESSION_TIME_OUT || 1000 * 60 * 60 * 2
  );
exports.getSession = async token => await pub.get(token);
exports.chatRoomPrefix = chatRoomPrefix;
exports.redis = redis;
exports.redisStore = store;

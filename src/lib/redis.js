var Redis = require("ioredis");
const port = process.env.REDIS_PORT || 6379;
const host = process.env.REDIS_HOST || "127.0.0.1";
var redis = new Redis(port, host);
var pub = new Redis(port, host);
var chatRoomPrefix = "chatRoom-";

redis.psubscribe(chatRoomPrefix + "*", function(err, count) {});

redis.on("message", function(channel, message) {
  console.log("Receive message %s from channel %s", message, channel);
});

exports.publishMessage = (channel, message) =>
  pub.publish(chatRoomPrefix + channel, message);
exports.chatRoomPrefix = chatRoomPrefix;
exports.redis = redis;

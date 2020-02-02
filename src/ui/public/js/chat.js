var username = getUsername();
var sessionToken = getSessionToken();
var socket = io({
  query: { token: sessionToken, username: username }
});
var allChannels = [];
var jointChannels = [];
var channelMessages = [];
var activeChannel = "";
socket.on("message", ({ username, message, channel }) => {
  handleMessage(username, message, channel);
});

socket.on("oldMessages", ({ channel, messages }) => {
  messages.forEach(item => {
    handleMessage(item.username, item.message, channel);
  });
});

function handleMessage(username, message, channel) {
  let element = getMessageItem(username, message);
  if (!channelMessages[channel]) channelMessages[channel] = [];
  channelMessages[channel].push({ username, message });
  if (activeChannel == channel) $(".chat-container").append(element);
}

socket.on("jointChannel", jointChannel => {
  var channel = allChannels.find(item => item.value == jointChannel);
  var element = `<span class="joint-channel" 
    data-value="${channel.value}">${channel.name}</span>`;
  if (jointChannels.length == 0) {
    activeChannel = channel.value;
    element = $(element).addClass("active");
  }
  $("#joint-channels").append(element);
  jointChannels.push(channel);
  activeChannelClickListener();
});

socket.on("channels", function(channels) {
  $("#channels-to-join").html("");
  allChannels = channels;
  channels.forEach(channel => {
    var element = `
    <div class="channel-to-join">
      <span>${channel.name}</span> 
      <button class="btn btn-primary join-channel-btn" 
        data-value="${channel.value}">Join</button>
    </div>`;
    $("#channels-to-join").append(element);
  });
  $(".join-channel-btn").off("click", joinChannelHandler);
  $(".join-channel-btn").on("click", joinChannelHandler);
  function joinChannelHandler(e) {
    var channel = $(this).data("value");
    console.log(channel);
    socket.emit("joinChannel", channel);
  }
});

function getMessageItem(username, message) {
  return `
    <div class="message row">
        <div class="username">${username}:</div>
        <div class="message">${message}</div>
    </div>
  `;
}

function activeChannelClickListener() {
  $(".joint-channel").off("click", jointChannelClickHandler);
  $(".joint-channel").on("click", jointChannelClickHandler);
}
function jointChannelClickHandler(e) {
  $(".joint-channel").removeClass("active");
  $(this).addClass("active");
  activeChannel = $(this).data("value");
  let chatContainer = $(".chat-container");
  chatContainer.html("");
  let activeChannelMessages = channelMessages[activeChannel];
  if (activeChannelMessages) {
    activeChannelMessages.forEach(item => {
      var element = getMessageItem(item.username, item.message);
      chatContainer.append(element);
    });
  }
}

function sendMessage() {
  if (!activeChannel) return alert("Join a channel first");
  var message = $("#message").val();
  if (!message) return alert("Write a message");
  socket.emit("send", username, activeChannel, message);
  $("#message").val("");
}

function getUsername() {
  return Cookies.get("username");
}
function getSessionToken() {
  return Cookies.get("sessionToken");
}

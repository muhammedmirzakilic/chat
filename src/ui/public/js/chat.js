var socket = io();
var username = getRandomUsername();
socket.on("message", function(data) {
  console.log(data);
  var username = data.username;
  var message = data.message;
  var element = `
    <div class="message row">
        <div class="username">${username}:</div>
        <div class="message">${message}</div>
    </div>
  `;
  $(".chat-container").append(element);
});

function sendMessage() {
  var message = $("#message").val();
  var request = {
    username,
    message
  };
  $.ajax({
    url: "/chat/sendMessage",
    type: "POST",
    data: JSON.stringify(request),
    dataType: "json",
    contentType: "application/json",
    success: function(data, status, xhr) {
      if (data && data.result) console.log("message sent");
    },
    error: function(err) {
      console.log("error");
    }
  });
}

function getRandomUsername() {
  var userId = Math.floor(Math.random() * 100);
  return `user${userId}`;
}

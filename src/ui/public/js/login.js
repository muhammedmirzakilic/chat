function login() {
  var username = $("#username").val();
  var password = $("#password").val();
  var request = {
    username: username,
    password: password
  };
  $.ajax({
    url: "login",
    type: "POST",
    data: JSON.stringify(request),
    dataType: "json",
    contentType: "application/json",
    success: function(data) {
      if (data && data.success) {
        Cookies.set("username", username);
        Cookies.set("sessionToken", data.token);
        window.location.href = "/chat";
      } else {
        alert(data.message);
      }
    },
    error: function(xhr) {
      alert("An error occured!");
    }
  });
}

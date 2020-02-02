function register() {
  var name = $("#name").val();
  var username = $("#username").val();
  var password = $("#password").val();
  var request = {
    username: username,
    password: password,
    name: name
  };
  $.ajax({
    url: "register",
    type: "POST",
    data: JSON.stringify(request),
    dataType: "json",
    contentType: "application/json",
    success: function(data) {
      if (data && data.success) {
        window.location.href = "/auth/login";
      } else {
        alert(data.message);
      }
    },
    error: function(xhr) {
      alert("An error occured!");
    }
  });
}

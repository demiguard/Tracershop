let try_login = function() {
  $('#error-message-container').empty();
  
  let username = $('#id_username').val();
  let password = $('#id_password').val();

  $.post({
    url: '/api/login',
    data: {
      'username' : username,
      'password' : password,
    },
    success: function(data) {
      console.log(data);
      if(data.success) {
        window.location.href = "/"
      }
    },
    error: function() {
      error_message = document.createElement('p');
      error_message.classList.add('alert');
      error_message.classList.add('alert-danger');
      error_message.innerText = "Forkert login";

      $('#error-message-container').append(error_message);
    }
  });
}

let enter_login = function(event){
  let Enter = 13; // Key value for Enter key
  if (event.which == Enter) {
    try_login();
  }
}
//After loading
$(function() {
  $('#login-btn').click(try_login);
  $('#id_username').keypress(enter_login);
  $('#id_password').keypress(enter_login);
});

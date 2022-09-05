import { destroyActiveDialog } from "./libs/htmlHelpers.js";

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
      const error_message = document.createElement('p');
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

function ResetPassword() {
  destroyActiveDialog();
  const ResetPasswordDialog = $("<div>", {
    class: "container"
  })

  const HelperText = $("<p>")
  const UserNameInput = $("<input>", {
    type:"text",
    placeholder:"Brugernavn",
    id:"ResetPasswordOfUser"
  });
  const SpamFilterText = $("<p>")
  const ErrorDiv = $("<div>",{
    id:"ErrorDiv"
  })

  HelperText.text("Skriv dit bruger navn in her, så sender vi dig en mail til at genskabe dit kodeord")
  SpamFilterText.text("Husk at tjekke dit spam filter for password reset mailen")

  ResetPasswordDialog.append(HelperText);
  ResetPasswordDialog.append(UserNameInput);
  ResetPasswordDialog.append(SpamFilterText);
  ResetPasswordDialog.append(ErrorDiv);


  $(ResetPasswordDialog).dialog({
    classes: {
      "ui-dialog": "modal-content",
      "ui-dialog-titlebar": "modal-header",
      "ui-dialog-title": "modal-title",
      "ui-dialog-titlebar-close": "close",
      "ui-dialog-content": "modal-body",
      "ui-dialog-buttonpane": "modal-footer"
    },
    id: "ResetPasswordDialog",
    title: "Genskab Password",
    width: 500,
    buttons : [
      {
        text: "Send mail",
        click: function() {
          $.ajax({
            type:    "post",
            url:     "/api/CreateNewPasswordResetRequest",
            datatype:"json",
            data:    JSON.stringify({ username:$("#ResetPasswordOfUser").val()}),
            success: function (data) {
              if (data['Success'] == "Success") {
                destroyActiveDialog();
              } else if (data['Success'] == "User does not exists") {
                ErrorDiv.text("Brugeren ved dette navn findes ikke");
                ErrorDiv.addClass("ErrorBox");
              }
            },
            error: function(data){
              ErrorDiv.text("Der er sket en uventet fejl. Kontakt support");
              ErrorDiv.addClass("ErrorBox")
            }
          })
        }
      }, {
        text:"Afbryd",
        click: function() {
          destroyActiveDialog();
        }
      }
    ]
  })
}

//After loading
$(function() {
  $('#login-btn').click(try_login);
  $('#id_username').keypress(enter_login);
  $('#id_password').keypress(enter_login);
  $('#ResetPassword').click(ResetPassword);
});


let SendpasswordChange = function(UserID) {
  const passwordInput = $("#password");
  const passwordConfirm = $("#passwordConfirm");

  if (passwordInput.val() !== passwordConfirm.val()){
    //Error message
    $("#ErrorMessagesPW").text("Koderne er ikke ens")
    return -1
  }
$.ajax({
  url:"api/admin/updatepw",
  type:"get",
  data:{
    "userID":UserID,
    newPassword: passwordInput.val()
  }

})



  return 0
}

let ChangePasswordUser = function(buttonID) {
  $(".ui-dialog-content").dialog("close")
  const UserID = buttonID.substr(11);
  const UserDiv = $('#'+UserID);
  const UserName = UserDiv.children(".Username").text();
  const dialog = document.createElement('div');
  const dialogText = $("<p>");
  dialogText.text("Skift Kode for bruger: " + UserName);
  dialogText.appendTo(dialog);
  const dialogpwP = $("<p>");
  dialogpwP.text("Kodeord: ")
  const dialogpwcP = $("<p>");
  dialogpwcP.text("Gentag:  ")
  const PasswordInput = $("<input>", {
    id:"password",
    type: "password", 
    minlength:8
  })
  PasswordInput.appendTo(dialogpwP)
  const ConfirmPasswordInput = $("<input>", {
    id:"passwordConfirm",
    type: "password", 
    minlength:8
  })
  ConfirmPasswordInput.appendTo(dialogpwcP);
  dialogpwP.appendTo(dialog);
  dialogpwcP.appendTo(dialog);
  const ErrorMessageDiv = $("<div>", {
     id:"ErrorMessagesPW"
   })
   ErrorMessageDiv.appendTo(dialog);
  $(dialog).dialog({
    classes: {
      "ui-dialog": "modal-content",
      "ui-dialog-titlebar": "modal-header",
      "ui-dialog-title": "modal-title",
      "ui-dialog-titlebar-close": "close",
      "ui-dialog-content": "modal-body",
      "ui-dialog-buttonpane": "modal-footer"
    },
    id: "ChangePasswordDialog",
    title: "Skift Kodeord",
    width: 500,
    buttons: [
      {
        text: "Skift kode",
        click:function() {
          if (SendpasswordChange(UserID) == 0){
            $(this).dialog("close")
          }
        }
      },
      {
        text: "Afbryd",
        click: function () {
          $(this).dialog("close")
        }
    } 
    ]
  })
};

//Initial Javascript
$(function () {
  $(".ChangePassword").click(function() {ChangePasswordUser(this.id)})


})
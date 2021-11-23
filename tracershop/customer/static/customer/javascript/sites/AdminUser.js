function SendPasswordChange(UserID) {
  const passwordInput = $("#password");
  const passwordConfirm = $("#passwordConfirm");
  
  if (passwordInput.val() !== passwordConfirm.val()){
    //Error message
    $("#ErrorMessagesPW").text("Koderne er ikke ens")
    return -1
  }
$.ajax({
  url:"api/updatepw",
  type:"get",
  data:{
    "userID":UserID,
    newPassword: passwordInput.val()
  },
  success: function(data) {
    console.log(data)
  }
})
  return 0
}

function ChangePasswordUser(buttonID) {
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
    minlength:4
  })
  PasswordInput.appendTo(dialogpwP)
  const ConfirmPasswordInput = $("<input>", {
    id:"passwordConfirm",
    type: "password", 
    minlength:4
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
          if (SendPasswordChange(UserID) == 0){
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

function updateRights(){
  const rights = {}
  $(".UserRow").each(function() {
    if ($(this).children(".isAdmin").children(".isAdminCheckbox").prop("checked")) {
      rights[this.id] = true;
    } else {
      rights[this.id] = false;
    }
  });
  $.ajax({
    type:"get",
    url: "api/updateRights",
    data: rights,
    success: function(data) {
      $("#UpdaterightsMessages").text("Rettighederne er nu opdateret");
    }
  })
};

function toggleAccess() {
  const userID = $(this).attr("userID");
  const customerID = $(this).attr("customerID");
  const isChecked = $(this).prop("checked");

  if (isChecked) {
    $.ajax({
      url:`api/UserAccess/${userID}`,
      type:"POST",
      datatype:"json",
      data:JSON.stringify({"customerID" : customerID}),
    })
  } else {
    $.ajax({
      url:`api/UserAccess/${userID}`,
      type:"DELETE",
      datatype:"json",
      data:JSON.stringify({"customerID" : customerID}),
    })
  }

}


function OpenAccessModal(){
  const userID = this.id.substr(13);
  $.ajax({
    url:`api/UserAccess/${userID}`,
    type:"GET"
  }).then((data) => {
    console.log(data)
    // Data extraction
    const /** Length of response @type {number} */ Length = data["customerNames"].length
    const customerNames = data["customerNames"]
    const Assignments = data["assignments"]
    const customerIDs = data["customerIDs"]

    //Close the current Dialog
    $(".ui-dialog-content").dialog("close");
    const dialog = $("<div>")
    const dialogText = $("<p>").text("Kunder:").appendTo(dialog);
    for (let i = 0; i<Length; i++){
      const customerName = customerNames[i];
      const customerID = customerIDs[i];
      const Assignment = Assignments[i];
      const Tickmark = $("<p>").text(`${customerName}:`)
      if (Assignment) {
        $("<input>", {
          customerID : customerID,
          userID: userID,
          type:"checkbox",
          checked:"",
        }).on("change", toggleAccess).appendTo(Tickmark);
      } else {
        $("<input>", {
          customerID : customerID,
          userID: userID,
          type:"checkbox",
        }).on("change", toggleAccess).appendTo(Tickmark)
      }
      Tickmark.appendTo(dialog);
    }
    $(dialog).dialog({
      classes: {
        "ui-dialog": "modal-content",
        "ui-dialog-titlebar": "modal-header",
        "ui-dialog-title": "modal-title",
        "ui-dialog-titlebar-close": "close",
        "ui-dialog-content": "modal-body",
        "ui-dialog-buttonpane": "modal-footer"
      },
      id: "ChangeAccessDialog",
      title: "Bruger Adgang",
      width: 500,
      buttons: [{
        text: "Færdig",
        click: function () {
          $(this).dialog("close")
        }
      }]
    });
  });
}



//Initial Javascript
$(function () {
  $(".ChangePassword").click(function() {ChangePasswordUser(this.id)});
  $("#UpdateRightsButton").click(updateRights);
  $(".ChangeAccess").on('click',OpenAccessModal);
})
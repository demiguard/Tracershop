function SendNewPassword() {
  const Password        = $("#NewPassword").val()
  const PasswordConfirm = $("#RepeatNewPassword").val()

  if (Password != PasswordConfirm) {
    $("#ErrorDiv").addClass("ErrorBox")
    $("#ErrorDiv").text("Passwords matcher ikke")
    return
  }

  const ref = $(".ref").attr("id");

  $.ajax({
    type:"put",
    url:`/resetPassword/${ref}`,
    datatype:"json",
    data:JSON.stringify({
      "NewPassword":Password
    }),
    success: window.location.href = "/login",
    error:function(data){
      $("#ErrorDiv").addClass("ErrorBox")
      $("#ErrorDiv").text("Kunne ikke komme i kontakt med Serveren")
    }
  })
}

$(function () {
  $("#SubmitNewPassword").click(SendNewPassword)
});
const AddError = function(ErrorText) {
  $("#ErrorMessages").text(ErrorText);
  $("#ErrorMessages").addClass("ErrorBox");
}

const checkPassword = function() {
  $("#ErrorMessages").empty();
  $("#ErrorMessages").removeClass("ErrorBox")
  if ($("#id_username").val() == "") {
    AddError("Bruger navnet er tomt!")

    return false;
  }
  if ($("#id_password").val() != $("#id_password_confirm").val()) {
    AddError("Kodeordene stemmer ikke over ens")

    return false;
  }
  return true;
}

$(function() {
  $("#CreateUser").click(function() {
    $(window).off("beforeunload");
    return checkPassword();
  })
})

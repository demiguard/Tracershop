const AddError = function(ErrorText) {
  $("#ErrorMessages").text(ErrorText);
  $("#ErrorMessages").addClass("ErrorBox");
}

const checkPassword = function() {
  $("#ErrorMessages").empty();
  $("#ErrorMessages").removeClass("ErrorBox")

  const username = $("#id_username").val();
  
  if (username === "") {
    AddError("Bruger navnet er tomt!")

    return false;
  } 
  const bamIDRegex = /[a-zA-Z]{4}\d{4}/
  if (!bamIDRegex.test(username)) {
    AddError("Bruger navnet er ikke Et bam id")

    return false;
  }  

  if ($("#id_password").val() != $("#id_password_confirm").val()) {
    AddError("Kodeordene stemmer ikke over ens")

    return false;
  }
  return true;
}

$.ajaxSetup({ 
  beforeSend: function(xhr, settings) {
    function getCookie(name) {
      var cookieValue = null;
      if (document.cookie && document.cookie != '') {
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
          var cookie = jQuery.trim(cookies[i]);
          // Does this cookie string begin with the name we want?
          if (cookie.substring(0, name.length + 1) == (name + '=')) {
            cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
            break;
          }
        }
      }
      return cookieValue;
    }
    
    if (!(/^http:.*/.test(settings.url) || /^https:.*/.test(settings.url))) {
      // Only send the token to relative URLs i.e. locally.
      xhr.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
    }
  } 
});



$(function() {
  $("#CreateUser").click((event) => {
    event.preventDefault();
    if (checkPassword($("#id_password").val())) {
      $.ajax({
        url:"/createuser",
        type:"POST",
        data:{
          "username" : $("#id_username").val(),
          "password" : $("#id_password").val(),
          "email_1"  : $("#id_email_1").val()
        }
      }).then((data) => {
        console.log(data);
        if (data["success"] === "success"){
            window.location.replace("/");
        } else {
          AddError(data["success"]);
        }
         
      })
    }
  });
})

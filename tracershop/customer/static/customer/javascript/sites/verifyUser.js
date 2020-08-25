let clear_row = function(RowID, mode) {
  var row = $('#tr-'+RowID);
  row.empty();
  var reponse = document.createElement('td')
  if (mode == 'DELETE') {
    reponse.innerText = "Brugeren er slettet";
  } else if ( mode == 'PUT') {
    reponse.innerText = "Brugeren er Godkendt";
  }
  row.append(reponse);
}

let get_api_data = function(ID, Type) {
  let is_staff_field = $('#tr-'+ID).children('#td-is-staff').children('#id_is_staff').prop('checked');
  let is_admin_field = $('#tr-'+ID).children('#td-is-admin').children('#id_is_admin').prop('checked');
  let customerNumber   = $('#tr-'+ID).children('#td-customerNumber').children('#id_customerNumber').val();

  return {
    url: 'api/verifyUser/' + ID,
    type: Type,
    data: {
      'is_admin': is_admin_field,
      'is_staff' : is_staff_field,
      'customerNumber' : customerNumber
    },
    success: function(data) {
      console.log(data)
    },
    error: function(){

    }
  }
}


let handleButton = function(ID, type) {
  $.ajax(get_api_data(ID, type))
  clear_row(ID, type);

}


$(function() {
  let DeleteButtons = $('.DeleteButton');
  let VerificationButtons = $('.VerficationButton');


  for (let i = 0; i < DeleteButtons.length; i++) {
    const DeleteButton = $(DeleteButtons[i]);
    const VerificationButton = $(VerificationButtons[i]);
    const ID = DeleteButton.attr('id')

    DeleteButton.on('click', () => handleButton(ID, 'DELETE'))
    VerificationButton.on('click', () => handleButton(ID, 'PUT'))
  }

});
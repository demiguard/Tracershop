import { destroyActiveDialog } from "./htmlHelpers.js";
export { EditOrder }

const EditOrderErrorID = "EditOrderError"




var EditOrder = function(){
  //Close any Active dialog
  destroyActiveDialog();
  const orderID = this.id.substr(6)
  const EditDialog = document.createElement("div");
  EditDialog.classList.add("container")

  const amount = $("#Amount-"+orderID).text();
  const CommentTR = $("#comment-"+orderID).children()[0];
  const comment = $(CommentTR).attr("title")
  
  EditDialog.id = "EditOrderDialog";
  const EditMBQDiv = $("<div>", {class:"row"});
  const MBQLabel =   $("<label>", {
    class: "CenterLabel",
    value:"MBQ"
  })
  const MBQInput = $("<input>", {
    
    value: amount,
    type: "number"
  });
  MBQLabel.text("Ændre MBq: ");
  $(EditMBQDiv).append(MBQLabel);
  $(EditMBQDiv).append(MBQInput);
  const EditCommentDiv = $("<div>", {class:"row"});
  const CommentLabel =   $("<label>", {
    class: "CenterLabel",
    value:"Comment"
  });
  const CommentInput = $("<input>", {
    value: comment,
    type:"text"
  });
  CommentLabel.text("Ændre Kommentar: ")
  $(EditCommentDiv).append(CommentLabel);
  $(EditCommentDiv).append(CommentInput);

  $(EditDialog).append(EditMBQDiv);
  $(EditDialog).append(EditCommentDiv);

  const ErrorDiv = $("div", {
    id: EditOrderErrorID
  })

  $(EditDialog).dialog({
    classes: {
      "ui-dialog": "modal-content",
      "ui-dialog-titlebar": "modal-header",
      "ui-dialog-title": "modal-title",
      "ui-dialog-titlebar-close": "close",
      "ui-dialog-content": "modal-body",
      "ui-dialog-buttonpane": "modal-footer"
    },
    id: "EditOrderDialog",
    title: "Ændre ordre " + orderID,
    width: 500,
    buttons: [
      {
        text: "Opdater ordre " + orderID,
        click: function() {
          //Send Request To Server 
          $.ajax({
            type:"put",
            url: "api/EditOrder",
            data: JSON.stringify({
              "OrderID" : orderID,
              "NewAmount" : MBQInput.val(),
              "NewComment" : CommentInput.val()
            }),
            success: function(data) {
              if (data['Success'] = "Success") {
                destroyActiveDialog()
              } else {
                ErrorDiv.text("Der er Sket en fejl");
                ErrorDiv.addClass("ErrorBox")
              }
              
      
            }
          })
          
          
        }
      },
      {
        text: "Slet ordre " + orderID,
        click: function() {
          $.ajax({
            type:"delete",
            data: JSON.stringify({
              "OrderID" : orderID
            }),
            url: "api/EditOrder",
            success: function(data) {
              if (data['Success'] = "Success") {
                destroyActiveDialog()
              } else {
                ErrorDiv.text("Der er Sket en fejl");
                ErrorDiv.addClass("ErrorBox")
              }
              
      
            }
          })
        }
      },
      {
        text: "Annuller",
        click: function() {
          destroyActiveDialog()
        }
      }
    ]
  })


  

};


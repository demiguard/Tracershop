import { destroyActiveDialog, constructElement, constructElementID, constructElementClassList } from "./htmlHelpers.js";
import { SendOrder } from "./requests.js"
export { EditOrder }

const EditOrderErrorID = "EditOrderError";

function SuccessfullyEditedOrder(OrderID, overhead, newAmount, newComment){
  let NewTotal = Math.floor(newAmount * (1 + overhead/100));
  let Row = $(`#OrderRow-${OrderID}`);
  let data = Row.children()
  for (let i = 0; i < data.length; i++) {
    let node = data[i]
    if (i == 2) $(node).text(newAmount);
    if (i == 3) $(node).text(NewTotal);
    if (i == 7) {
      $(node).empty();
      const commentImage = $("<img>", {
        src : "/static/customer/images/comment.svg", 
        class: "StatusIcon",
        title: newComment
      });
      $(commentImage).tooltip();
      RowData.push(commentImage);
    }
  }
}


function SuccessfullyDeletedOrder(OrderID){
  let Row = $(`#OrderRow-${OrderID}`);
  let tBody = Row.parent();
  if (tBody.length > 1) {
    Row.remove();
    return
  }
  //Remove the table and recreate Form
  let Table = tBody.parent();
  let InformationRow = Table.parent();
  let OrderRow = InformationRow.parent();
  Table.remove();
  // Reconstruct the Form
  let RowNumber = InformationRow.attr("id").substr(14);
  let buttonDiv = constructElementID("div", `ButtonDiv${RowNumber}`);
  let Space = constructElementClassList("div", ["col-1"]);
  let Space2 = constructElementClassList("div", ["col-1"]);
  let CommentDiv = constructElementID("div", `CommentDiv${RowNumber}`);
  let OrderButton = $("<Button>",{
    "id" : RowNumber,
    "class": "btn btn-primary OrderButton"
  });
  OrderButton.text("Bestil")
  OrderButton.click(SendOrder);

  let OrderTimeDiv = OrderRow.children(".order");
  let OrderTime = OrderTimeDiv.text();

  let MBqInput = $("<input>", {
    "id": "id_order_MBQ",
    "type" : "number",
    "min"  : "0",
    "name" : "order_MBQ",
    "class" : `form-control ${OrderTime}:00`
  });
  buttonDiv.append(MBqInput);

  let CommentInput = $("<input>", {
    id: "id_comment",
    class: "form-control",
    type: "text",
    name:"comment"
  });
  CommentDiv.append(CommentInput);


  InformationRow.append(buttonDiv);
  InformationRow.append(Space);
  InformationRow.append(CommentDiv);
  InformationRow.append(Space2);
  InformationRow.append(OrderButton);

}




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
          const customerID = $("#customer_select").children("option:selected").val();
          $.ajax({
            type:"put",
            url: "api/EditOrder",
            data: JSON.stringify({
              "ActiveCustomer" : customerID,
              "OrderID" : orderID,
              "NewAmount" : MBQInput.val(),
              "NewComment" : CommentInput.val()
            }),
            success: function(data) {
              if (data['Success'] == "Success") {
                destroyActiveDialog()
                SuccessfullyEditedOrder(orderID, data['overhead'], MBQInput.val(), CommentInput.val() )
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
                SuccessfullyDeletedOrder(orderID)
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


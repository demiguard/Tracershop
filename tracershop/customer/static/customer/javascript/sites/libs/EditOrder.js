import { destroyActiveDialog, constructElement, constructElementID, constructElementClassList, MaxCharInField, auto_char } from "./htmlHelpers.js";
import { SendOrder, SendTOrder } from "./requests.js";
import { createFDGForm } from "./Factory.js";
export { EditOrder, EditTOrder, SendEditOrder }


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
      if (newComment) {
        const commentImage = $("<img>", {
          src : "/static/customer/images/comment.svg", 
          class: "StatusIcon",
          title: newComment
        });
        $(commentImage).tooltip();
        $(node).append(commentImage);
      }
    }
  }
  if (data.length == 7 && newComment) {
    const NewCommentTD = $("<td>");
    const commentImage = $("<img>", {
      src : "/static/customer/images/comment.svg", 
      class: "StatusIcon",
      title: newComment
    });
    $(commentImage).tooltip();
    $(NewCommentTD).append(commentImage);
    data.append(NewCommentTD);
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
  // Change State
  let OrderTimeDiv = OrderRow.children(".order");
  $(OrderTimeDiv).removeClass("data");
  $(OrderTimeDiv).addClass("form");
  let OrderTime = OrderTimeDiv.text();

  Table.remove();
  // Reconstruct the Form
  let RowNumber = InformationRow.attr("id").substr(14);
  createFDGForm(InformationRow, OrderTime , RowNumber, SendOrder)

}

function SendEditOrder(OrderID, NewAmount, NewComment) {
  const customerID = $("#customer_select").children("option:selected").val();
  const date = $('#dato').text().replace(/\s+/g, '');
  $.ajax({
    type:"put",
    url: "api/EditOrder",
    data: JSON.stringify({
      "ActiveCustomer" : customerID,
      "OrderID" : OrderID,
      "NewAmount" :NewAmount,
      "NewComment" : NewComment,
      "Date" : date
    }),
    success: function(data) {
      const ErrorDiv = $("#"+EditOrderErrorID);
      if (data['Success'] == "Success") {
        destroyActiveDialog()
        SuccessfullyEditedOrder(OrderID, data['overhead'], NewAmount, NewComment)
      } else if (data['Success'] == "InvalidDate") {
        ErrorDiv.text("Orderen er låst, da deadlinen for at bestille FDG er passeret");
        ErrorDiv.addClass("ErrorBox");
      } else {
        ErrorDiv.text("Der er Sket ukendt en fejl");
        ErrorDiv.addClass("ErrorBox");
      }
    }
})}


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

  const ErrorDiv = $("<div>", {
    id: EditOrderErrorID
  }).appendTo(EditDialog);

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
          SendEditOrder(orderID, MBQInput.val(), CommentInput.val());
        }
      },
      {
        text: "Slet ordre " + orderID,
        click: function() {
          const date = $('#dato').text().replace(/\s+/g, '');
          $.ajax({
            type:"delete",
            data: JSON.stringify({
              "OrderID" : orderID,
              "Date" : date
            }),
            url: "api/EditOrder",
            success: function(data) {
              console.log(data)
              if (data['Success'] == "Success") {
                destroyActiveDialog()
                SuccessfullyDeletedOrder(orderID)
              } else if (data['Success'] == "InvalidDate") {
                ErrorDiv.text("Orderen er låst, da deadlinen for at bestille FDG er passeret");
                ErrorDiv.addClass("ErrorBox");  
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




function EditTOrder() {
  destroyActiveDialog()
  const OrderID = this.id.substr(8);

  const dialogDiv = $("<div>",{
    class : "container",
    id    : "EditTOrderDialog"
  });

  const Table = $("<table>", {
    class:"table"
  });
  const TableBody = $("<tbody>")
  //I'm not sure if this is a smart way of programming.
  var TracerRow, TimeRow, InjectionRow, commentRow, UseageRow;
  $(`#TOrder-${OrderID}`).children().each((index, element) => {
    if (index === 0) {
      TracerRow = $("<tr>");
      const RowName  = $("<td>");
      const RowData  = $("<td>");
      RowName.text("Tracer Type:");
      RowData.text($(element).text());
      
      TracerRow.append(RowName);
      TracerRow.append(RowData);
    }
    if (index === 3) {
      TimeRow = $("<tr>");
      const RowName  = $("<td>");
      const RowData  = $("<td>");
      RowName.text("Nyt Tidpunkt:");
      const NewTimeField = $("<input>", {
        id: "EditInjectionTimeInput",
        type:"text",
        class:"timeField",
        name: "NewTimeField"
      });
      NewTimeField.val(element.innerText);
      auto_char(NewTimeField,':',2)
      MaxCharInField(NewTimeField, 5)
      RowData.append(NewTimeField);
      TimeRow.append(RowName);
      TimeRow.append(RowData);
    }
    if (index === 4) {
      InjectionRow   = $("<tr>");
      const RowName  = $("<td>");
      const RowData  = $("<td>");
      RowName.text("Nyt antal injecktioner: ");
      const NewInjectionField = $("<input>", {
        id: "EditInjectionInput",
        type:"number",
        class:"injectionField",
        name: "NewInjectionField"
      });
      NewInjectionField.val(element.innerText);
      RowData.append(NewInjectionField);
      
      InjectionRow.append(RowName);
      InjectionRow.append(RowData);
    }
    if (index === 5) {
      commentRow = $("<tr>");
      const RowName  = $("<td>");
      const RowData  = $("<td>");
      RowName.text("Ny kommentar: ");
      const NewCommentField = $("<textarea>", {
        id: "EditComment",
        rows:1,
        name: "NewCommentField"
      });
      const commentImage = $(element).children()[0]
      NewCommentField.val($(commentImage).attr("data-original-title"))
      RowData.append(NewCommentField);
      commentRow.append(RowName);
      commentRow.append(RowData);
    }
    if (index === 6) {
      UseageRow = $("<tr>");
      const RowName = $("<td>").appendTo(UseageRow);
      RowName.text("Nyt brug");
      const RowData = $("<td>");
      const Select = $("<select>", { id:"NewUsageSelect", class:"custom-select" });
      const option1 = $("<option>", { value:"0" });
      option1.text("Human");
      const option2 = $("<option>", { value:"1" });
      option2.text("Dyr");
      const option3 = $("<option>", { value:"2" });
      option3.text("Andet");
      Select.append(option1);
      Select.append(option2);
      Select.append(option3);

      RowData.append(Select);
      UseageRow.append(RowData);

      const UseAgeField = $(element).text();

      if (UseAgeField == "Human") $(Select).val(0);
      if (UseAgeField == "Dyr")  $(Select).val(1)
      if (UseAgeField == "Andet") $(Select).val(2);

    }

  });
  TableBody.append(TracerRow);
  TableBody.append(TimeRow);
  TableBody.append(InjectionRow);
  TableBody.append(UseageRow);
  TableBody.append(commentRow);
  
  Table.append(TableBody);
  dialogDiv.append(Table);



  $(dialogDiv).dialog({
    classes: {
      "ui-dialog": "modal-content",
      "ui-dialog-titlebar": "modal-header",
      "ui-dialog-title": "modal-title",
      "ui-dialog-titlebar-close": "close",
      "ui-dialog-content": "modal-body",
      "ui-dialog-buttonpane": "modal-footer"
    },
    id: "EditOrderDialog",
    title: "Ændre T-order " + OrderID,
    width: 500,
    buttons : [
      {text: "Opdater Order: " + OrderID, click:function() {
        const NewHour =$("#EditInjectionTimeInput").val();
        const NewInjectionNumber =$("#EditInjectionInput").val();
        const NewComment = $("#EditComment").val();
        const NewUsage   = $("#NewUsageSelect").val();
        const NewActiveCustomer = $("#customer_select").val() // This might become relevant, ask about it
        $.ajax({
          url:"/api/EditTOrder",
          type:"PUT",
          datatype:"json",
          data: JSON.stringify({
            "OrderID":OrderID,
            "NewHour" : NewHour,
            "n_injections" : NewInjectionNumber,
            "NewComment" : NewComment,
            "NewUse"     : NewUsage,
            "NewActiveCustomer" : NewActiveCustomer
          }),
          success: function(data) {
            if (data["Success"] == "Success") {
              
              $(`#TOrder-${OrderID}`).children().each((index, element) => {
                if (index === 3) $(element).text(NewHour)
                if (index === 4) $(element).text(NewInjectionNumber)
                if (index === 5) { 
                  $(element).empty()
                  if (NewComment != "") {
                    const NewCommentImage = $("<img>", {
                      src : "/static/customer/images/comment.svg", 
                      class: "StatusIcon",
                      title: NewComment
                    });
                    $(NewCommentImage).tooltip();
                    $(element).append(NewCommentImage)
                  }
                }
                if (index === 6) $(element).text($("#NewUsageSelect option:selected").text())

              });
            }
            destroyActiveDialog();
          }
        })
      }},
      {text: "Slet Order: "+ OrderID, click:function() {
        $.ajax({
          type:"delete",
          datatype:"json",
          url:"api/EditTOrder",
          data:JSON.stringify({
            "OrderID" : OrderID
          }),
          success:function(data) {
            destroyActiveDialog()
            $(`#TOrder-${OrderID}`).remove(); 
            if ($("#secondaryTableBody").children().length == 0) {
              $("#T_orders").addClass("DisplayNone")
            }
          }
        })
      }},
      {text: "Annuller", click:function() {
        destroyActiveDialog();
      }}]
  })
}
import { createElement } from "./htmlHelpers.js";
import { EditOrder, EditTOrder } from "./EditOrder.js";
import { Table } from "./TableFactory.js";
import { MBQ_ID_HEADER, COMMENT_ID_HEADER } from './Constants.js'
export { SendOrder, SendTOrder }


function SendOrder () {
  const id = this.id;
  const idStr = String(id);
  const ErrorDiv = $("#OrderErrorMessages")
  ErrorDiv.empty();
  ErrorDiv.removeClass("ErrorBox");
  let amount = $('#' + MBQ_ID_HEADER +idStr).val();
  let comment = $('#' + COMMENT_ID_HEADER + idStr).val();
  let date = $('#dato').text().replace(/\s+/g, '');
  let now = new Date();
  let tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1);
  while(!(tomorrow.getDay() in [1,2,3,4,5])){
    tomorrow.setDate(tomorrow.getDate() + 1); // If it's a friday set tomorrow to next monday
  }
  const cutoffDate = `Dato:${tomorrow.getDate()}/${tomorrow.getMonth() + 1}/${tomorrow.getFullYear()}`
  console.log(cutoffDate)
  console.log(date)
  if (date == cutoffDate && now.getHours() >= 13){
    ErrorDiv.addClass("ErrorBox");
    const p = $("<p>");
    p.append("Du kan ikke bestille FDG til efter kl 13");

    ErrorDiv.append(p);
    return;
  }
  let customerID = $("#customer_select").children("option:selected").val();
  let NumbersRegex = /^\d+$/;
  if (!NumbersRegex.test(amount)) {
    ErrorDiv.text("Der er ikke tastet et tal ind i bestillings feltet!");
    ErrorDiv.addClass("ErrorBox");
    return;
  }

  $.post({
    url: "api/addOrder",
    data: {
      'dato' : date.substr(5),
      'order' : id,
      'amount' : amount,
      'comment' : comment,
      'customerID' : customerID
    },
    dataType: "JSON",
    success: function(data) {
      const Row = $("#" + "Row-" + String(id))
      const Order = Row.find(".order");
      Order.removeClass("form");
      Order.addClass("data");
      var informationRowDiv = $('#informationRow' + String(id));

      informationRowDiv.empty();
      const Total = data.amount * (1 + data.overhead / 100)
      var table = createElement(informationRowDiv,'','','table',["table"]);
      var tableHead = createElement(table, '',   '','thead',[]);
      createElement(tableHead, 'Status',         '','th',   []);
      createElement(tableHead, 'order ID',       '','th',   []);
      createElement(tableHead, 'Bestilt MBQ',    '','th',   []);
      createElement(tableHead, 'Produceret MBQ', '','th',   []);
      createElement(tableHead, 'Batch-nr.',      '','th',   []);
      createElement(tableHead, 'Frigivet MBQ',   '','th',   []);
      createElement(tableHead, 'Frigivet',       '','th',   []);
      var tableBody = createElement(table, '','','tbody',   []);
      var tableRow = createElement(tableBody,'', 'OrderRow-'+ data.lastOrder, 'tr', []);
      const statusImage = $('<img>', {
        src: `/static/customer/images/clipboard1.svg`,
        class: "StatusIcon Editable-Order",
        id: `Order-${data.lastOrder}`
      });
      statusImage.click(EditOrder);
      const statusTD = createElement(tableRow, "",  '', 'td', []);
      $(statusTD).append(statusImage);


      createElement(tableRow, data.lastOrder, '', 'td', []);
      createElement(tableRow, data.amount, '', 'td', []);
      createElement(tableRow, Total, '', 'td', []);
      createElement(tableRow, '', '', 'td', []);
      createElement(tableRow, 0, '', 'td', []);
      createElement(tableRow, "", '', 'td', []);
    },
    error: function() {
      console.log("Error");
    }
  });
};

function SendTOrder() {
  var TracerID = this.id.substr(12);
  var datarow =  $('#Row'+ String(TracerID));
  let date = $('#dato').text().replace(/\s+/g, '').substr(5);
  var bestillingTD = datarow.children('#deliverTime');
  var injectionTD  = datarow.children('#InjectionField');
  var useTD        = datarow.children('#UseField');
  var customerID = $("#customer_select").children("option:selected").val();
  var bestillingVal = bestillingTD.children('#id_deliverTime').val();
  var injectionVal  = injectionTD.children('#id_injectionField').val();
  var useVal        = useTD.children('#id_useField').val();
  var TracerName    = datarow.children('#TracerName').text();
  var comment       = $(`#TOrderComment-${TracerID}`).val();



  $.post({
    url: 'api/addTOrder',
    data: {
      'dato': date,
      'id'  : TracerID,
      'BestillingTid' : bestillingVal,
      'injections'    : injectionVal,
      'Usage'         : useVal,
      'customerID'    : customerID,
      "comment"       : comment
    },
    success: function(data) {
      var tOrdersRow = $("#T_orders");
      if (tOrdersRow.hasClass('DisplayNone')) tOrdersRow.removeClass('DisplayNone');
      var tableBody = $('#secondaryTableBody');
      var tableRow = createElement(tableBody,'', `TOrder-${data.lastOID}`, 'tr', []);
      createElement(tableRow, TracerName,  '', 'td', []);
      const statusImage = $('<img>', {
        src: `/static/customer/images/clipboard1.svg`,
        class: "StatusIcon Editable-TOrder",
        id: `TStatus-${data.lastOID}`
      });
      statusImage.click(EditTOrder);


      const StatusRow = createElement(tableRow, '', '', 'td', []);
      $(StatusRow).append(statusImage);
      createElement(tableRow, data.lastOID, '', 'td', []);
      createElement(tableRow, bestillingVal, '', 'td', []);
      createElement(tableRow, injectionVal, '', 'td', []);
      const commentRow = createElement(tableRow,'', '' ,'td' ,  []);
      if (comment) {
        const commentImage = $("<img>", {
          src: "/static/customer/images/comment.svg",
          class:"StatusIcon",
          title:comment
        });
        commentImage.tooltip();
        $(commentRow).append(commentImage);
      }
      var UseName;
      if (useVal === "0") { UseName = 'Human';}
      else if (useVal === "1") { UseName = "Dyr";}
      else { UseName = 'Andet'; }
      createElement(tableRow, UseName, '', 'td', []);
    }
  });
}

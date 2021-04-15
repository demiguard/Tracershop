import { createElement } from "./htmlHelpers.js";
export { SendOrder, SendTOrder }

function SendOrder () {
  console.log(this)
  const id = this.id;
  const ErrorDiv = $("#OrderErrorMessages")
  ErrorDiv.empty();
  ErrorDiv.removeClass("ErrorBox");
  let amount = $('#ButtonDiv'+String(id)).children('#id_order_MBQ').val();
  let comment = $('#CommentDiv'+String(id)).children('#id_comment').val();
  let date = $('#dato').text().replace(/\s+/g, '');
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
      var informationRowDiv = $('#informationRow' + String(id));
      informationRowDiv.empty();
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
      createElement(tableRow, "<img id=\"Order-"+ data.lastOrder + "\" src=\"/static/customer/images/clipboard1.svg\" class=\"StatusIcon Editable-Order\">",  '', 'td', []);
      createElement(tableRow, data.lastOrder, '', 'td', []);
      createElement(tableRow, data.amount, '', 'td', []);
      createElement(tableRow, '', '', 'td', []);
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
  var TracerID = this.id;
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


  $.post({
    url: 'api/addTOrder',
    data: {
      'dato': date,
      'id'  : TracerID,
      'BestillingTid' : bestillingVal,
      'injections'    : injectionVal,
      'Usage'         : useVal,
      'customerID'    : customerID
    },
    success: function(data) {
      var tOrdersRow = $("#T_orders");
      if(tOrdersRow.hasClass('DisplayNone')) {
        tOrdersRow.removeClass('DisplayNone');
      }
      var tableBody = $('#secondaryTableBody');
      var tableRow = createElement(tableBody,'', '', 'tr', []);
      createElement(tableRow, TracerName,  '', 'td', []);
      createElement(tableRow, 1, '', 'td', []);
      createElement(tableRow, data.lastOID, '', 'td', []);
      createElement(tableRow, bestillingVal, '', 'td', []);
      createElement(tableRow, injectionVal, '', 'td', []);
      var UseName;
      if (useVal === "0") {
        UseName = 'Menneske';
      } else if (useVal === "1") {
        UseName = "Dyr";
      } else {
        UseName = 'Andet';
      }
      createElement(tableRow, UseName, '', 'td', []);      
    }
  });
}

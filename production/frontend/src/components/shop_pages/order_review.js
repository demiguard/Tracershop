import React, { Component } from "react";
import { Col, Container, Row, Button, FormGroup, FormControl, FormLabel, Table, OverlayTrigger, Tooltip, Popover } from "react-bootstrap";
import { JSON_ACTIVITY_ORDER, LEGACY_KEYWORD_AMOUNT, LEGACY_KEYWORD_AMOUNT_O, LEGACY_KEYWORD_BATCHNR, LEGACY_KEYWORD_BID, LEGACY_KEYWORD_COID, LEGACY_KEYWORD_COMMENT, LEGACY_KEYWORD_CUSTOMER, LEGACY_KEYWORD_DELIVER_DATETIME, LEGACY_KEYWORD_RUN, LEGACY_KEYWORD_STATUS, LEGACY_KEYWORD_TOTAL_AMOUNT, LEGACY_KEYWORD_TOTAL_AMOUNT_O, LEGACY_KEYWORD_TRACER, LEGACY_KEYWORD_USERNAME, WEBSOCKET_DATA, WEBSOCKET_DATATYPE, WEBSOCKET_MESSAGE_CREATE_DATA_CLASS, WEBSOCKET_MESSAGE_SHOP_CREATE_ORDER, PROP_WEBSOCKET } from "../../lib/constants";
import { FormatDateStr } from "../../lib/formatting";
import { renderTableRow } from "../../lib/rendering";

import styles from '/src/css/Site.module.css'
import { ClickableIcon, StatusIcon } from "../injectable/icons";
import { HoverBox } from "../injectable/hover_box";

export { OrderReview }



const DeliverTimeStatus = {
  AVAILBLE_FOR_ORDER : 0,
  ALREADY_ORDERED : 1,
  UNAVAILABLE_FOR_ORDER : 2,
}

const newOrderObject = {
  newActivity : "",
  newComment : "",
  errorActivity : "",
  errorComment : "",
}


class OrderReview extends Component {
  static ERROR_MESSAGE_NAN_ACTIVITY = "Den ønsket Aktiviten kan ikke tolkes som\
   et tal, og kan derfor ikke bestilles"
  static ERROR_MESSAGE_NEGATIVE_ACTIVITY = "Den ønsket aktiviten er negativ,\
   og kan derfor ikke bestilles"
  static ERROR_MESSAGE_COMMENT_TOO_LONG = "Kommentaren kan ikke være længere en\
  d 8000 karakterer";

  constructor(props){
    super(props)
  }

  render(){
    return (<div></div>)
  }

}
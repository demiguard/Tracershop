import React, { Component } from "react";
import propTypes from "prop-types";
import { Accordion, Col, Row } from "react-bootstrap";
import { DatabaseField } from "./field.js";
import { changeState } from "../../../lib/state_management.js";
import { ClickableIcon } from "../icons.js";
import { WEBSOCKET_DATA, WEBSOCKET_DATATYPE, WEBSOCKET_DATA_ID, WEBSOCKET_MESSAGE_EDIT_DJANGO } from "../../../lib/constants.js";
import { TracerWebSocket } from "../../../lib/tracer_websocket.js";



export { Model };

/**
 *  This class represent a single model in the database
 */
class Model extends Component {
  static propTypes = {
    modelHeader : propTypes.any.isRequired,
    modelName : propTypes.string.isRequired,
    fields : propTypes.object.isRequired,
    fieldFrames : propTypes.object.isRequired,
    modelID : propTypes.any.isRequired,
    websocket : propTypes.instanceOf(TracerWebSocket)
  };

  constructor(props){
    super(props);

    this.state = {
      ...this.props.fields
    };
  }

  resetValue(field){
    const retFunc = (_evt) => {
      const newState = {...this.state};
      newState[field] = this.props.fields[field]
      this.setState(newState);
    }
    return retFunc;
  }

  commit(){
    const message = this.props.websocket.getMessage(WEBSOCKET_MESSAGE_EDIT_DJANGO);
    message[WEBSOCKET_DATA] = {...this.state};
    message[WEBSOCKET_DATATYPE] = this.props.modelName;
    message[WEBSOCKET_DATA_ID] = this.props.modelID;

    this.props.websocket.send(message);

  }

  render(){

    const fields = [];
    for(const field of Object.keys(this.props.fieldFrames)){
      fields.push(
      <DatabaseField
        key={field}
        defaultValue={this.props.fields[field]}
        value={this.state[field]}
        fieldFrame={this.props.fieldFrames[field]}
        fieldName={field}
        onChange={changeState(field, this).bind(this)}
        onReset={this.resetValue(field)}
      />);
    }

    return(
      <Accordion.Item eventKey={this.props.modelID}>
        <Accordion.Header>{this.props.modelHeader}</Accordion.Header>
        <Accordion.Body>
          {fields}
          <Row className="flex-row-reverse">
            <Col>
              <ClickableIcon src={"/static/images/accept.svg"} onClick={this.commit.bind(this)}/>
            </Col>
          </Row>
        </Accordion.Body>
      </Accordion.Item>
    );
  }
}

import React, { Component } from "react";
import propTypes from "prop-types"
import { FieldFrame } from "./field";
import { Accordion, Container } from "react-bootstrap";
import { Model } from "./model";
import { TracerWebSocket } from "../../../lib/tracer_websocket";

export { ModelTable }

class ModelTable extends Component {
  static propTypes = {
    models : propTypes.objectOf(Map).isRequired,
    modelName : propTypes.string.isRequired,
    fieldFrames : propTypes.object.isRequired,
    websocket : propTypes.instanceOf(TracerWebSocket),
  }

  render(){
    const models = [];

    for(const [modelID, model] of this.props.models){
      models.push(
        <Model
          key={modelID}
          modelID={modelID}
          modelName={this.props.modelName}
          fields={model}
          fieldFrames={this.props.fieldFrames}
          modelHeader={`${this.props.modelName}: ${modelID}`}
          websocket={this.props.websocket}
        />
      )
    }

    return (
      <Accordion.Item eventKey={this.props.modelName}>
        <Accordion.Header>{this.props.modelName}</Accordion.Header>
        <Accordion.Body>
          <Container>
            <Accordion>
              {models}
            </Accordion>
          </Container>
        </Accordion.Body>
      </Accordion.Item>
    )
  }
}
import React, { Component } from "react";
import { Accordion, Container, FormControl, FormGroup, InputGroup, Row } from "react-bootstrap";
import { FieldFrame, FIELDS } from "../injectable/database/field";
import { Model } from "../injectable/database/model";
import { ModelTable } from "../injectable/database/model_table";

export { ControlPanel }

const Models = ["Address","Database", "ServerConfig"];

const ModelTypes = {
  SingleModel : "SingleModel",
  MultipleModel:  "ManyModels",
}


/** */


class ControlPanel extends Component {
  constructor(props){
    super(props);

    this.modelFrames = {
      ServerConfig : {
        AdminEmail : new FieldFrame(FIELDS.charField),
        AdminPhoneNumber : new FieldFrame(FIELDS.charField),
        DateRange : new FieldFrame(FIELDS.intField),
        ExternalDatabase : new FieldFrame(FIELDS.foreignKeyField, this.props.Database),
      },
      Address : {
        ip : new FieldFrame(FIELDS.charField),
        port : new FieldFrame(FIELDS.intField),
        description : new FieldFrame(FIELDS.charField),
      },
      Database : {
        username: new FieldFrame(FIELDS.charField),
        password: new FieldFrame(FIELDS.charField),
        address: new FieldFrame(FIELDS.foreignKeyField, this.props.Address)
      },
    }
    this.modelTypes = {
      Address : ModelTypes.MultipleModel,
      Database : ModelTypes.MultipleModel,
      ServerConfig : ModelTypes.SingleModel,
    }

    this.state = {
      Address : new Map(this.props.Address),
      Database : new Map(this.props.Database),
      ServerConfig : {...this.props.ServerConfig},
    }
  }

  renderSingleModel(modelName){
    return (
      <Model
        key={modelName}
        modelID={1}
        modelName={modelName}
        modelHeader={modelName}
        fields={this.props[modelName]}
        fieldFrames={this.modelFrames[modelName]}
        websocket={this.props.websocket}
      />
    )
  }

  renderMultiModel(modelName){
    return <ModelTable
      key={modelName}
      models={this.props[modelName]}
      fieldFrames={this.modelFrames[modelName]}
      modelName={modelName}
      websocket={this.props.websocket}
    />;
  }

  render(){
    console.log(this.props);
    // Render Model
    const AccordionItems = []

    for(const modelName of Models){
      let AccordionBody;
      if(this.modelTypes[modelName] == ModelTypes.SingleModel)
        AccordionBody = this.renderSingleModel(modelName);
      else if(this.modelTypes[modelName] == ModelTypes.MultipleModel){
        AccordionBody = this.renderMultiModel(modelName);
      } else {
        throw "Unknown Model Type!"
      }

      AccordionItems.push(
        AccordionBody
      )
    }

    return (
      <Container>
        <Accordion>
          {AccordionItems}
        </Accordion>
      </Container>
    )
  }
}

import React, { Component } from "react";
import { Accordion, Container, FormControl, FormGroup, InputGroup, Row } from "react-bootstrap";
import { JSON_ADDRESS, JSON_DATABASE, JSON_SERVER_CONFIG, PROP_WEBSOCKET } from "../../lib/constants";
import { AlertBox, ERROR_LEVELS } from "../injectable/alert_box";
import { FieldFrame, FIELDS } from "../injectable/database/field";
import { Model } from "../injectable/database/model";
import { ModelTable } from "../injectable/database/model_table";

export { ControlPanel }

const Models = [JSON_ADDRESS,JSON_DATABASE, JSON_SERVER_CONFIG];

const ModelTypes = {
  SingleModel : "SingleModel",
  MultipleModel:  "ManyModels",
}


/** */


class ControlPanel extends Component {
  constructor(props){
    super(props);

    this.modelFrames = {};
    this.modelFrames[JSON_SERVER_CONFIG] =  {
        AdminEmail : new FieldFrame(FIELDS.charField),
        AdminPhoneNumber : new FieldFrame(FIELDS.charField),
        DateRange : new FieldFrame(FIELDS.intField),
        ExternalDatabase : new FieldFrame(FIELDS.foreignKeyField, this.props[JSON_DATABASE]),
        SMTPServer : new FieldFrame(FIELDS.charField)
    };
    this.modelFrames[JSON_ADDRESS] = {
        ip : new FieldFrame(FIELDS.charField),
        port : new FieldFrame(FIELDS.intField),
        description : new FieldFrame(FIELDS.charField),
    };
    this.modelFrames[JSON_DATABASE] = {
        username: new FieldFrame(FIELDS.charField),
        password: new FieldFrame(FIELDS.charField),
        address: new FieldFrame(FIELDS.foreignKeyField, this.props[JSON_ADDRESS], "description"),
    };

    this.modelTypes = {};
    this.modelTypes[JSON_ADDRESS] = ModelTypes.MultipleModel;
    this.modelTypes[JSON_DATABASE] = ModelTypes.MultipleModel;
    this.modelTypes[JSON_SERVER_CONFIG] = ModelTypes.SingleModel;
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
        websocket={this.props[PROP_WEBSOCKET]}
      />
    )
  }

  renderMultiModel(modelName){
    return <ModelTable
      key={modelName}
      models={this.props[modelName]}
      fieldFrames={this.modelFrames[modelName]}
      modelName={modelName}
      websocket={this.props[PROP_WEBSOCKET]}
    />;
  }

  render(){
    // Render Model
    const AccordionItems = []

    for(const modelName of Models){
      let AccordionBody;
      if(this.modelTypes[modelName] == ModelTypes.SingleModel)
        AccordionBody = this.renderSingleModel(modelName);
      else if(this.modelTypes[modelName] == ModelTypes.MultipleModel){
        AccordionBody = this.renderMultiModel(modelName);
      } else {
        throw "Unknown Model Type!";
      }

      AccordionItems.push(
        AccordionBody
      )
    }

    return (
      <Container>
        <AlertBox level={ERROR_LEVELS.warning} message={<div>
          This is a handy toolkit for making changes to the underlying django database.<br/>
          There's NO validation on many of these fields, i.e if something is a number, write a NUMBER<br/>
          FYI, you can make tracershop unusable by changing these fields!<br/>
          Also you and anyone currently using tracershop should refresh after you're done changing the fields.<br/>
          This is because the entire state is likely to become invalid after changing these fields!<br/>
        </div>}></AlertBox>
        <Accordion>
          {AccordionItems}
        </Accordion>
      </Container>
    )
  }
}

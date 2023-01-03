import React, { Component } from "react";
import { Accordion, Container, FormControl, FormGroup, InputGroup, Row } from "react-bootstrap";

export { ControlPanel }

const Models = ["Address","Database", "ServerConfig"];

const ModelTypes = {
  SingleModel : "SingleModel",
  MultipleModel:  "ManyModels",
}

const Fields = {
  charField : "char",
  intField : "int",
  ForeignKeyField : "ForeignKey",
}

const SingleModel = "SingleModel"
const MultipleModel = "ManyModels"


const ModelConfigs = {
  Address : {
    IDField : "ID",
    modelType : ModelTypes.MultipleModel,
    Keys : [{
      Key : "ip",
      Type : Fields.charField
    }, {
      Key : "port",
      Type : Fields.charField
    },{
      Key : "description",
      Type : Fields.charField
    }],
  },
  Database : {
    IDField : "databaseName",
    modelType : ModelTypes.MultipleModel,
    Keys : [{
      Key : "username",
      Type : Fields.charField
    }, {
      Key : "password",
      Type : Fields.charField
    },{
      Key : "address",
      Type : Fields.ForeignKeyField,
      TargetModel : "Address",
      TargetDescField : "description",
    }]
  },
  ServerConfig : {
    modelType : ModelTypes.SingleModel,
    Keys : [{
      Key : "ExternalDatabase",
      Type : Fields.ForeignKeyField,
      TargetModel : "Database",
      TargetDescField : "databaseName",
    }, {
      Key : "DateRange",
      Type : Fields.intField
    }]
  },
}

class ControlPanel extends Component {
  constructor(props){
    super(props);

    this.state = {
      Address : new Map(this.props.Address),
      Database : new Map(this.props.Database),
      ServerConfig : {...this.props.ServerConfig}
    }
  }

  changeMultiModelFunc(This, KeyConfig, ModelName, ModelID){
    return (event) => {
      const NewModelMap = new Map(This.state[ModelName])
      const Model = {...NewModelMap.get(ModelID)};
      if (KeyConfig.Type == Fields.charField) {
        Model[KeyConfig.Key] = event.target.value
      } else {
        Model[KeyConfig.Key] = event.target.value
      }
      NewModelMap.set(ModelID, Model)

      const NewState = {...This.state};
      NewState[ModelName] = NewModelMap;
      This.setState(NewState)
    }
  }

  renderField(KeyConfig, Model, ModelName, ModelID){
    const ModelConfig = ModelConfigs[ModelName]
    const StateModel = this.state[ModelName].get(ModelID);
    var ChangeFunction;
    if(ModelConfig.modelType == ModelTypes.MultipleModel){
      ChangeFunction = this.changeMultiModelFunc(this, KeyConfig, ModelName, ModelID)
    }

    if(KeyConfig.Type == Fields.charField){
      return (
        <InputGroup>
          <InputGroup.Text>{KeyConfig.Key}</InputGroup.Text>
          <FormControl onChange={ChangeFunction} value={StateModel[KeyConfig.Key]}></FormControl>
           { Model[KeyConfig.Key] == StateModel[KeyConfig.Key] ? null : <InputGroup.Text>Update</InputGroup.Text>}
        </InputGroup>);
    } else if(KeyConfig.Type == Fields.intField) {
      return (
        <InputGroup>
          <InputGroup.Text>{KeyConfig.Key}</InputGroup.Text>
          <FormControl onChange={ChangeFunction} value={StateModel[KeyConfig.Key]}></FormControl>
        </InputGroup>);
    } else if (KeyConfig.Type == Fields.ForeignKeyField){
      const AvailableModels = this.props[KeyConfig.TargetModel]
      const ModelOptions = [];
      for(const [AvailableModelID, AvailableModel] of AvailableModels){
        ModelOptions.push(<option key={AvailableModelID} value={AvailableModelID}>{AvailableModel[KeyConfig.TargetDescField]}</option>);
      }

      return (
      <InputGroup>
        <InputGroup.Text>{KeyConfig.Key}</InputGroup.Text>
        <select onChange={ChangeFunction} value={StateModel[KeyConfig.Key]} className="form-select">{ModelOptions}</select>
      </InputGroup>);
    }
  }

  renderSingleModel(ModelName){
    return <Accordion.Body></Accordion.Body>
  }

  renderMultiModel(ModelName){
    const models = this.props[ModelName];
    const ModelConfig = ModelConfigs[ModelName];
    const modelAccordions = [];

    for(const [ModelID, model] of models){
      const ModelRows = [];
      for (const KeyConfig of ModelConfig["Keys"]){
        ModelRows.push(
        <Row key={KeyConfig.Key}>
          {this.renderField(KeyConfig, model, ModelName, ModelID)}
        </Row>);
      }
      modelAccordions.push(
        <Accordion.Item eventKey={ModelID} key={ModelID}>
          <Accordion.Header>Model ID: {ModelID}</Accordion.Header>
          <Accordion.Body>
            <Container>
              {ModelRows}
            </Container>
          </Accordion.Body>
        </Accordion.Item>
      );
    }


    return (
    <Accordion.Body>
      <Container>
        <Accordion>
          {modelAccordions}
        </Accordion>
      </Container>
    </Accordion.Body>);
  }

  render(){

    // Render Model
    const AccordionItems = []

    for(const modelIdx in Models){
      const ModelName = Models[modelIdx];
      const ModelConfig = ModelConfigs[ModelName];
      var AccordionBody;
      if(ModelConfig.modelType == ModelTypes.SingleModel)
        var AccordionBody = this.renderSingleModel(ModelName);
      else if(ModelConfig.modelType == ModelTypes.MultipleModel){
        var AccordionBody = this.renderMultiModel(ModelName);
      }

      AccordionItems.push(
        <Accordion.Item eventKey={modelIdx} key={modelIdx}>
          <Accordion.Header>{ModelName}</Accordion.Header>
          {AccordionBody}
        </Accordion.Item>
      )
    }

    return (
      <Container>
        <Accordion defaultActiveKey="0">
          {AccordionItems}
        </Accordion>
      </Container>
    )
  }
}

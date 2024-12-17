import React, { useEffect, useState } from "react";
import { Container, FormControl, Col, Row, FormLabel, Button } from "react-bootstrap";
import { IdempotentButton } from "~/components/injectable/buttons";
import { Select, toOptions } from "~/components/injectable/select";
import { useTracershopState, useWebsocket } from "~/contexts/tracer_shop_context";
import { MODELS } from "~/dataclasses/dataclasses";
import { cssCenter } from "~/lib/constants";
import { ForeignField } from "~/lib/database_fields";
import { WEBSOCKET_DATATYPE, WEBSOCKET_MESSAGE_MODEL_CREATE } from "~/lib/shared_constants";
import { MARGIN } from "~/lib/styles";


const modelOptions = toOptions(Object.keys(MODELS).map((name, i) => {
  return {
    name : name,
    id : name
  };
}));

export function DatabasePanel(){
  const websocket = useWebsocket();
  const tsState = useTracershopState();
  const [activeModel, _setActiveModel] = useState(modelOptions[0].value)

  const model = MODELS[activeModel];
  const [newModel, setNewModel] = useState(new model());

  function setActiveModel(event){
    const Model = MODELS[event.target.value];
    const newModel = new Model();
    _setActiveModel(event.target.value);
    setNewModel(newModel);
  }

  const renderedFields = newModel.fields().map(
    (field, i) => {
      let related_models = undefined
      if(field instanceof ForeignField){
        related_models = tsState[field.related_to]
      }

      return (
      <Row style={MARGIN.topBottom.px15} key={i}>
        <Col style={cssCenter}><FormLabel>{field.name}</FormLabel></Col>
        <Col>{field.jsx(newModel[field.name], setNewModel, related_models)}</Col>
      </Row>);
    }

  );

  return (<Container>
    <Select
      value={activeModel}
      options={modelOptions}
      onChange={setActiveModel}
    />
    <hr style={MARGIN.topBottom.px15}/>
    <Row>
      <Col>
        {renderedFields}
        <Row>
          <Col></Col>
          <Col><IdempotentButton onClick={()=>{
            return websocket.send({
              [WEBSOCKET_MESSAGE_TYPE] : [WEBSOCKET_MESSAGE_MODEL_CREATE],
              [WEBSOCKET_DATATYPE] : activeModel,
              [WEBSOCKET_DATA] : newModel,
            });
          }}>
            Opret
            </IdempotentButton></Col>
        </Row>
      </Col>
      <Col></Col>
    </Row>
  </Container>);
}
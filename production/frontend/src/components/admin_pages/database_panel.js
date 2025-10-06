import React, { useEffect, useState } from "react";
import { Container, FormControl, Col, Row, FormLabel, Button } from "react-bootstrap";
import { IdempotentButton } from "~/components/injectable/buttons";
import { Select, toOptions } from "~/components/injectable/select";
import { useTracershopState, useWebsocket } from "~/contexts/tracer_shop_context";
import { MODELS } from "~/dataclasses/dataclasses";
import { cssCenter } from "~/lib/styles";
import { ForeignField } from "~/lib/database_fields";
import { WEBSOCKET_DATA, WEBSOCKET_DATATYPE, WEBSOCKET_MESSAGE_MODEL_CREATE, WEBSOCKET_MESSAGE_TYPE } from "~/lib/shared_constants";
import { MARGIN } from "~/lib/styles";
import { constructBlankArgsArray, getConstructorArgs } from "~/lib/utils";


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

  const [newModel, setNewModel] = useState(() => {
    return new model(...constructBlankArgsArray(model));
  });

  function setActiveModel(event){
    const Model = MODELS[event.target.value];
    _setActiveModel(event.target.value);

    setNewModel(() => {
      return new Model(...constructBlankArgsArray(Model));
    });
  }

  const renderedFields = newModel.fields().map(
    (field, i) => {
      let related_models = undefined
      if(field instanceof ForeignField){
        related_models = tsState[field.related_to]
      }

      function updateField(event){
        setNewModel(old => {
          const newModel = old.copy();
          newModel[field.name] = field.format(event.target.value);
          return newModel;
        })
      }

      return (
      <Row style={MARGIN.topBottom.px15} key={i}>
        <Col style={cssCenter}><FormLabel>{field.name}</FormLabel></Col>
        <Col>{field.jsx(newModel[field.name], updateField, related_models)}</Col>
      </Row>);
    }
  );



  function SendModelCreate(){
    return websocket.sendCreateModel(activeModel, newModel);
  }

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
          <Col>
            <IdempotentButton onClick={ SendModelCreate }>
              Opret
            </IdempotentButton>
          </Col>
        </Row>
      </Col>
      <Col></Col>
    </Row>
  </Container>);
}
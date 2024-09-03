import React, { useState } from "react";
import { Container } from "react-bootstrap";
import { Select, toOptions } from "~/components/injectable/select";
import { useTracershopState } from "~/components/tracer_shop_context";
import { MODELS } from "~/dataclasses/dataclasses";
import { setStateToEvent } from "~/lib/state_management";
import { MARGIN } from "~/lib/styles";


const modelOptions = toOptions(Object.keys(MODELS).map((name, i) => {
  return {
    name : name,
    id : name
  };
}));

export function DatabasePanel(){
  const [activeModel, setActiveModel] = useState(modelOptions[0].value)

  const model = MODELS[activeModel];

  console.log(model)

  return (<Container>
    <Select
      value={activeModel}
      options={modelOptions}
      onChange={setStateToEvent(setActiveModel)}
    />
    <hr style={MARGIN.topBottom.px15}/>


  </Container>);
}
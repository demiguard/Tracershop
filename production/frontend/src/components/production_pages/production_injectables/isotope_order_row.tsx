import React, { useState } from "react";
import { Row } from "react-bootstrap";
import { CommandProductionIcon } from "~/components/injectable/command_production_icons";
import { CommitIcon } from "~/components/injectable/commit_icon";
import { Comment } from "~/components/injectable/data_displays/comment";

import { FlexMinimizer } from "~/components/injectable/flexMinimizer";
import { CancelIcon, StatusIcon } from "~/components/injectable/icons";
import { ActivityInput } from "~/components/injectable/inputs/activity_input";

import { Optional } from "~/components/injectable/optional";
import { IsotopeOrder } from "~/dataclasses/dataclasses";
import { DISPLAY_STATUS, ORDER_STATUS } from "~/lib/constants";
import { useErrorState } from "~/lib/error_handling";
import { DATA_ISOTOPE_ORDER } from "~/lib/shared_constants";
import { toggleState } from "~/lib/state_management";
import { parseDanishPositiveNumberInput } from "~/lib/user_input";

type OrderRowProps = {
  order : IsotopeOrder
}

export function IsotopeOrderRow ({
  order
}: OrderRowProps) {
  const [editing, setEditing] = useState(false);
  const [displayActivity, setDisplayActivity] = useState(String(order.ordered_activity_MBq));
  const [error, setError] = useErrorState();

  function validate(){
    const [valid, number] = parseDanishPositiveNumberInput(displayActivity, 'Aktiviten')

    if (!valid){
      setError(number)
      return [false, {}]
    }


    return [true, {...order, ordered_activity_MBq : number}];
  }

  const displayStatus = (() => {
    switch (true) {
      case !([ORDER_STATUS.ACCEPTED, ORDER_STATUS.ORDERED].includes(order.status)):
        return DISPLAY_STATUS.STATIC;
      case editing === true:
        return DISPLAY_STATUS.EDITING;
      case editing === false:
        return DISPLAY_STATUS.DISPLAY;
    }
  })();

  return (
  <Row>
    <FlexMinimizer style={{ justifyContent : "center" }}>
      <StatusIcon order={order} onClick={toggleState(setEditing)}/>
    </FlexMinimizer>
    <ActivityInput
      style={{ margin : "auto" }}
      error={error}
      displayState={[displayActivity, setDisplayActivity]}
      displayStatus={displayStatus}
    />
    <Optional exists={!!(order.comment)}>
      <FlexMinimizer style={{justifyContent : "center" }}>
        <Comment comment={order.comment}/>
      </FlexMinimizer>
    </Optional>
    <Optional exists={[ORDER_STATUS.ACCEPTED, ORDER_STATUS.ORDERED].includes(order.status)}>
      <FlexMinimizer style={{ justifyContent : "center" }}>
        <CommandProductionIcon
          displayStatus={displayStatus}
          temp_object={order}
          validate={validate}
          object_type={DATA_ISOTOPE_ORDER}
        />
      </FlexMinimizer>
    </Optional>
  </Row>)
}
/**
 * This component is for ordering an injection order. It's not used for showing
 * existing orders, for that use injection_order_card
 */

import React, { useMemo, useState } from 'react'
import { Card, Col, FormControl, Row } from 'react-bootstrap';
import { useTracershopState } from '~/contexts/tracer_shop_context';
import { InjectionOrder, Tracer } from '~/dataclasses/dataclasses';
import { expiredDeadline } from '~/lib/chronomancy';
import { DATA_INJECTION_ORDER, TRACER_USAGE } from '~/lib/shared_constants';
import { ManyRows } from '../injectable/ManyRows';
import { Select, toOptions } from '../injectable/select';
import { TracershopInputGroup } from '../injectable/inputs/tracershop_input_group';
import { setStateToEvent } from '~/lib/state_management';
import { EditableInput } from '../injectable/inputs/editable_input';
import { TimeInput } from '../injectable/inputs/time_input';
import { UsageSelect } from '../injectable/derived_injectables/usage_select';
import { ShopActionButton } from '../injectable/buttons/shop_action_button';
import { CommitIcon } from '../injectable/commit_icon';
import { ErrorMonad, useErrorState } from '~/lib/error_handling';
import { parseTimeBind, parseWholePositiveNumberBind } from '~/lib/parsing';
import { dateToDateString } from '~/lib/formatting';
import { ORDER_STATUS } from '~/lib/constants';

type InjectionOrderingCardProps = {
  availableTracers : Array<Tracer>
  valid_deadline : boolean
  endpointID : number
}

const DELIVERY_HEADER = 'Leverings Tid';
const INJECTION_HEADER = 'Injektioner';

export function InjectionOrderingCard({
  availableTracers, valid_deadline, endpointID
} : InjectionOrderingCardProps){
  const state = useTracershopState();
  const tracerOptions = useMemo(() => {
    return availableTracers.filter((tracer) => {
      if(tracer.deadline){
        const deadline = state.deadline.get(tracer.deadline);
        return !expiredDeadline(
          deadline, state.today, state.closed_date
        );
      } else {
        return valid_deadline;
      }
    });
  }, [
    state.today, state.deadline, state.tracer, state.closed_date
  ]);

  const [selectedTracerID, setSelectedTracerID] = useState(() => {
    for(const tracer of tracerOptions){
      return tracer.id;
    }
  });
  const [injections, setInjections] = useState("1");
  const [usage, setUsage] = useState(TRACER_USAGE.human);
  const [comment, setComment] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("");
  const [deliveryTimeError, setDeliveryTimeError] = useErrorState();
  const [injectionsError, setInjectionsError] = useErrorState();

  function validate(){
    const m = new ErrorMonad();

    m.bind(parseTimeBind(deliveryTime, DELIVERY_HEADER));
    m.bind(parseWholePositiveNumberBind(injections, INJECTION_HEADER));

    if(m.registerErrors({
      [DELIVERY_HEADER] : setDeliveryTimeError,
      [INJECTION_HEADER] : setInjectionsError
    })){
      return false;
    }

    const {
      [DELIVERY_HEADER] : pDeliveryTime,
      [INJECTION_HEADER] : pInjections
    } = m.get_values();


    return [true, new InjectionOrder(
      -1,
      pDeliveryTime,
      dateToDateString(state.today),
      pInjections,
      ORDER_STATUS.ORDERED,
      usage,
      comment,
      state.logged_in_user.id,
      endpointID, selectedTracerID, "", "", "", null
    )];
  }


  // RENDERING - NO MORE HOOKS CALLS!
  if (tracerOptions.length === 0){
    return <div></div>;
  }



  return (
    <Card style={{padding : 0}}>
      <Card.Header>
        <Row>
          <Col xs={11}>
          <ManyRows>
            <Col>
              <TracershopInputGroup label={"Tracer"}>
                <Select
                  aria-label={`tracer-input--1`}
                  onChange={setStateToEvent(setSelectedTracerID)}
                  options={toOptions(tracerOptions, 'shortname')}
                  value={selectedTracerID}
                  />
              </TracershopInputGroup>
            </Col>
            <Col>
              <TracershopInputGroup label={"Injektioner"}>
                <EditableInput
                  aria-label={`injections-input--1`}
                  value={injections}
                  onChange={setStateToEvent(setInjections)}
                  />
              </TracershopInputGroup>
            </Col>
            <Col>
              <TracershopInputGroup label={"Tid"}>
                <TimeInput
                  aria-label="delivery-time-input--1"
                  value={deliveryTime}
                  stateFunction={setDeliveryTime}
                  />
              </TracershopInputGroup>
            </Col>
            <Col>
              <TracershopInputGroup label={"Brug"}>
                <UsageSelect
                  aria-label="usage-input--1"
                  value={usage}
                  onChange={setStateToEvent(setUsage)}
                  />
              </TracershopInputGroup>
            </Col>
            <Col>
              <TracershopInputGroup label="Kommentar">
                <EditableInput
                  data-testid={`comment--1`}
                  as="textarea"
                  rows={1}
                  value={comment}
                  onChange={setStateToEvent(setComment)}
                  />
              </TracershopInputGroup>
            </Col>
          </ManyRows>
          </Col>
          <Col style={{ alignItems : "center", display : "flex"}}>
            <CommitIcon
                    validate={validate}
                    temp_object={{}}
                    object_type={DATA_INJECTION_ORDER}
                    add_image="/static/images/cart.svg"
                  />
          </Col>
        </Row>
      </Card.Header>
    </Card>
  );
}

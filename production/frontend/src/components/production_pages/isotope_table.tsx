import React, { useState } from 'react'
import { Button, Col, Container, Row } from 'react-bootstrap';
import { DateDisplay } from '~/components/injectable/data_displays/date_display';
import { IsotopeProductionDisplay } from '~/components/production_pages/production_injectables/isotope_production_display';
import { ProductionIsotopeTimeSlot } from '~/components/production_pages/production_injectables/production_isotope_time_slot';
import { useTracershopState } from '~/contexts/tracer_shop_context'
import { IsotopeProduction } from '~/dataclasses/dataclasses';

import { ProductReference } from '~/dataclasses/references/product_reference';
import { getDay } from '~/lib/chronomancy';
import { IsotopeOrderMapping } from '~/lib/data_structures/isotope_order_mapping';
import { isotopeOrderFilter } from '~/lib/filters';
import { dateToDateString } from '~/lib/formatting';
import { IsotopeDisplay } from '../injectable/data_displays/isotope_display';
import { Optional } from '../injectable/optional';
import { CreateIsotopeOrderModal } from '../modals/create_isotope_order_modal';


type IsotopeTableArgs = {
  product : ProductReference
}


export function IsotopeTable({product}: IsotopeTableArgs){
  const state = useTracershopState();
  const day = getDay(state.today);
  const dateString = dateToDateString(state.today);


  const productions = product.filterProduction(state, {
    day : day
  }) as IsotopeProduction[];

  const renderedProductions = []
  for(const production of productions){
    renderedProductions.push(
      <IsotopeProductionDisplay
        key={production.id}
        production={production}
      />
    );
  }

  const all_orders = isotopeOrderFilter(
    state,
    {
      state : state,
      delivery_date : dateString,
      timeSlotFilterArgs : {
        state : state,
        isotopeID : product.product_id
      }
    }
  )

  const isotopeOrderMapping = new IsotopeOrderMapping(all_orders);
  const renderedTimeSlots = []

  for(const [timeSlotID, orders] of isotopeOrderMapping){

    const timeSlot = state.isotope_delivery.get(timeSlotID);

    renderedTimeSlots.push(
      <ProductionIsotopeTimeSlot key={timeSlotID} orders={orders} timeSlot={timeSlot}/>
    );
  }

  const [showCreateIsotopeOrderModal, setShowCreateIsotopeOrderModal] = useState(false);

  return (
    <Container>
      <Row>
        <Col>
        <h2> Produktion - <IsotopeDisplay isotope={product.product_id}/> - <DateDisplay date={state.today}/> </h2>
        </Col>
        <Col xs={2}>
          <Button onClick={() => {setShowCreateIsotopeOrderModal(true)}}>
            Opret Isotope ordre
          </Button>
        </Col>
      </Row>
      {renderedProductions}
      <Row>
        {renderedTimeSlots}
      </Row>
      <Optional exists={showCreateIsotopeOrderModal}>
        <CreateIsotopeOrderModal
          active_isotope={product.product_id}
          on_close={() => {setShowCreateIsotopeOrderModal(false)}}
        />
      </Optional>

    </Container>
  );
}
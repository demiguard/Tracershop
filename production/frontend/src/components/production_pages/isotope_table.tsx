import React from 'react'
import { Row } from 'react-bootstrap';
import { DateDisplay } from '~/components/injectable/data_displays/date_display';
import { IsotopeProductionDisplay } from '~/components/production_pages/production_injectables/isotopeProductionDisplay';
import { ProductionIsotopeTimeSlot } from '~/components/production_pages/production_injectables/production_isotope_time_slot';
import { useTracershopState } from '~/contexts/tracer_shop_context'
import { IsotopeDelivery, IsotopeOrder, IsotopeProduction } from '~/dataclasses/dataclasses';

import { ProductReference } from '~/dataclasses/references/product_reference';
import { getDay } from '~/lib/chronomancy';
import { IsotopeOrderMapping } from '~/lib/data_structures/isotope_order_mapping';
import { isotopeOrderFilter } from '~/lib/filters';
import { dateToDateString } from '~/lib/formatting';
import { IsotopeDisplay } from '../injectable/data_displays/isotope_display';


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



  return (
    <div>
      <Row>
        <h2> Produktion - <IsotopeDisplay isotope={product.product_id}/> - <DateDisplay date={state.today}/> </h2>
      </Row>
      {renderedProductions}
      <Row>
        {renderedTimeSlots}
      </Row>
    </div>
  );
}
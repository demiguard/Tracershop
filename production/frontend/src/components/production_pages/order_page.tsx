import React, { useState } from "react";
import { Button, Container, Row, Col } from 'react-bootstrap';
import { InjectionTable } from './injection_table';
import { TRACER_TYPE, PROP_ACTIVE_TRACER, PROP_ACTIVE_DATE,
  DATABASE_ACTIVE_TRACER } from "~/lib/constants";
import { db } from "~/lib/local_storage_driver";

import { useTracershopState, useWebsocket, useTracershopDispatch} from "~/contexts/tracer_shop_context";
import { ProductionCalender } from "~/components/injectable/derived_injectables/production_calender";
import { Optional } from "~/components/injectable/optional";
import { UpdateToday } from "~/lib/state_actions";
import { MARGIN } from "~/lib/styles";
import { WeeklyProductionOverview } from "~/components/production_pages/weekly_production_overview";
import { ButtonRow } from "~/components/injectable/button_row";
import { SpecialTracerButton, WeeklyViewButton } from "~/components/injectable/buttons";
import { PRODUCT_TYPES, ProductReference } from "~/dataclasses/references/product_reference";
import { makeBlankProductReference } from "~/lib/blanks";
import { isotopeFilter } from "~/lib/filters";
import { presentName } from "~/lib/presentation";
import { ProductionTable } from "~/components/production_pages/product_table";

const SUBPAGE_PRODUCT = "activity"
const SUBPAGE_INJECTION = "injection"
const SUBPAGE_WEEKLY_OVERVIEW = "weeklyOverview"

const SubPages = {
  [SUBPAGE_PRODUCT] : ProductionTable,
  [SUBPAGE_INJECTION] : InjectionTable,
  [SUBPAGE_WEEKLY_OVERVIEW] : WeeklyProductionOverview,
};

type ProductButtonArgs = {
  is_active_product : boolean,
  product : ProductReference,
  onClick : () => void
}

function TableSwitchButton({is_active_product, product, onClick}: ProductButtonArgs) {
  const state = useTracershopState()
  const underline = is_active_product;
  const name = presentName(product.to_product(state));
  return (
    <Button
      style={MARGIN.leftRight.px15}
      key={name}
      //@ts-ignore
      sz="sm"
      onClick={onClick}
    >
      <Optional exists={underline} alternative={<div>{name}</div>}>
        <u>{name}</u>
      </Optional>
    </Button>
  );
}

export function OrderPage() {
  const state = useTracershopState();
  const dispatch = useTracershopDispatch()
  const websocket = useWebsocket();

  const [activeView, setActiveView] = useState(() => {
    const SavedActiveProduct = db.get(DATABASE_ACTIVE_TRACER) as string | null
    let product : ProductReference = makeBlankProductReference();

    if(SavedActiveProduct == null){
      for(const tracer of state.tracer.values()){
        if(tracer.tracer_type === TRACER_TYPE.ACTIVITY){
          product = ProductReference.fromProduct(tracer)
          db.set(DATABASE_ACTIVE_TRACER, product.to_value());
          break;
        }
      }
    } else if(SavedActiveProduct === "-1") {
      // Special Tracer is selected
    } else {
      product = ProductReference.fromValue(SavedActiveProduct)
    }

    const activeTable = product.type === PRODUCT_TYPES.EMPTY ? SUBPAGE_INJECTION : SUBPAGE_PRODUCT

    return {
      activeTracer : product,
      activeTable : activeTable
    }
  } );

  // Calender functions
  function setActiveDate(newDate: Date) {
    dispatch(new UpdateToday(newDate, websocket));
  }

  function setActivityTable(product: ProductReference){
    return () => {
      db.set(DATABASE_ACTIVE_TRACER, product.to_value());
      setActiveView({
        activeTracer : product,
        activeTable : SUBPAGE_PRODUCT,
      })
    }
  }

  function setInjectionTable(){
    db.set(DATABASE_ACTIVE_TRACER, -1);
    setActiveView({
      activeTable : SUBPAGE_INJECTION,
      activeTracer : makeBlankProductReference()
    })
  }

  function setWeeklyView(){
    setActiveView({
      activeTable : SUBPAGE_WEEKLY_OVERVIEW,
      activeTracer : makeBlankProductReference()
    })
  }

  const TableSwitchButtons = [];
  for (const tracer of state.tracer.values()){
    if(tracer.tracer_type === TRACER_TYPE.ACTIVITY){
      const productRef = ProductReference.fromProduct(tracer);
      const is_active = activeView.activeTracer.equal(productRef);
      TableSwitchButtons.push(
        <TableSwitchButton
          key={productRef.to_value()}
          is_active_product={is_active}
          product={productRef}
          onClick={setActivityTable(productRef)}
        />);
    }
  }
  const producibleIsotopes = isotopeFilter(state, { state : state, producible : true});

  for(const isotope of producibleIsotopes){
    const productRef = ProductReference.fromProduct(isotope);
    const is_active = activeView.activeTracer.equal(productRef);

    TableSwitchButtons.push(
      <TableSwitchButton
        is_active_product={is_active}
        key={productRef.to_value()}
        product={productRef}
        onClick={setActivityTable(productRef)}
      />
    );
  }

  const underlineSpecial = activeView.activeTable === SUBPAGE_INJECTION;
  const underlineWeeklyReviewButton = activeView.activeTable === SUBPAGE_WEEKLY_OVERVIEW;
  // Keyword setting
  const OrderSubPage = SubPages[activeView.activeTable];
  const SubTableProps = {
    product : activeView.activeTracer,
  }

  return (
    <div>
      <ButtonRow before_c_buttons={TableSwitchButtons} style={MARGIN.bottom.px30}>
        <SpecialTracerButton
          is_active={underlineSpecial}
          onClick={setInjectionTable}
        />
        <WeeklyViewButton
          is_active={underlineWeeklyReviewButton}
          onClick={setWeeklyView}
        />
      </ButtonRow>
      <Row>
        <Col sm={8}>
          <OrderSubPage
            {...SubTableProps}
          />
        </Col>
        <Col sm={4}>
          <ProductionCalender
            on_day_click={setActiveDate}
          />
        </Col>
      </Row>
    </div>
  );
}

import React, { useState } from "react";
import { Button, Container, Row, Col } from 'react-bootstrap';
import { InjectionTable } from './injection_table';
import { ActivityTable } from './activity_table';
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

const SUBPAGE_ACTIVITY = "activity"
const SUBPAGE_INJECTION = "injection"
const SUBPAGE_WEEKLYOVERVIEW = "weeklyOverview"

const SubPages = {
  [SUBPAGE_ACTIVITY] : ActivityTable,
  [SUBPAGE_INJECTION] : InjectionTable,
  [SUBPAGE_WEEKLYOVERVIEW] : WeeklyProductionOverview,
};

/**
 *
 * @param {Object} param0
 * @param {Tracer} param0.tracer
 * @returns
 */
function TableSwitchButton({is_active_tracer, tracer, onClick}) {
  const underline = is_active_tracer;
  return (
    <Button
      style={MARGIN.leftRight.px15}
      key={tracer.shortname}
      sz="sm"
      onClick={onClick}
    >
      <Optional exists={underline} alternative={<div>{tracer.shortname}</div>}>
        <u>{tracer.shortname}</u>
      </Optional>
    </Button>
  );
}

export function OrderPage() {
  const state = useTracershopState();
  const dispatch = useTracershopDispatch()
  const websocket = useWebsocket();

  let /**@type {Date} */ today = state.today;
  let /**@type {Number | null} */ activeTracerInit = db.get(DATABASE_ACTIVE_TRACER);
  if(!activeTracerInit) {
    const tracers = [...state.tracer.values()].filter(
      (tracer) => {return tracer.tracer_type === TRACER_TYPE.ACTIVITY}
    ).sort((a, b) => {return b.id - a.id})

    activeTracerInit = tracers.length ? tracers[0].id : -1;
    db.set(DATABASE_ACTIVE_TRACER, activeTracerInit);
  }

  const activeTableInit = (activeTracerInit == -1) ? SUBPAGE_INJECTION : SUBPAGE_ACTIVITY;
  const [activeView, setActiveView] = useState({
    activeTracer : activeTracerInit,
    activeTable :  activeTableInit
  });

  // Calender functions
  function setActiveDate(newDate) {
    dispatch(new UpdateToday(newDate, websocket));
  }


  function setActivityTable(tracer){
    return () => {
      db.set(DATABASE_ACTIVE_TRACER, tracer.id);
      setActiveView({
        activeTracer : tracer.id,
        activeTable : SUBPAGE_ACTIVITY,
      })
    }
  }

  function setInjectionTable(){
    db.set(DATABASE_ACTIVE_TRACER, -1);
    setActiveView({
      activeTable : SUBPAGE_INJECTION,
      activeTracer : -1
    })
  }

  function setWeeklyView(){
    setActiveView({
      activeTable : SUBPAGE_WEEKLYOVERVIEW,
      activeTracer : -2
    })
  }

  const TableSwitchButtons = [];
  for (const tracer of state.tracer.values()){
    if(tracer.tracer_type === TRACER_TYPE.ACTIVITY){
      const is_active = activeView.activeTracer === tracer.id;
      TableSwitchButtons.push(
        <TableSwitchButton
          key={tracer.id}
          is_active_tracer={is_active}
          tracer={tracer}
          onClick={setActivityTable(tracer)}
        />);
    }
  }

  const underlineSpecial = activeView.activeTracer === -1;
  const underlineWeeklyReviewButton = activeView.activeTable === "weeklyOverview";
  // Keyword setting
  const OrderSubPage = SubPages[activeView.activeTable];
  const SubTableProps = {
    [PROP_ACTIVE_TRACER] : activeView.activeTracer,
    [PROP_ACTIVE_DATE] : today
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
            activeTracer={activeView.activeTracer}
            active_date={today}
            on_day_click={setActiveDate}
          />
        </Col>
      </Row>
    </div>
  );
}

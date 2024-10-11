/**
 * @jest-environment jsdom
 */

import React from "react";
import { jest, describe, it } from "@jest/globals"
import { render } from "@testing-library/react";
import { testState } from "~/tests/app_state";
import { InjectionOrder, TracershopState } from "~/dataclasses/dataclasses";
import { StateContextProvider } from "~/components/tracer_shop_context";
import { WeeklyProductionOverview } from "~/components/production_pages/weekly_production_overview";
import { toMapping } from "~/lib/utils";
import { ORDER_STATUS } from "~/lib/constants";
import { DATA_INJECTION_ORDER } from "~/lib/shared_constants";


describe("Weekly production overview test suite", () => {
  it("Standard render test", () => {
    const modifiedState = new TracershopState();
    Object.assign(modifiedState, testState);

    const active_date = "2020-05-05";

    modifiedState[DATA_INJECTION_ORDER] = toMapping([
      new InjectionOrder(1, "11:00:00", "2020-05-05", 1, ORDER_STATUS.ACCEPTED, undefined, undefined, undefined, undefined, 2),
      new InjectionOrder(2, "11:30:00", "2020-05-05", 1, ORDER_STATUS.ORDERED,undefined, undefined, undefined, undefined, 2),
    ]);


    render(
      <StateContextProvider value={modifiedState}>
        <WeeklyProductionOverview active_date={active_date}/>
      </StateContextProvider>
    );

  })
})

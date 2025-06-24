/**
 * @jest-environment jsdom
 */

import React from "react";
import { jest, describe, it } from "@jest/globals"
import { render, screen } from "@testing-library/react";
import { testState } from "~/tests/app_state";
import { InjectionOrder, TracershopState } from "~/dataclasses/dataclasses";
import { TracerShopContext } from "~/contexts/tracer_shop_context";
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
      new InjectionOrder(2, "11:30:00", "2020-05-05", 1, ORDER_STATUS.ORDERED, undefined, undefined, undefined, undefined, 2),
    ]);


    render(
      <TracerShopContext tracershop_state={modifiedState}>
        <WeeklyProductionOverview active_date={active_date}/>
      </TracerShopContext>
    );


    const paragraph = screen.getByTestId("paragraph-2");

    expect(paragraph.innerHTML).toBe("test_tracer_2: 2 injektioner");

    const cells = screen.getAllByTestId("Cell-1")

    let has_color = false;
    for(const cell of cells){
      if('background' in cell.style && cell.style['background'] != "#FFFFFF"){
        has_color = true;
      }
    }

    expect(has_color).toBe(true);


  })
})

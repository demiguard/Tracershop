/**
 * @jest-environment jsdom
 */

import React from "react";
import { screen, render, cleanup, fireEvent, act } from "@testing-library/react";
import { jest } from '@jest/globals';
import { testState } from "~/tests/app_state.js";
import { TracerShopContext } from "~/contexts/tracer_shop_context.js";
import { PROP_ACTIVE_DATE, PROP_EXPIRED_ACTIVITY_DEADLINE, PROP_TIME_SLOT_ID, PROP_VALID_ACTIVITY_DEADLINE } from "~/lib/constants.js";
import { TimeSlotCardActivity } from "~/components/shop_pages/shop_injectables/time_slot_card_activity.js";
import { getRelevantActivityOrders } from "~/lib/filters.js";
import { CALCULATOR_NEW_ACTIVITY_LABEL, CALCULATOR_NEW_TIME_LABEL } from "~/components/injectable/calculator.js";
import { DATA_ACTIVITY_ORDER } from "~/lib/shared_constants.js";
const module = jest.mock('../../../../lib/tracer_websocket.js');
const tracer_websocket = require("../../../../lib/tracer_websocket.js");

let websocket = null;
let props = {}

const now = new Date(2020,4, 4, 10, 36, 44);
const default_time_slot_id = 1
const overhead = 1.5;

const [,,relevantActivityOrders] = getRelevantActivityOrders(testState, 0, 1, 1, "2020-05-04" )

beforeEach(async () => {
  jest.useFakeTimers('modern')
  jest.setSystemTime(now)
  delete window.location
  window.location = { href : "tracershop"}
  websocket = tracer_websocket.TracerWebSocket;
  props = {
    [PROP_TIME_SLOT_ID] : default_time_slot_id,
    [PROP_ACTIVE_DATE] : now,
    [PROP_VALID_ACTIVITY_DEADLINE] : true,
    activityOrders : relevantActivityOrders,
    overhead : overhead,
  }
});

afterEach(() => {
  cleanup();
  module.clearAllMocks()
  window.localStorage.clear()
  websocket = null;
});

describe("Time slot card Test Suite", () => {
  it("Standard Render Test", () => {
    render(
      <TracerShopContext tracershop_state={testState} websocket={websocket}>
        <TimeSlotCardActivity {...props} />
      </TracerShopContext>
    );

    const timeSlot = testState.deliver_times.get(default_time_slot_id)
    expect(screen.getByText(timeSlot.delivery_time)).toBeVisible();
    let orderedActivity = 0
    for(const order of relevantActivityOrders ){
      if(order.ordered_time_slot === 1){
        orderedActivity += order.ordered_activity;
      }
    }

    //expect(screen.getByText(`Bestilt: ${orderedActivity} MBq`)).toBeVisible();
  });

  it("Open the card with extra order", () => {
    render(
      <TracerShopContext tracershop_state={testState} websocket={websocket}>
        <TimeSlotCardActivity {...props} />
      </TracerShopContext>
    );

    const openButton = screen.getByLabelText(`open-time-slot-${default_time_slot_id}`);

    act(() => {
      fireEvent.click(openButton);
    });

    expect(screen.getByLabelText('commit--1')).toBeVisible();

    for(const order of relevantActivityOrders ){
      if(order.ordered_time_slot === 1){
        expect(screen.getByText(`ID: ${order.id}`)).toBeVisible();
      }
    }
  });

  it("Open the card without extra order", () => {
    props[PROP_VALID_ACTIVITY_DEADLINE] = false;

    render(
      <TracerShopContext tracershop_state={testState} websocket={websocket}>
        <TimeSlotCardActivity {...props} />
      </TracerShopContext>
    );

    act(() => {
      screen.getByLabelText(`open-time-slot-${default_time_slot_id}`).click();
    });

    expect(screen.queryByLabelText('commit--1')).toBeNull();

    for(const order of relevantActivityOrders ){
      if(order.ordered_time_slot === 1){
        expect(screen.getByText(`ID: ${order.id}`)).toBeVisible();
      }
    }
  });


  it("Create an New order", async () => {
    render(
      <TracerShopContext tracershop_state={testState} websocket={websocket}>
        <TimeSlotCardActivity {...props} />
      </TracerShopContext>
    );

  const openButton = screen.getByLabelText(`open-time-slot-${default_time_slot_id}`);

  act(() => {
    fireEvent.click(openButton);
  });

  const activityInput = screen.getByTestId('activity--1');
  const commentInput = screen.getByTestId('comment--1');
  act(() => {
    fireEvent.change(activityInput, {target : {value : "40000"}})
    fireEvent.change(commentInput, {target : {value : "test comment"}})
  });

  const commitButton = screen.getByLabelText('commit--1');
  await act(async () => {
    fireEvent.click(commitButton);
  });

  expect(websocket.sendCreateModel).toHaveBeenCalledWith(DATA_ACTIVITY_ORDER,expect.objectContaining({
      ordered_activity : 40000,
      ordered_time_slot : default_time_slot_id,
      moved_to_time_slot : null,
      status : 1,
      comment : "test comment"
    }));
  });

  it("Fail to create New order", async () => {
    render(
      <TracerShopContext tracershop_state={testState} websocket={websocket}>
        <TimeSlotCardActivity {...props} />
      </TracerShopContext>
    );

  act(() => {
    screen.getByLabelText(`open-time-slot-${default_time_slot_id}`).click()
  });

  const activityInput = screen.getByTestId('activity--1');
  const commentInput = screen.getByTestId('comment--1');
  act(() => {
    fireEvent.change(activityInput, {target : {value : "4asdgf0000"}})
    fireEvent.change(commentInput, {target : {value : "test comment"}})
  });

  await act(async () => {
    screen.getByLabelText('commit--1').click();
  });

  expect(websocket.sendCreateModel).not.toHaveBeenCalled();

  act(() => {
    fireEvent.mouseEnter(activityInput);
  });
  // expect(screen.getByText("Aktiviten er ikke et tal")).toBeVisible();

  });

  it.skip("Open the calculator", () => {
    render(
      <TracerShopContext tracershop_state={testState} websocket={websocket}>
        <TimeSlotCardActivity {...props} />
      </TracerShopContext>
    );

    const openCalculatorButton = screen.getByLabelText(`open-calculator-${default_time_slot_id}`);

    act(() => {
      fireEvent.click(openCalculatorButton);
    });

    expect(screen.getByLabelText(CALCULATOR_NEW_ACTIVITY_LABEL)).toBeVisible();
    expect(screen.getByLabelText(CALCULATOR_NEW_TIME_LABEL)).toBeVisible();
  });

  it.skip("use the calculator", () => {
    render(
      <TracerShopContext tracershop_state={testState} websocket={websocket}>
        <TimeSlotCardActivity {...props} />
      </TracerShopContext>
    );

    const openTimeSlotButton = screen.getByLabelText(`open-time-slot-${default_time_slot_id}`);
    const openCalculatorButton = screen.getByLabelText(`open-calculator-${default_time_slot_id}`);

    act(() => {
      fireEvent.click(openTimeSlotButton);
      fireEvent.click(openCalculatorButton);
    });

    const activityInput = screen.getByLabelText(CALCULATOR_NEW_ACTIVITY_LABEL);
    const time_input = screen.getByLabelText(CALCULATOR_NEW_TIME_LABEL);

    const default_time_slot = testState.deliver_times.get(default_time_slot_id);

    act(() => {
      fireEvent.change(activityInput, {target : {value : "5000"}});
      fireEvent.change(time_input, {target : {value : default_time_slot.delivery_time}});
    });

    const calculatorAddButton = screen.getByAltText("Tilføj");

    act(() => {
      fireEvent.click(calculatorAddButton);
    })

    act(() => {
      fireEvent.click(screen.queryByRole('button', {name: 'Udregn'}))
    });

    const timeSlotActivityInput = screen.getByTestId('activity--1');

    expect(timeSlotActivityInput.value).toBe("5000");
  });


  it("Render a status 3 order, get pdf", () => {
    props[PROP_TIME_SLOT_ID] = 4

    props['activityOrders'] = [testState.activity_orders.get(6)]

    render(
      <TracerShopContext tracershop_state={testState} websocket={websocket}>
        <TimeSlotCardActivity {...props} />
      </TracerShopContext>
    );

    const openButton = screen.getByLabelText("open-time-slot-4");

    act(() => {
      fireEvent.click(openButton);
    });

    const pdfButton = screen.getByLabelText('delivery-4');

    act(() => {
      fireEvent.click(pdfButton);
    })
  })
})
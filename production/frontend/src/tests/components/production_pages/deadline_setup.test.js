/**
 * @jest-environment jsdom
 */

import React from "react";
import { act, fireEvent, render, screen, cleanup } from "@testing-library/react"


import { DEADLINE_TYPES  } from "~/lib/constants.js";
import { DATA_DEADLINE, DATA_SERVER_CONFIG } from "~/lib/shared_constants.js";
import { testState } from "../../app_state";

import { DeadlineSetup, GlobalDeadlineValuesOptions } from "~/components/production_pages/setup_pages/deadline_setup.js";
import userEvent from "@testing-library/user-event";
import { TracerShopContext } from "~/contexts/tracer_shop_context.js";
const module = jest.mock('../../../lib/tracer_websocket.js');
const tracer_websocket = require("../../../lib/tracer_websocket.js");


let websocket = null;

beforeAll(() => {
  jest.useFakeTimers('modern')
  jest.setSystemTime(new Date(2020,4, 4, 10, 36, 44))
})

beforeEach(() => {
    websocket = tracer_websocket.TracerWebSocket
});

afterEach(() => {
  cleanup()
  module.clearAllMocks()
  window.localStorage.clear();
});


describe("Deadline Setup tests", () => {
  it("Standard render test", () => {
    render(
      <TracerShopContext tracershop_state={testState} websocket={websocket}>
        <DeadlineSetup/>
      </TracerShopContext>
    );
  });

  it("Change deadline Type", async () => {
    render(
      <TracerShopContext tracershop_state={testState} websocket={websocket}>
        <DeadlineSetup/>
      </TracerShopContext>
    );

    await act(async () => {
      const input = await screen.findByLabelText('type-1')
      fireEvent.change(input, {target : {value : "1"}})
      fireEvent.click(await screen.findByLabelText("commit-1"));
    })

    expect(websocket.sendEditModels).toHaveBeenCalledWith(DATA_DEADLINE, expect.objectContaining({
      id : 1,
      deadline_type : DEADLINE_TYPES.WEEKLY,
      deadline_time : "12:00:00",
      deadline_day : null,
    }));

  })

  // This test is trivially ensure and kinda legacy because the confirmation method changed
  it("Change deadline Type to same value", async () => {
    render(
      <TracerShopContext tracershop_state={testState} websocket={websocket}>
        <DeadlineSetup/>
      </TracerShopContext>
    );

    await act(async () => {
      const input = await screen.findByLabelText('type-1')
      fireEvent.change(input, {target : {value : "0"}})
    })

    expect(websocket.sendEditModels).not.toHaveBeenCalled();
  })

  it("Change deadline time", async () => {
    render(
      <TracerShopContext tracershop_state={testState} websocket={websocket}>
        <DeadlineSetup/>
      </TracerShopContext>
    );

    await act(async () => {
      const input = await screen.findByLabelText('time-1');

      fireEvent.change(input, {target : {value : ""}});
      expect(input.value).toBe("");
      fireEvent.change(input, {target : {value : "1"}});
      expect(input.value).toBe("1");
      fireEvent.change(input, {target : {value : "12"}});
      expect(input.value).toBe("12");
      fireEvent.change(input, {target : {value : "123"}});
      expect(input.value).toBe("12:3");
      fireEvent.change(input, {target : {value : "12:30"}});
      expect(input.value).toBe("12:30");
      fireEvent.change(input, {target : {value : "12:300"}});
      expect(input.value).toBe("12:30:0");
      fireEvent.change(input, {target : {value : "12:30:00"}});
      expect(input.value).toBe("12:30:00");

      fireEvent.click(await screen.findByLabelText("commit-1"));
    })

    expect(websocket.sendEditModels).toHaveBeenCalledWith(DATA_DEADLINE,
      expect.objectContaining({
        id : 1,
        deadline_type : DEADLINE_TYPES.DAILY,
        deadline_time : "12:30:00",
        deadline_day : null,
      })
      )
  });


  it("Change deadline not a time ", async () => {
    render(
      <TracerShopContext tracershop_state={testState} websocket={websocket}>
        <DeadlineSetup/>
      </TracerShopContext>
    );

    await act(async () => {
      const input = await screen.findByLabelText('time-1')

      fireEvent.change(input, {target : {value : ""}});
      expect(input.value).toBe("");
    })

    expect(websocket.sendEditModels).not.toHaveBeenCalled();
  });

  it("Change deadline time", async () => {
    render(
      <TracerShopContext tracershop_state={testState} websocket={websocket}>
        <DeadlineSetup/>
      </TracerShopContext>
    );

    await act(async () => {
      const input = await screen.findByLabelText('days-2')
      fireEvent.change(input, {target : {value : "2"}})
      fireEvent.click(await screen.findByLabelText("commit-2"));
    })
    expect(websocket.sendEditModels).toHaveBeenCalledWith(DATA_DEADLINE,expect.objectContaining({
      id : 2,
      deadline_type : DEADLINE_TYPES.WEEKLY,
      deadline_time : "12:00:00",
      deadline_day : 2,
    }));
  });

  it("Change day to same value", async () => {
    render(
      <TracerShopContext tracershop_state={testState} websocket={websocket}>
        <DeadlineSetup/>
      </TracerShopContext>
    );

    await act(async () => {
      const input = await screen.findByLabelText('days-2')
      fireEvent.change(input, {target : {value : "3"}})
    })

    expect(websocket.sendEditModels).not.toHaveBeenCalled();
  });

  it("Change Deadline to Global", async () => {
    render(
      <TracerShopContext tracershop_state={testState} websocket={websocket}>
        <DeadlineSetup/>
      </TracerShopContext>
    );

    await act(async () => {
      const input = await screen.findByLabelText('global-3')
      fireEvent.change(input, {target : {value : `${GlobalDeadlineValuesOptions.NO_OPTION}`}})
    })

    expect(websocket.sendEditModels).not.toHaveBeenCalled();
  })

  it("Change Deadline to Global Activity deadline", async () => {
    render(
      <TracerShopContext tracershop_state={testState} websocket={websocket}>
        <DeadlineSetup/>
      </TracerShopContext>
    );

    await act(async () => {
      const input = await screen.findByLabelText('global-3')
      fireEvent.change(input, {target : {value : `${GlobalDeadlineValuesOptions.GLOBAL_ACTIVITY_DEADLINE}`}})
    })

    expect(websocket.sendEditModels).toHaveBeenCalledWith(DATA_SERVER_CONFIG, expect.objectContaining({
      global_activity_deadline : 3,
    }));
  });

  it("Change Deadline to Global Injection deadline", async () => {
    render(
      <TracerShopContext tracershop_state={testState} websocket={websocket}>
        <DeadlineSetup/>
      </TracerShopContext>
    );

    await act(async () => {
      const input = await screen.findByLabelText('global-3')
      fireEvent.change(input, {target : {value : `${GlobalDeadlineValuesOptions.GLOBAL_INJECTION_DEADLINE}`}})
    });

    expect(websocket.sendEditModels).toHaveBeenCalledWith(DATA_SERVER_CONFIG, expect.objectContaining({
      global_injection_deadline : 3,
    }));
  });

  it("create new deadline success", async () => {
    render(
      <TracerShopContext tracershop_state={testState} websocket={websocket}>
        <DeadlineSetup/>
      </TracerShopContext>
    );

    await act(async () => {
      const inputTime = await screen.findByLabelText('time--1')
      fireEvent.change(inputTime, {target : {value : "12:30:00"}})
      fireEvent.click(await screen.findByLabelText("commit--1"));
    })

    expect(websocket.sendCreateModel).toHaveBeenCalledWith(DATA_DEADLINE, expect.objectContaining({
      deadline_type : DEADLINE_TYPES.DAILY,
      deadline_time : "12:30:00",
    }))
  })

  it("create new weekly deadline success", async () => {
    render(
      <TracerShopContext tracershop_state={testState} websocket={websocket}>
        <DeadlineSetup/>
      </TracerShopContext>
    );

    await act(async () => {
      const inputTime = await screen.findByLabelText('time--1')
      fireEvent.change(inputTime, {target : {value : "12:30:00"}})
      const inputType = await screen.findByLabelText('type--1')
      fireEvent.change(inputType, {target : {value : "1"}})
      fireEvent.click(await screen.findByLabelText("commit--1"));
    })

    expect(websocket.sendCreateModel).toHaveBeenCalledWith(DATA_DEADLINE, expect.objectContaining({
      deadline_type : DEADLINE_TYPES.WEEKLY,
      deadline_time : "12:30:00",
    }))
  })


  it("create new deadline failure", async () => {
    render(
      <TracerShopContext tracershop_state={testState} websocket={websocket}>
        <DeadlineSetup/>
      </TracerShopContext>
    );

    await act(async () => {
      const inputTime = await screen.findByLabelText('time--1');
      fireEvent.change(inputTime, {target : {value : "12:aa:00"}});
      fireEvent.click(await screen.findByLabelText("commit--1"));
    })

    expect(websocket.sendCreateModel).not.toHaveBeenCalled();

    await act(async () => {
      const inputTime = await screen.findByLabelText('time--1');
      userEvent.hover(inputTime);
    });

    expect(await screen.findByText("Deadline tidspunktet er ikke formattet som et tidspunkt"));
  })
});

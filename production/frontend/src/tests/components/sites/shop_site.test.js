/**
 * @jest-environment jsdom
 */

import React from "react";

import { act, screen, render, cleanup, fireEvent, waitFor } from "@testing-library/react";
import { jest, afterEach, beforeEach, describe, it, expect } from '@jest/globals'
import { AppState, getModifiedTestState, testState } from "../../app_state";

import ShopSite from "../../../components/sites/shop_site";
import { users } from "../../test_state/users";
import { TracerShopContext } from "~/contexts/tracer_shop_context";
import { TracershopState } from "~/dataclasses/dataclasses";
import { UpdateToday } from "~/lib/state_actions";
import { DATA_ISOTOPE_ORDER } from "~/lib/shared_constants";

const module = jest.mock('../../../lib/tracer_websocket');
const tracer_websocket = require("../../../lib/tracer_websocket");
const logout = jest.fn();

let websocket = tracer_websocket.TracerWebSocket;

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date(2020,4,5,9,31,12));
})


afterEach(() => {
  cleanup();
  module.clearAllMocks()
  window.localStorage.clear()
  jest.useRealTimers()
});

describe("Shop shop test suite", () => {
  it("standard test - render test Site Admin", async () => {
    await waitFor (async () => {render(
      <TracerShopContext websocket={websocket} tracershop_state={testState}>
        <ShopSite logout={logout} />
      </TracerShopContext>
    ); })
  });


  it("standard test - shop admin", async () => {
    const newState = Object.assign(new TracershopState(), {
      ...testState,
      logged_in_user : users.get(4),
    });

    await waitFor(() => {
      render(
        <TracerShopContext tracershop_state={newState} websocket={websocket}>
        <ShopSite logout={logout}/>
      </TracerShopContext>
    );
    })
    expect(screen.queryByLabelText("no-assoc-internal-user-error")).toBeNull();
  });

  it("standard test - shop internal", async () => {
    const newState = Object.assign(new TracershopState(), {
      ...testState,
      logged_in_user : users.get(5),
    });
    await act(async () => render(
      <TracerShopContext tracershop_state={newState} websocket={websocket}>
        <ShopSite logout={logout}/>
      </TracerShopContext>
    ));
    expect(screen.queryByLabelText("no-assoc-internal-user-error")).toBeNull();
  });

  it("standard test - external", async () => {
    const newState = Object.assign(new TracershopState(), {
      ...testState,
      logged_in_user : users.get(6),
    });
    await act(async () => {
      render(
        <TracerShopContext tracershop_state={newState} websocket={websocket}>
          <ShopSite logout={logout}/>
        </TracerShopContext>
    )});

    expect(screen.queryByLabelText("no-assoc-external-user-error")).toBeNull();
  });

  it("standard test - no associated customer admin", async () => {
    const newState = Object.assign(new TracershopState(), {
      ...testState,
      logged_in_user : users.get(7),
    });

    render(<TracerShopContext tracershop_state={newState} websocket={websocket}>
      <ShopSite logout={logout}/>
    </TracerShopContext>);

    expect(await screen.findByLabelText("no-assoc-internal-user-error")).toBeVisible()
  });

  it("standard test - no associated customer internal", async () => {
    const newState = Object.assign(new TracershopState(), {
      ...testState,
      logged_in_user : users.get(8),
    });

    render(
      <TracerShopContext tracershop_state={newState} websocket={websocket}>
        <ShopSite logout={logout}/>
      </TracerShopContext>);

    expect(await screen.findByLabelText("no-assoc-internal-user-error")).toBeVisible()
  });

  it("standard test - no associated customer external", async () => {
    const newState = Object.assign(new TracershopState(), {
      ...testState,
      logged_in_user : users.get(9),
    });

    await act(async () => {
      render(
        <TracerShopContext tracershop_state={newState} websocket={websocket}>
          <ShopSite logout={logout}/>
        </TracerShopContext>
      );
    })

    expect(screen.getByLabelText("no-assoc-external-user-error")).toBeVisible()
  });

  it("standard test - Some how a production member is viewing customer data", async () => {
    const newState = Object.assign(new TracershopState(), {
      ...testState,
      logged_in_user : users.get(2),
    });

    await act(async () => {
      render(
        <TracerShopContext tracershop_state={newState} websocket={websocket}>
          <ShopSite logout={logout}/>
        </TracerShopContext>
      );
    })

    expect(screen.getByLabelText("no-assoc-internal-user-error")).toBeVisible()
  });

  it("end 2 end order isotope", async () => {
    const dispatchMock = jest.fn((arg) => {
      return new UpdateToday(
        new Date("2020-05-16"), websocket
      );
    });


    const {rerender} = await waitFor(() => {
      return render(
        <TracerShopContext tracershop_state={testState} websocket={websocket} dispatch={dispatchMock}>
          <ShopSite logout={logout}/>
        </TracerShopContext>
      );
    });

    /*await act( async () => {
      fireEvent.click(screen.getByLabelText('navbar-orders'))
    })
      */

    await act(async () => {
      fireEvent.click(screen.getByRole('button', {name : /Ba-139/}));
    });

    await act(async () => {
      fireEvent.click(screen.getByLabelText('calender-day-19'));
    });

    const modTestState = getModifiedTestState({today : new Date(2020, 5, 23, 12, 0, 0)});

    rerender(
      <TracerShopContext tracershop_state={modTestState} websocket={websocket} dispatch={dispatchMock}>
        <ShopSite logout={logout}/>
      </TracerShopContext>
    );


    await act(async () => {
      fireEvent.click(screen.getByTestId("open-isotope-timeslot-2"));
    });

    await act(async () => {
      fireEvent.change(screen.getByTestId("form-activity-2"), { target : { value : "10000"}})
    })

    await act(async () => {
      fireEvent.click(screen.getByTestId("action-isotope-2"))
    })

    expect(websocket.sendCreateModel).toHaveBeenCalledWith(DATA_ISOTOPE_ORDER, expect.objectContaining({
      ordered_activity_MBq : 10000,
      destination : 2
    }))

  });
})
/**
 * @jest-environment jsdom
 */

import React from "react";

import { act, screen, render, cleanup, fireEvent } from "@testing-library/react";
import { jest } from '@jest/globals'
import { AppState, testState } from "../../app_state.js";

import { ShopSite } from "../../../components/sites/shop_site.js";
import { users } from "../../test_state/users.js";
import { TracerShopContext } from "~/contexts/tracer_shop_context.js";
import { TracershopState } from "~/dataclasses/dataclasses.js";

const module = jest.mock('../../../lib/tracer_websocket.js');
const tracer_websocket = require("../../../lib/tracer_websocket.js");
const logout = jest.fn();

let websocket = null;


afterEach(() => {
  cleanup();
  module.clearAllMocks()
  window.localStorage.clear()
});

describe("Shop shop test suite", () => {
  it("standard test - render test Site Admin", async () => {
    await act(async () => { // Theres a useEffect that have to catch this
      render(<TracerShopContext websocket={websocket} tracershop_state={testState}>
               <ShopSite logout={logout} />
             </TracerShopContext>
            );
    });
  });


  it("standard test - shop admin", async () => {
    const newState = Object.assign(new TracershopState(), {
      ...testState,
      logged_in_user : users.get(4),
    });

    render(
      <TracerShopContext tracershop_state={newState} websocket={websocket}>
        <ShopSite logout={logout}/>
      </TracerShopContext>
    );
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
})
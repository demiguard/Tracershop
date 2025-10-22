/**
 * @jest-environment jsdom
 */

import React from "react";

import { act, screen, render, cleanup, fireEvent, waitFor } from "@testing-library/react";
import { jest } from '@jest/globals'
import { AppState, testState } from "../../app_state";

import { ShopSite } from "../../../components/sites/shop_site";
import { users } from "../../test_state/users";
import { TracerShopContext } from "~/contexts/tracer_shop_context";
import { TracershopState } from "~/dataclasses/dataclasses";

const module = jest.mock('../../../lib/tracer_websocket');
const tracer_websocket = require("../../../lib/tracer_websocket");
const logout = jest.fn();

let websocket = tracer_websocket.TracerWebSocket;


afterEach(() => {
  cleanup();
  module.clearAllMocks()
  window.localStorage.clear()
});

describe("Shop shop test suite", () => {
  it("standard test - render test Site Admin", async () => {
    await waitFor(async () => { // Theres a useEffect that have to catch this
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
    await waitFor(() => {
      render(
        <TracerShopContext tracershop_state={testState} websocket={websocket}>
          <ShopSite logout={logout}/>
        </TracerShopContext>
      );
    });

    await act( async () => {
      fireEvent.click(screen.getByLabelText('navbar-orders'))
    })

    await act(async () => {
      fireEvent.click(screen.getByRole('button', {name : /Ba-139/}))
    });



  });
})
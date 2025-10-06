/**
 * @jest-environment jsdom
 */

import React from "react";

import { act, screen, render, cleanup, fireEvent } from "@testing-library/react";
import { jest } from '@jest/globals'
import { testState } from "../../app_state";
import { TracerShop } from "../../../components/sites/tracer_shop"
import { ANON, users } from "../../test_state/users";
import { TracerShopContext } from "~/contexts/tracer_shop_context";
import { TracershopState } from "~/dataclasses/dataclasses";

const module = jest.mock('../../../lib/tracer_websocket');
const tracer_websocket = require("../../../lib/tracer_websocket");

const dispatchMock = jest.fn();

const websocket = tracer_websocket.TracerWebSocket;
const now = new Date(2020,4, 4, 10, 36, 44)

beforeEach(() => {
  jest.useFakeTimers('modern')
  jest.setSystemTime(now)
  delete window.location
  window.location = { href : "tracershop"}
});

afterEach(() => {
  cleanup();
  module.clearAllMocks()
  window.localStorage.clear()
});

describe("Tracer shop test suite", () => {
  it("Standard Render test ANON", () => {
    const newState = Object.assign(new TracershopState(), {
      ...testState,
      logged_in_user : ANON,
    })

    render(
      <TracerShopContext
        tracershop_state={newState}
        websocket={websocket}
        dispatch={dispatchMock}>
        <TracerShop/>
      </TracerShopContext>
    );
  })

  it("standard test Site admin", () => {
    const newState = Object.assign(new TracershopState(), {
      ...testState,
      logged_in_user : users.get(1),
    })

    render(
      <TracerShopContext tracershop_state={newState} websocket={websocket} dispatch={dispatchMock}>
        <TracerShop/>
      </TracerShopContext>
    );
  })

  it("standard test Production Admin", () => {
    const newState = Object.assign(new TracershopState(), {
      ...testState,
      logged_in_user : users.get(2),
    })

    render(
      <TracerShopContext tracershop_state={newState} websocket={websocket} dispatch={dispatchMock}>
        <TracerShop/>
      </TracerShopContext>
    );
  })

  it("standard test Production user", () => {
    const newState = Object.assign(new TracershopState(), {
      ...testState,
      logged_in_user : users.get(3),
    })

    render(
      <TracerShopContext tracershop_state={newState} websocket={websocket} dispatch={dispatchMock}>
        <TracerShop/>
      </TracerShopContext>
    );
  })

  it("standard test Shop Admin", async () => {
    const newState = Object.assign(new TracershopState(), {
      ...testState,
      logged_in_user : users.get(4),
    })

    await act(async () => {
      render(
        <TracerShopContext tracershop_state={newState} websocket={websocket} dispatch={dispatchMock}>
          <TracerShop/>
        </TracerShopContext>
      );
    });
  })

  it("standard test shop user", async () => {
    const newState = Object.assign(new TracershopState(), {
      ...testState,
      logged_in_user : users.get(5),
    })
    await act(async () => {
      render(
        <TracerShopContext tracershop_state={newState} websocket={websocket} dispatch={dispatchMock}>
          <TracerShop/>
        </TracerShopContext>
      );
    });
  });

  it("standard test shop external", async () => {
    const newState = Object.assign(new TracershopState(), {
      ...testState,
      logged_in_user : users.get(6),
    })

    await act(async () => {
      render(
        <TracerShopContext tracershop_state={newState} websocket={websocket} dispatch={dispatchMock}>
          <TracerShop/>
        </TracerShopContext>
      );
    })
  })
})

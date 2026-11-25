/**
 * @jest-environment jsdom
 */

import React from "react";

import { act, screen, render, cleanup, fireEvent } from "@testing-library/react";
import { jest } from '@jest/globals'
import { AppState, getModifiedTestState, testState } from "~/tests/app_state";

import { PROP_USER } from "~/lib/constants";
import ProductionSite from "~/components/sites/production_site";
import { users } from "~/tests/test_state/users";
import { TracerShopContext } from "~/contexts/tracer_shop_context";
import { TracershopState } from "~/dataclasses/dataclasses";

const module = jest.mock('../../../lib/tracer_websocket');
const tracer_websocket = require("../../../lib/tracer_websocket");

const logout = jest.fn();

let websocket = null;
let props = null;

const now = new Date(2020,4, 4, 10, 36, 44);


beforeEach(() => {
  jest.useFakeTimers('modern');
  jest.setSystemTime(now);
  websocket = new tracer_websocket.TracerWebSocket();
  props = { ...AppState };
  props[PROP_USER] = users.get(1);
});


afterEach(() => {
  cleanup();
  module.clearAllMocks()
  window.localStorage.clear()
  websocket = null;
  props = null;
});

describe("Production site test suite", () => {
  it("standard test - Admin", () => {
    render(
      <TracerShopContext tracershop_state={testState} websocket={websocket}>
        <ProductionSite logout={logout} NavbarElements={[]} />
      </TracerShopContext>
    );

    expect(screen.getByRole('button',{name : "Ordre"})).toBeVisible();
    expect(screen.getByRole('button',{name : "Hætteglas"})).toBeVisible();
    expect(screen.getByRole('button',{name : "Opsætning"})).toBeVisible();
  });

  it("standard test - user", () => {
    const newState = getModifiedTestState({
      logged_in_user : users.get(3)
    });

    render(
      <TracerShopContext tracershop_state={newState} websocket={websocket}>
        <ProductionSite logout={logout} NavbarElements={[]} />
      </TracerShopContext>
    );

    expect(screen.getByRole('button',{name :'Ordre'})).toBeVisible();
    expect(screen.getByRole('button',{name :'Hætteglas'})).toBeVisible();
    expect(screen.queryByRole('button',{name : 'Opsætning'})).toBeNull();
  });

})
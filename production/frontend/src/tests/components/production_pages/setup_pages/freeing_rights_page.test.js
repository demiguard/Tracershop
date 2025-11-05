/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen, cleanup, fireEvent, act } from "@testing-library/react";
import { FreeingRightsPage } from "~/components/production_pages/setup_pages/freeing_rights_page";
import { TracerShopContext } from "~/contexts/tracer_shop_context";
import { testState } from "~/tests/app_state";
import { USER_GROUPS } from "~/lib/constants";


const module = jest.mock('../../../../lib/tracer_websocket.js');
const tracer_websocket = require("../../../../lib/tracer_websocket.js");

let websocket = null;

beforeAll(() => {
  jest.useFakeTimers('modern');
  jest.setSystemTime(new Date(2020,4, 4, 10, 36, 44));
})

beforeEach(() => {
    websocket = tracer_websocket.TracerWebSocket;
});

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  module.clearAllMocks();
});

describe("Freeing Rights Page test suite", () => {
  it("Standard Render Test", () => {
    render(
      <TracerShopContext tracershop_state={testState} websocket={websocket}>
        <FreeingRightsPage/>
      </TracerShopContext>
    );

    // Test if users are there
    for(const user of testState.user.values()){
      if([USER_GROUPS.PRODUCTION_ADMIN, USER_GROUPS.PRODUCTION_USER].includes(user.user_group)){
        expect(screen.getAllByText(user.username).length).toBeGreaterThanOrEqual(1);
      } else {
        expect(screen.queryByText(user.username)).toBeNull();
      }
    }

    expect(screen.getByLabelText('new-user-select')).toBeVisible();
    expect(screen.getByLabelText('new-tracer-select')).toBeVisible();
    expect(screen.getByLabelText('new-expiry-date')).toBeVisible();
    expect(screen.getByLabelText('create-release-right')).toBeVisible();
    expect(screen.getByLabelText("open-existing-rights")).toBeVisible();
    expect(screen.getByLabelText('sort-user')).toBeVisible();
    expect(screen.getByLabelText('sort-tracer')).toBeVisible();
    expect(screen.getByLabelText('sort-expiry-date')).toBeVisible();
  });

  it("Create an a freeing Right", async () => {
    render(
      <TracerShopContext tracershop_state={testState} websocket={websocket}>
        <FreeingRightsPage/>
      </TracerShopContext>
    );

    const newUserInput = screen.getByLabelText('new-user-select');
    const newTracerInput = screen.getByLabelText('new-tracer-select');
    const newExpiryDateInput = screen.getByLabelText('new-expiry-date');

    act(() => {
      fireEvent.change(newUserInput, {target: {value: 3}});
      fireEvent.change(newTracerInput, {target: {value: 1}});
      fireEvent.change(newExpiryDateInput, {target: {value: "2020-10-16"}});
    });
    const createButton = screen.getByLabelText('create-release-right');
    await act(async () => {
      fireEvent.click(createButton);
    });
    expect(websocket.sendCreateModel).toBeCalled();
  });

  it("Create an a freeing Right without expiry date", async () => {
    render(
      <TracerShopContext tracershop_state={testState} websocket={websocket}>
        <FreeingRightsPage/>
      </TracerShopContext>
    );

    const newUserInput = screen.getByLabelText('new-user-select');
    const newTracerInput = screen.getByLabelText('new-tracer-select');

    act(() => {
      fireEvent.change(newUserInput, {target: {value: 3}});
      fireEvent.change(newTracerInput, {target: {value: 1}});
    });
    const createButton = screen.getByLabelText('create-release-right');
    await act(async () => {
      fireEvent.click(createButton);
    });
    expect(websocket.sendCreateModel).toBeCalled();
  });

  it("Failed to create an a freeing Right", async () => {
    render(
      <TracerShopContext tracershop_state={testState} websocket={websocket}>
        <FreeingRightsPage/>
      </TracerShopContext>
    );

    const newUserInput = screen.getByLabelText('new-user-select');
    const newTracerInput = screen.getByLabelText('new-tracer-select');
    const newExpiryDateInput = screen.getByLabelText('new-expiry-date');

    act(() => {
      fireEvent.change(newUserInput, {target: {value: 3}});
      fireEvent.change(newTracerInput, {target: {value: 1}});
      fireEvent.change(newExpiryDateInput, {target: {value: "2a20-10-16"}});
    });
    const createButton = screen.getByLabelText('create-release-right');
    await act(async () => {
      fireEvent.click(createButton);
    });
    expect(websocket.sendCreateModel).not.toBeCalled();
  });

  it("Delete Release Right", async () => {
    render(
      <TracerShopContext tracershop_state={testState} websocket={websocket}>
        <FreeingRightsPage/>
      </TracerShopContext>
    );

    const openButton = screen.getByLabelText("open-existing-rights");

    act(() => {
      openButton.click();
    });

    const deleteButton = screen.getByLabelText("delete-release-right-1")

    await act(async () => {
      deleteButton.click()
    })

    expect(websocket.sendDeleteModels).toBeCalled();
  });

  it("Change Sorting Methods", () => {
    render(
      <TracerShopContext tracershop_state={testState} websocket={websocket}>
        <FreeingRightsPage/>
      </TracerShopContext>
    );

  const sorting_user = screen.getByLabelText('sort-user');
  const sorting_tracer = screen.getByLabelText('sort-tracer');
  const sorting_expiry_date = screen.getByLabelText('sort-expiry-date');

  act(() => {
    sorting_user.click();
  });

  //TODO: check Sorting order

  act(() => {
    sorting_tracer.click();
  });

  //TODO: check Sorting order

  act(() => {
    sorting_expiry_date.click();
  });
  //TODO: check Sorting order
  });
});

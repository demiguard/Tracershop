/**
 * @jest-environment jsdom
 */

import React from "react";
import { act, screen, render, cleanup, fireEvent } from "@testing-library/react";
import { jest } from '@jest/globals'
import { HistoryModal } from "../../../components/modals/history_modal.js";
import { TracerShopContext } from "~/contexts/tracer_shop_context.js";
import { testState } from "~/tests/app_state.js";
import { WEBSOCKET_DATA } from "~/lib/shared_constants.js";

const module = jest.mock('../../../lib/tracer_websocket.js');
const tracer_websocket = require("../../../lib/tracer_websocket.js");

const onClose = jest.fn();

const websocket = tracer_websocket.TracerWebSocket;

beforeEach(() => {
});

afterEach(() => {
  cleanup();
  module.clearAllMocks()
});


describe("History modal test suite", () => {
  it("Standard Render test", () => {
    render(
      <TracerShopContext tracershop_state={testState} websocket={websocket}>
        <HistoryModal
          active_customer={1}
          on_close={onClose}
        />
      </TracerShopContext>
    );
  });

  it("Get History button press, Loading", async () => {
    const resolvingWebsocket = {
      getMessage : jest.fn((input) => {return {
        WEBSOCKET_MESSAGE_TYPE : input
      }}),
      send : jest.fn((message) => {return new Promise(async function(resolve) {})})
    }
    render(
      <TracerShopContext tracershop_state={testState} websocket={resolvingWebsocket}>
        <HistoryModal
          active_customer={1}
          on_close={onClose}
        />
      </TracerShopContext>
    );

    await act(async () => {
      fireEvent.click(screen.getByRole('button', {name : "Hent historik"}));
    })

    expect(screen.getByText("Loading"));
  });

  it("Resolving History fetching", async () => {
    const resolvingWebsocket = {
      getMessage : jest.fn((input) => {return {
        WEBSOCKET_MESSAGE_TYPE : input
      }}),
      send : jest.fn((message) => {
        return new Promise(async function(resolve) {resolve({
          [WEBSOCKET_DATA] : {
            "1" : []
          }
        })});
      })
    }

    render(
      <TracerShopContext tracershop_state={testState} websocket={resolvingWebsocket}>
        <HistoryModal
          active_customer={1}
          on_close={onClose}
        />
      </TracerShopContext>
    );

    await act(async () => { // The extra Act is needed because the modal depends on the websocket response.
      // Therefore an extra update is triggered which this act catches.
      screen.getByRole('button', {name : "Hent historik"}).click();
    });

    const date = new Date();
    expect(screen.getByText(`Der er ingen ordre i ${date.getMonth() + 1}/${date.getFullYear()}`));
  });

  it("Reset history", async () => {
    const resolvingWebsocket = {
      getMessage : jest.fn((input) => {return {
        WEBSOCKET_MESSAGE_TYPE : input
      }}),
      send : jest.fn((message) => {
        return new Promise(async function(resolve) {resolve({
          data : {
            "1" : []
          }
        })});
      })
    }
    render(
      <TracerShopContext tracershop_state={testState} websocket={resolvingWebsocket}>
        <HistoryModal
          active_customer={1}
          on_close={onClose}
        />
      </TracerShopContext>
    );


    await act(async () => {
      const getHistoryButton = screen.getByRole('button', {name : "Hent historik"});
      fireEvent.click(getHistoryButton);
    });

    await act( async () => {
      fireEvent.click(screen.getByRole('button', {name: "Ny Historik"}))
    });

    expect(screen.getByRole('button', {name : "Hent historik"})).toBeVisible();
    expect(screen.getByLabelText("month-selector")).toBeVisible();
    expect(screen.getByLabelText("year-selector")).toBeVisible();
  });

  it("Resolving History with data", async () => {
    const resolvingWebsocket = {
      getMessage : jest.fn((input) => {return {
        WEBSOCKET_MESSAGE_TYPE : input
      }}),
      send : jest.fn((message) => {
        return new Promise(async function(resolve) {resolve({
          data : {
            "1" : [
              [1, "test-111111-1", "2023-02-01 08:00:00", 6381, 7423],
              [2, "test-111111-2", "2023-02-01 11:00:00", 2752, 3411]
            ],
            "2" : [
              [1, "test-111111-1", "2023-02-01 09:15:00", 2, 1],
              [2, "test-111111-2", "2023-02-01 10:00:00", 2, 2]
            ],
          }
        })});
      })
    }
    render(
      <TracerShopContext tracershop_state={testState} websocket={resolvingWebsocket}>
        <HistoryModal
          active_customer={1}
          on_close={onClose}
        />
      </TracerShopContext>
    );


    await act(async () => {
      fireEvent.click(screen.getByRole('button', {name : "Hent historik"}));
    });
    expect(await screen.findByText("Download")).toBeVisible();
  });
});

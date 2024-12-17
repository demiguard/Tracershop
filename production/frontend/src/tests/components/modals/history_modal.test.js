/**
 * @jest-environment jsdom
 */

import React from "react";
import { act, screen, render, cleanup, fireEvent, waitFor, queryByAttribute } from "@testing-library/react";
import { jest } from '@jest/globals'

import { HistoryModal } from "../../../components/modals/history_modal.js";
import { StateContextProvider, WebsocketContextProvider } from "~/contexts/tracer_shop_context.js";
import { testState } from "~/tests/app_state.js";
import { WEBSOCKET_DATA } from "~/lib/shared_constants.js";


const module = jest.mock('../../../lib/tracer_websocket.js');
const tracer_websocket = require("../../../lib/tracer_websocket.js");

const onClose = jest.fn();

const websocket = tracer_websocket.TracerWebSocket;

beforeEach(() => {
  delete window.location
  window.location = { href : "tracershop" }
});

afterEach(() => {
  cleanup();
  module.clearAllMocks()
});


describe("History modal test suite", () =>{
  it("Standard Render test", () => {
    render(<StateContextProvider value={testState}>
      <WebsocketContextProvider value={websocket}>
        <HistoryModal
          active_customer={1}
          on_close={onClose}
        />
      </WebsocketContextProvider>
    </StateContextProvider>);
  });

  it("Get History button press, Loading", async () => {
    const ResolvingWebsocket = {
      getMessage : jest.fn((input) => {return {
        WEBSOCKET_MESSAGE_TYPE : input
      }}),
      send : jest.fn((message) => {return new Promise(async function(resolve) {})})
    }
    render(<StateContextProvider value={testState}>
      <WebsocketContextProvider value={ResolvingWebsocket}>
        <HistoryModal
          active_customer={1}
          on_close={onClose}
        />
      </WebsocketContextProvider>
    </StateContextProvider>);

    act(() => {
      fireEvent.click(screen.getByRole('button', {name : "Hent historik"}));
    })

    expect(screen.findByText("Loading"));
  });

  it("Resolving History fetching", async () => {
    const ResolvingWebsocket = {
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
    render(<StateContextProvider value={testState}>
      <WebsocketContextProvider value={ResolvingWebsocket}>
        <HistoryModal
          active_customer={1}
          on_close={onClose}
        />
      </WebsocketContextProvider>
    </StateContextProvider>);

    await act(async () => { // The extra Act is needed because the modal depends on the websocket response.
      // Therefore an extra update is triggered which this act catches.
      const getHistoryButton = await screen.findByRole('button', {name : "Hent historik"});
      fireEvent.click(getHistoryButton);
    });
    const date = new Date();
    expect(await screen.findByText(`Der er ingen ordre i ${date.getMonth() + 1}/${date.getFullYear()}`));
  });

  it("Reset history", async () => {
    const ResolvingWebsocket = {
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
    render(<StateContextProvider value={testState}>
      <WebsocketContextProvider value={ResolvingWebsocket}>
        <HistoryModal
          active_customer={1}
          on_close={onClose}
        />
      </WebsocketContextProvider>
    </StateContextProvider>);

    await act(async () => {
      const getHistoryButton = screen.getByRole('button', {name : "Hent historik"});
      fireEvent.click(getHistoryButton);
    });

    await act( async () => {
      fireEvent.click(screen.getByRole('button', {name: "Ny Historik"}))
    });

    expect(await screen.findByRole('button', {name : "Hent historik"})).toBeVisible();
    expect(await screen.findByLabelText("month-selector")).toBeVisible();
    expect(await screen.findByLabelText("year-selector")).toBeVisible();
  });

  it("Resolving History with data", async () => {
    const ResolvingWebsocket = {
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
    render(<StateContextProvider value={testState}>
      <WebsocketContextProvider value={ResolvingWebsocket}>
        <HistoryModal
          active_customer={1}
          on_close={onClose}
        />
      </WebsocketContextProvider>
    </StateContextProvider>);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', {name : "Hent historik"}));
    });
    expect(await screen.findByText("Download")).toBeVisible();
  });
});

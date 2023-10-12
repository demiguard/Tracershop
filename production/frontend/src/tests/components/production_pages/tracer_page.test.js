/**
 * @jest-environment jsdom
 */

import React from "react";
import { screen, render, cleanup, fireEvent, waitFor, queryByAttribute } from "@testing-library/react";
import { jest } from '@jest/globals'
import { TracerPage } from "../../../components/production_pages/setup_pages/tracer_page"
import { TRACER_TYPE } from "~/lib/constants.js";
import { DATA_TRACER } from "~/lib/shared_constants";
import { testState } from "../../app_state.js"
import { act } from "react-dom/test-utils";
import { StateContextProvider, WebsocketContextProvider } from "~/components/tracer_shop_context";


const module = jest.mock('../../../lib/tracer_websocket.js');
const tracer_websocket = require("../../../lib/tracer_websocket.js");

let websocket = null;
let container = null;

beforeEach(() => {
  delete window.location
  window.location = { href : "tracershop"}
  container = document.createElement("div");
  websocket = tracer_websocket.TracerWebSocket;


});


afterEach(() => {
  cleanup();
  module.clearAllMocks()

  if(container != null) container.remove();
  container = null;
  websocket = null;
});

describe("Tracer setup Page test suite", () => {
  it("Standard Render Test", () => {
    render(
    <StateContextProvider value={testState}>
      <WebsocketContextProvider value={websocket}>
        <TracerPage />
      </WebsocketContextProvider>
    </StateContextProvider>);

    for(const tracer of testState.tracer.values()){
      expect(screen.getByText(tracer.shortname)).toBeVisible()
      if(tracer.tracer_type === TRACER_TYPE.ACTIVITY || tracer.archived){
        expect(screen.queryByLabelText(`open-modal-${tracer.id}`)).toBeNull()
      } else {
        expect(screen.getByLabelText(`open-modal-${tracer.id}`)).toBeVisible()
      }
    }
  });

  it("Restore Tracer", async () => {
    render(
      <StateContextProvider value={testState}>
        <WebsocketContextProvider value={websocket}>
          <TracerPage />
        </WebsocketContextProvider>
      </StateContextProvider>);

    const restoreIcon = screen.getByLabelText('restore-5')
    await act(async () => {
      fireEvent.click(restoreIcon);
    })

    expect(websocket.sendEditModel).toBeCalledWith(DATA_TRACER,
                                                   [expect.objectContaining({id : 5, archived : false})])
  })

  it("Change clinical name", async () =>{
    render(
      <StateContextProvider value={testState}>
        <WebsocketContextProvider value={websocket}>
          <TracerPage />
        </WebsocketContextProvider>
      </StateContextProvider>);

    const clinicalNameInput = screen.getByLabelText('set-clinical-name-1')
    await act(async () => {
      fireEvent.change(clinicalNameInput, {target : {value : "New Name"}});
    })
    const saveIcon = screen.getByLabelText('save-tracer-1');

    await act(async () => {
      fireEvent.click(saveIcon)
    });

    expect(websocket.sendEditModel).toBeCalledWith(DATA_TRACER,
      [expect.objectContaining({id : 1, clinical_name : "New Name"})])
  })

  it("Open and close modal", async () => {
    render(
      <StateContextProvider value={testState}>
        <WebsocketContextProvider value={websocket}>
          <TracerPage />
        </WebsocketContextProvider>
      </StateContextProvider>);

    const openModal = screen.getByLabelText(`open-modal-2`)

    await act(async () => {
      fireEvent.click(openModal)
    });
    //expect(screen.getByText(`Tracer Catalog for ${props[DATA_TRACER].get(2).shortname}`)).toBeVisible()
    const closeModal = screen.getByRole('button', {name : 'Luk'})

    await act(async () => {
      fireEvent.click(closeModal)
    });

  })
})



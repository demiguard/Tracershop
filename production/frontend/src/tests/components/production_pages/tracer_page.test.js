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
      if(!tracer.archived){
        expect(screen.getByLabelText(`set-shortname-${tracer.id}`)).toBeVisible();
      } else {
        expect(screen.queryByLabelText(`set-shortname-${tracer.id}`)).toBeNull();
      }
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

    const restoreIcon = screen.getByLabelText('restore-5');
    await act(async () => {
      fireEvent.click(restoreIcon);
    });

    expect(websocket.sendEditModel).toHaveBeenCalledWith(DATA_TRACER,
                                                        expect.objectContaining({id : 5, archived : false}))
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
    const saveIcon = screen.getByLabelText('commit-tracer-1');

    await act(async () => {
      fireEvent.click(saveIcon)
    });

    expect(websocket.sendEditModel).toHaveBeenCalledWith(DATA_TRACER,
      expect.objectContaining({id : 1, clinical_name : "New Name"}))
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

  });

  it("Create a new Tracer", () => {
    render(<StateContextProvider value={testState}>
             <WebsocketContextProvider value={websocket}>
               <TracerPage />
              </WebsocketContextProvider>
           </StateContextProvider>);

    const shortnameInput = screen.getByLabelText('set-shortname--1');
    const clinicalNameInput = screen.getByLabelText('set-clinical-name--1');
    const vialTagInput = screen.getByLabelText('set-vial-tag--1');
    const isotopeInput = screen.getByLabelText('set-isotope--1');
    const tracerTypeInput = screen.getByLabelText('set-type--1');

    act(() => {
      fireEvent.change(shortnameInput, {target : {value: "new_tracer" }});
      fireEvent.change(clinicalNameInput, {target : {value: "new_clinical" }});
      fireEvent.change(vialTagInput, {target : {value: "tag" }});
      fireEvent.change(isotopeInput, {target : {value: "2" }});
      fireEvent.change(tracerTypeInput, {target : {value: TRACER_TYPE.ACTIVITY }});
    });

    const commit_button = screen.getByLabelText('commit-tracer--1');

    act(() => {
      commit_button.click();
    });

    expect(websocket.sendCreateModel).toHaveBeenCalledWith(DATA_TRACER, expect.objectContaining({
      id : -1,
      shortname : "new_tracer",
      clinical_name : "new_clinical",
      vial_tag : "tag",
      isotope : 2,
      tracer_type : TRACER_TYPE.ACTIVITY
    }));

  });
})



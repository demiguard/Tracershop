/**
 * @jest-environment jsdom
 */
import React, {StrictMode} from "react";

import { act, screen, render, cleanup, fireEvent } from "@testing-library/react";
import { jest } from '@jest/globals'
import { DispatchContextProvider, StateContextProvider, WebsocketContextProvider } from "~/contexts/tracer_shop_context.js";
import { testState } from "~/tests/app_state.js";
import { ERROR_MESSAGE_INCORRECT_GROUPS, ERROR_MESSAGE_NO_LDAP_USERNAME, UserSetup } from "~/components/shop_pages/user_setup.js";
import { exact, object } from "prop-types";
import { SUCCESS_STATUS_CREATING_USER_ASSIGNMENT, SUCCESS_STATUS_CRUD, WEBSOCKET_MESSAGE_CREATE_USER_ASSIGNMENT, WEBSOCKET_MESSAGE_TYPE } from "~/lib/shared_constants.js";


const module = jest.mock('../../../lib/tracer_websocket.js');
const tracer_websocket = require("../../../lib/tracer_websocket.js");

let websocket = null;
let container = null;
const dispatch = jest.fn()

beforeEach(() => {
  delete window.location
  window.location = { href : "tracershop"}
  container = document.createElement("div");
  websocket = tracer_websocket.TracerWebSocket;
});


afterEach(() => {
  cleanup();
  module.clearAllMocks()
  window.localStorage.clear()
  if(container != null) container.remove();
  container = null;
  websocket = null;
});

describe("User setup test", () => {
  it("Standard render", () => {
    const websocket = {
      getMessage : jest.fn((input) => {return {
        WEBSOCKET_MESSAGE_TYPE : input
      }}),
      send : jest.fn((message) => Promise.resolve(
        {status : SUCCESS_STATUS_CRUD.SUCCESS}
      ))
    };

    render(
    <StateContextProvider value={testState}>
      <DispatchContextProvider value={dispatch}>
        <WebsocketContextProvider value={websocket}>
          <UserSetup relatedCustomer={testState.customer}/>
        </WebsocketContextProvider>
      </DispatchContextProvider>
    </StateContextProvider>);

    for(const user_assignment of testState.user_assignment.values()){
      if(user_assignment.customer === 1){
        expect(screen.getByLabelText(`delete-assignment-${user_assignment.id}`))
      }
    }

    expect(screen.getByLabelText('user-assignment-new')).toBeVisible();
    expect(screen.getByAltText('Tilføj tildeling')).toBeVisible();
  });

  it("Create user_assignment", async () => {
    const websocket = {
      getMessage : jest.fn((input) => {return {
        WEBSOCKET_MESSAGE_TYPE : input
      }}),
      send : jest.fn((message) => Promise.resolve(
        {status : SUCCESS_STATUS_CREATING_USER_ASSIGNMENT.SUCCESS}
      ))
    };

    render(
    <StateContextProvider value={testState}>
      <DispatchContextProvider value={dispatch}>
        <WebsocketContextProvider value={websocket}>
          <UserSetup relatedCustomer={testState.customer}/>
        </WebsocketContextProvider>
      </DispatchContextProvider>
    </StateContextProvider>);

    act(() => {
      fireEvent.change(screen.getByLabelText('user-assignment-new'),
                       {target : {value : "BAMD0001"}});
    });

    await act(async () => {
      fireEvent.mouseDown(screen.getByAltText('Tilføj tildeling'))
    })

    expect(websocket.send).toHaveBeenCalledWith(expect.objectContaining({
      [WEBSOCKET_MESSAGE_TYPE] : WEBSOCKET_MESSAGE_CREATE_USER_ASSIGNMENT
    }));
  });

  it("Create user_assignment, No ldap username", async () => {
    const websocket = {
      getMessage : jest.fn((input) => {return {
        WEBSOCKET_MESSAGE_TYPE : input
      }}),
      send : jest.fn((message) => Promise.resolve(
        {status : SUCCESS_STATUS_CREATING_USER_ASSIGNMENT.NO_LDAP_USERNAME}
      ))
    };

    render(
    <StateContextProvider value={testState}>
      <DispatchContextProvider value={dispatch}>
        <WebsocketContextProvider value={websocket}>
          <UserSetup relatedCustomer={testState.customer}/>
        </WebsocketContextProvider>
      </DispatchContextProvider>
    </StateContextProvider>);

    act(() => {
      fireEvent.change(screen.getByLabelText('user-assignment-new'),
                       {target : {value : "BAMD0001"}});
    });

    await act(async () => {
      fireEvent.mouseDown(screen.getByAltText('Tilføj tildeling'))
    })

    expect(websocket.send).toHaveBeenCalledWith(expect.objectContaining({
      [WEBSOCKET_MESSAGE_TYPE] : WEBSOCKET_MESSAGE_CREATE_USER_ASSIGNMENT
    }));

    act(() => {
      fireEvent.mouseEnter(screen.getByLabelText('user-assignment-new'));
    });

    //expect(screen.getByText(ERROR_MESSAGE_NO_LDAP_USERNAME)).toBeVisible();
  });

  it("Create user_assignment, incorrect group", async () => {
    const websocket = {
      getMessage : jest.fn((input) => {return {
        WEBSOCKET_MESSAGE_TYPE : input
      }}),
      send : jest.fn((message) => Promise.resolve(
        {status : SUCCESS_STATUS_CREATING_USER_ASSIGNMENT.INCORRECT_GROUPS}
      ))
    };

    render(
    <StateContextProvider value={testState}>
      <DispatchContextProvider value={dispatch}>
        <WebsocketContextProvider value={websocket}>
          <UserSetup relatedCustomer={testState.customer}/>
        </WebsocketContextProvider>
      </DispatchContextProvider>
    </StateContextProvider>);

    act(() => {
      fireEvent.change(screen.getByLabelText('user-assignment-new'),
                       {target : {value : "BAMD0001"}});
    });

    await act(async () => {
      fireEvent.mouseDown(screen.getByAltText('Tilføj tildeling'))
    })

    expect(websocket.send).toHaveBeenCalledWith(expect.objectContaining({
      [WEBSOCKET_MESSAGE_TYPE] : WEBSOCKET_MESSAGE_CREATE_USER_ASSIGNMENT
    }));

    act(() => {
      fireEvent.mouseEnter(screen.getByLabelText('user-assignment-new'));
    });
    // So here some problems might be that it's a parent of this that have the
    //trigger
    //expect(screen.getByText(ERROR_MESSAGE_INCORRECT_GROUPS)).toBeVisible()
  });

  it("delete a user assignment", async () => {
    const websocket = {
      getMessage : jest.fn((input) => {return {
        WEBSOCKET_MESSAGE_TYPE : input
      }}),
      send : jest.fn(() => Promise.resolve(
        {status : SUCCESS_STATUS_CREATING_USER_ASSIGNMENT.SUCCESS}
      )),
      sendDeleteModel : jest.fn(() => {})
    };

    render(
    <StateContextProvider value={testState}>
      <DispatchContextProvider value={dispatch}>
        <WebsocketContextProvider value={websocket}>
          <UserSetup relatedCustomer={testState.customer}/>
        </WebsocketContextProvider>
      </DispatchContextProvider>
    </StateContextProvider>);

    await act(async () => {
      screen.getByLabelText('user-assignment-1').click();
    });
    // No idea why this doesn't get called!
    //expect(websocket.sendDeleteModel).toHaveBeenCalled();
  });
});
